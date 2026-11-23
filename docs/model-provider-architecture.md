# Model-Provider Architecture
**Version:** 1.0
**Created:** 2026-03-07
**Status:** Design Proposal

---

## Executive Summary

This document proposes a comprehensive architecture for managing AI model providers, their available models, API key validation, and user experience in the OpenClaw agent swarm monitor. The design addresses critical gaps in the current implementation:

1. No centralized model catalog or provider-to-model mapping
2. No validation of API keys before showing models
3. Unclear UX when users select models without required API keys
4. Hardcoded model lists with no extensibility

**Key Design Principles:**
- **Provider-first organization**: Models grouped by provider for clear ownership
- **Validation-driven UX**: Show only accessible models based on configured API keys
- **Security by design**: API key validation happens server-side with proper isolation
- **Extensibility**: Easy addition of new providers and models without code changes
- **Graceful degradation**: System works with limited API keys, guiding users to configure needed providers

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Model Catalog Structure](#2-model-catalog-structure)
3. [API Key Management](#3-api-key-management)
4. [Model Selection UX](#4-model-selection-ux)
5. [Backend Integration](#5-backend-integration)
6. [Extensibility & Future-Proofing](#6-extensibility--future-proofing)
7. [Data Structures](#7-data-structures)
8. [API Contracts](#8-api-contracts)
9. [Migration Plan](#9-migration-plan)
10. [Security Considerations](#10-security-considerations)
11. [UX Wireframes](#11-ux-wireframes)

---

## 1. Current State Analysis

### 1.1 Existing Implementation

**Model Storage:**
- Hardcoded `MODEL_OPTIONS` array in `/lib/openclaw-utils.ts` (4 models total)
- Provider prefix format: `provider/model-name` (e.g., `anthropic/claude-opus-4-5`)
- No metadata beyond display name

**API Key Storage:**
- Agent-level API keys stored in `agent.configuration.apiKeys`
- Format: `{ [providerId]: { key, masked, addedAt } }`
- Supported providers: 11 providers in `API_KEY_PROVIDERS` constant
- No validation before storage
- No connection to model availability

**Critical Gaps:**
1. User can select `openai/gpt-4o` even if no OpenAI API key is configured
2. No way to know which models require which keys
3. No automatic filtering of unavailable models
4. No model capabilities metadata (context window, vision support, cost)
5. Hardcoded lists prevent dynamic model updates (e.g., when GPT-5 launches)

### 1.2 User Pain Points

**Agent Creation:**
- User selects "GPT-4o" → Agent fails at runtime because no OpenAI key configured
- No visual indicator that a model requires an unconfigured provider
- Error messages appear only after provisioning attempt

**Settings Management:**
- User adds API keys but doesn't know which models become available
- No feedback loop between API key configuration and model selection

---

## 2. Model Catalog Structure

### 2.1 Proposed Catalog Schema

```typescript
/**
 * Model Catalog Entry
 * Defines a single AI model with all metadata needed for selection and runtime
 */
interface ModelCatalogEntry {
  // Identity
  id: string;                    // Unique identifier: "anthropic/claude-opus-4-5"
  providerId: string;            // Provider: "anthropic" (links to ApiKeyProvider)
  providerName: string;          // Display: "Anthropic"

  // Display metadata
  displayName: string;           // "Claude Opus 4.5"
  description?: string;          // "Most capable model for complex reasoning"

  // Capabilities
  contextWindow: number;         // 200000 (tokens)
  supportsVision: boolean;       // true
  supportsStreaming: boolean;    // true
  supportsFunctionCalling: boolean; // true
  maxOutputTokens?: number;      // 8192

  // Cost & performance
  costTier: 'free' | 'low' | 'medium' | 'high' | 'premium';
  inputPricePerMToken?: number;  // $15 per million input tokens
  outputPricePerMToken?: number; // $75 per million output tokens

  // Lifecycle
  status: 'beta' | 'stable' | 'deprecated';
  releaseDate?: string;          // "2025-01-15"
  deprecationDate?: string;      // null
  replacementModelId?: string;   // "anthropic/claude-opus-5" (if deprecated)

  // Metadata
  tags?: string[];               // ["reasoning", "coding", "vision"]
  isRecommended?: boolean;       // true (for default selection)
  sortOrder?: number;            // 10 (lower = appears first)
}

/**
 * Provider Catalog Entry
 * Defines an AI provider with authentication and model grouping
 */
interface ProviderCatalogEntry {
  id: string;                    // "anthropic"
  name: string;                  // "Anthropic"
  website?: string;              // "https://anthropic.com"
  apiDocsUrl?: string;           // "https://docs.anthropic.com"
  requiresApiKey: boolean;       // true
  supportsCustomEndpoint: boolean; // false (true for OpenRouter, local models)
  logoUrl?: string;              // "/providers/anthropic.svg"
  status: 'active' | 'inactive';
}
```

### 2.2 Catalog Organization Strategy

**Option A: Provider-first Grouping** (RECOMMENDED)
```typescript
{
  "anthropic": {
    provider: { id: "anthropic", name: "Anthropic", ... },
    models: [
      { id: "anthropic/claude-opus-4-5", ... },
      { id: "anthropic/claude-sonnet-4", ... }
    ]
  },
  "openai": {
    provider: { id: "openai", name: "OpenAI", ... },
    models: [
      { id: "openai/gpt-4o", ... },
      { id: "openai/gpt-4-turbo", ... }
    ]
  }
}
```

**Rationale:**
- Natural grouping for UI (dropdown sections or tabs)
- Clear ownership of models → provider → API key requirement
- Easy to filter "show only models from providers I've configured"

**Option B: Flat Model Array with Provider References**
```typescript
[
  { id: "anthropic/claude-opus-4-5", providerId: "anthropic", ... },
  { id: "openai/gpt-4o", providerId: "openai", ... }
]
```

**Rejected because:**
- Requires client-side grouping logic
- Harder to ensure provider metadata consistency
- No clear entry point for "what providers exist?"

### 2.3 Model Versioning Strategy

**Challenge:** How to handle model updates (e.g., `gpt-4-0125-preview` → `gpt-4-0613`)?

**Proposed Solution: Alias System**
```typescript
interface ModelAlias {
  aliasId: string;        // "openai/gpt-4"
  targetModelId: string;  // "openai/gpt-4-0125-preview"
  description?: string;   // "Always resolves to latest GPT-4 snapshot"
}
```

**Example:**
- User selects `openai/gpt-4` (alias)
- Backend resolves to `openai/gpt-4-0125-preview` (actual model)
- When `gpt-4-0613` launches, admin updates alias → zero user disruption

**Deprecated Model Workflow:**
1. Mark model `status: 'deprecated'`
2. Set `replacementModelId: "new-model-id"`
3. UI shows warning badge: "⚠️ Deprecated — Upgrade to GPT-5"
4. Cron job auto-migrates agents after 90-day grace period

---

## 3. API Key Management

### 3.1 Current vs Proposed Architecture

**Current (Agent-level Storage):**
```typescript
// Stored in agent.configuration.apiKeys
{
  "anthropic": { key: "sk-ant-...", masked: "sk-ant-***...xyz", addedAt: "2026-03-01T..." }
}
```

**Problems:**
- Same API key duplicated across multiple agents (waste)
- No centralized key rotation
- Hard to track "which agents use OpenAI keys?"

**Proposed (User-level + Agent Reference):**
```typescript
// User's API keys (in user_api_keys table)
UserApiKey {
  keyId: UUID;
  userId: UUID;
  providerId: string;
  keyValue: string;        // Encrypted at rest
  maskedKey: string;       // "sk-ant-***...xyz"
  validationStatus: 'pending' | 'valid' | 'invalid' | 'expired';
  lastValidatedAt: DateTime;
  createdAt: DateTime;
  expiresAt?: DateTime;    // For rotating keys
}

// Agent references keys (in agent.configuration)
{
  "providerApiKeyMappings": {
    "anthropic": "550e8400-e29b-41d4-a716-446655440000",  // References UserApiKey.keyId
    "openai": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

**Benefits:**
- Single key → many agents
- Update key once, affects all agents
- Delete key → all agents show "API key required" warning
- Track usage: "This OpenAI key is used by 5 agents"

### 3.2 API Key Validation Flow

**Pre-Save Validation (Test Connection):**
```
User clicks "Test Connection"
  → Frontend calls POST /api/v1/settings/api-keys/test
    Payload: { providerId: "anthropic", keyValue: "sk-ant-..." }
  → Backend makes test request to provider API
    Anthropic: POST /v1/messages (with minimal payload)
    OpenAI: POST /v1/chat/completions (with minimal payload)
  → Response:
    {
      valid: true,
      providerName: "Anthropic",
      quotaInfo: {
        remainingTokens: 1000000,
        resetDate: "2026-04-01T00:00:00Z"
      }
    }
  → Frontend shows ✓ "Valid — 1M tokens remaining" OR ✗ "Invalid — 401 Unauthorized"
```

**Post-Save Re-Validation (Background):**
- Cron job runs every 6 hours
- Tests all `validationStatus: 'valid'` keys
- If test fails → set `validationStatus: 'invalid'`
- Webhook to Slack: "⚠️ OpenAI API key expired for user@example.com"

**Runtime Validation (Agent Provisioning):**
```
Agent selects model "openai/gpt-4o"
  → Backend checks: Does agent have OpenAI key mapping?
    NO → Return error: "OpenAI API key required. Configure in Settings → API Keys"
    YES → Fetch UserApiKey by keyId
      → Check validationStatus
        'invalid' → Return error: "OpenAI API key is invalid. Re-test in Settings"
        'valid' → Proceed with provisioning
```

### 3.3 Key Rotation & Expiration

**Rotation Workflow:**
1. User clicks "Rotate Key" for existing key
2. Modal shows: "Add new OpenAI key. Old key will remain active for 7 days."
3. User adds new key → backend creates new `UserApiKey` record
4. All agents automatically use new key (via same `keyId` reference)
5. Old key marked `expiresAt: now() + 7 days`
6. After 7 days, cron deletes old key

**Expiration Notification:**
- Email sent 3 days before `expiresAt`
- In-app banner: "Your OpenAI API key expires in 3 days"
- Auto-pause agents using expired keys (prevents quota waste)

---

## 4. Model Selection UX

### 4.1 UX Requirement: "Don't Show Inaccessible Models"

**Current Problem:**
- All 4 models shown regardless of API key configuration
- User selects GPT-4o → fails at runtime

**Proposed Solution: Conditional Model Filtering**

```typescript
// Frontend calls on component mount
GET /api/v1/models/available
  → Backend returns only models where user has valid API keys

Response:
{
  "availableModels": [
    { id: "anthropic/claude-opus-4-5", ... },  // ✓ User has Anthropic key
    { id: "anthropic/claude-sonnet-4", ... }   // ✓ User has Anthropic key
    // ✗ GPT-4o NOT included (no OpenAI key)
  ],
  "unavailableModels": [
    {
      id: "openai/gpt-4o",
      requiredProviderId: "openai",
      requiredProviderName: "OpenAI"
    }
  ]
}
```

**UI Rendering:**
```tsx
<Select>
  <SelectGroup label="Available Models">
    {availableModels.map(model => (
      <SelectItem value={model.id}>{model.displayName}</SelectItem>
    ))}
  </SelectGroup>

  <SelectGroup label="Configure API Key to Unlock">
    {unavailableModels.map(model => (
      <SelectItem value={model.id} disabled>
        {model.displayName}
        <Badge>Requires {model.requiredProviderName}</Badge>
      </SelectItem>
    ))}
  </SelectGroup>
</Select>
```

### 4.2 Model Grouping Options

**Option 1: Provider Grouping** (RECOMMENDED for Creation Dialog)
```
┌─────────────────────────────────┐
│ Model                           │
├─────────────────────────────────┤
│ Anthropic (2 models)            │
│   ● Claude Opus 4.5             │
│   ○ Claude Sonnet 4             │
│                                 │
│ OpenAI (Requires API Key) 🔒    │
│   ○ GPT-4o (disabled)           │
│                                 │
│ Google AI (Requires API Key) 🔒 │
│   ○ Gemini 2.0 Flash (disabled) │
└─────────────────────────────────┘
```

**Option 2: Capability Grouping** (for Advanced Settings)
```
┌─────────────────────────────────┐
│ Model                           │
├─────────────────────────────────┤
│ Vision Models                   │
│   ● Claude Opus 4.5             │
│   ○ GPT-4o (Requires OpenAI) 🔒│
│                                 │
│ Fast & Affordable               │
│   ○ Claude Sonnet 4             │
│   ○ Gemini Flash (Requires...) 🔒│
└─────────────────────────────────┘
```

**Option 3: Flat List with Inline Badges**
```
┌─────────────────────────────────┐
│ Model                           │
├─────────────────────────────────┤
│ ● Claude Opus 4.5               │
│ ○ Claude Sonnet 4               │
│ ○ GPT-4o 🔒 Requires OpenAI     │
│ ○ Gemini 2.0 Flash 🔒 Requires.│
└─────────────────────────────────┘
```

**Recommendation:** Use **Option 1** (provider grouping) because:
- Clear mental model: "I have Anthropic keys → I can use these models"
- Encourages API key configuration (shows what's locked)
- Matches industry standard (OpenRouter, LangChain UI)

### 4.3 Handling Missing API Keys

**Scenario:** User selects locked model

**Flow:**
1. User clicks on disabled `GPT-4o` option
2. Modal appears:
   ```
   ┌──────────────────────────────────────────┐
   │  🔑 OpenAI API Key Required              │
   ├──────────────────────────────────────────┤
   │  To use GPT-4o, you need to add an       │
   │  OpenAI API key.                         │
   │                                          │
   │  [Go to Settings → API Keys]   [Cancel] │
   └──────────────────────────────────────────┘
   ```
3. Clicking "Go to Settings" opens Settings tab with API Keys section pre-scrolled
4. After adding key, return to agent creation with GPT-4o now unlocked

**Alternative (More Aggressive):**
- Clicking locked model directly opens "Add OpenAI API Key" modal
- User adds key inline without leaving agent creation flow
- Pros: Faster conversion, less context switching
- Cons: Breaks user expectation that Settings is centralized key management

---

## 5. Backend Integration

### 5.1 Required Backend Endpoints

#### 5.1.1 Model Catalog Endpoints

```typescript
/**
 * GET /api/v1/models
 * Returns full model catalog
 */
Response: {
  providers: ProviderCatalogEntry[];
  models: ModelCatalogEntry[];
  aliases: ModelAlias[];
}

/**
 * GET /api/v1/models/available
 * Returns only models accessible to current user (filtered by API keys)
 * CRITICAL: This is the primary endpoint for UI rendering
 */
Query Params:
  - includeUnavailable: boolean (default: true)
    If true, returns unavailableModels array

Response: {
  availableModels: ModelCatalogEntry[];
  unavailableModels: {
    id: string;
    displayName: string;
    requiredProviderId: string;
    requiredProviderName: string;
  }[];
}

/**
 * GET /api/v1/models/{modelId}
 * Get detailed model metadata
 */
Response: ModelCatalogEntry

/**
 * GET /api/v1/providers
 * List all supported providers
 */
Response: ProviderCatalogEntry[]

/**
 * GET /api/v1/providers/{providerId}/models
 * List all models for a specific provider
 */
Response: ModelCatalogEntry[]
```

#### 5.1.2 API Key Validation Endpoints

```typescript
/**
 * POST /api/v1/settings/api-keys/validate
 * Validate API key before saving (test connection)
 */
Request: {
  providerId: string;
  keyValue: string;
  endpoint?: string;  // For custom endpoints (OpenRouter, local)
}

Response: {
  valid: boolean;
  providerName?: string;
  errorMessage?: string;
  quotaInfo?: {
    remainingTokens?: number;
    remainingRequests?: number;
    resetDate?: string;
    currentTier?: string;
  };
  modelAccess?: {
    availableModels: string[];  // List of model IDs this key can access
    restrictedModels?: string[]; // Models user wants but key can't access
  };
}

/**
 * POST /api/v1/settings/api-keys/batch-validate
 * Re-validate all user's API keys (triggered by cron or manual refresh)
 */
Response: {
  results: Array<{
    keyId: UUID;
    providerId: string;
    valid: boolean;
    lastValidatedAt: DateTime;
  }>;
}
```

#### 5.1.3 Agent Provisioning Changes

```typescript
/**
 * POST /api/v1/agents
 * Create agent - MODIFIED to validate model access
 */
Request: {
  name: string;
  model: string;  // e.g., "anthropic/claude-opus-4-5"
  persona?: string;
  heartbeat?: HeartbeatConfig;
}

// Backend logic:
1. Parse model ID → extract providerId
2. Check if user has valid API key for providerId
   → NO: Return 400 Bad Request with error:
     {
       error: "API_KEY_REQUIRED",
       message: "OpenAI API key required for model openai/gpt-4o",
       requiredProviderId: "openai"
     }
   → YES: Proceed
3. Validate model exists in catalog
   → NO: Return 404 Not Found
   → YES: Proceed
4. Create agent with API key reference

/**
 * PATCH /api/v1/agents/{agentId}/settings
 * Update agent settings - MODIFIED to validate model changes
 */
Request: {
  model?: string;
  // ... other settings
}

// Backend logic:
1. If model changed, repeat validation from POST /agents
2. If old model used different provider, update providerApiKeyMappings
```

### 5.2 Database Schema Changes

#### 5.2.1 New Tables

```sql
-- Provider catalog (seeded by migrations, admin-managed)
CREATE TABLE model_providers (
  provider_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  api_docs_url VARCHAR(255),
  requires_api_key BOOLEAN DEFAULT TRUE,
  supports_custom_endpoint BOOLEAN DEFAULT FALSE,
  logo_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Model catalog (seeded by migrations, admin-managed)
CREATE TABLE model_catalog (
  model_id VARCHAR(100) PRIMARY KEY,  -- "anthropic/claude-opus-4-5"
  provider_id VARCHAR(50) REFERENCES model_providers(provider_id),
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  context_window INTEGER NOT NULL,
  supports_vision BOOLEAN DEFAULT FALSE,
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT FALSE,
  max_output_tokens INTEGER,
  cost_tier VARCHAR(20) DEFAULT 'medium',
  input_price_per_mtoken DECIMAL(10, 6),
  output_price_per_mtoken DECIMAL(10, 6),
  status VARCHAR(20) DEFAULT 'stable',
  release_date DATE,
  deprecation_date DATE,
  replacement_model_id VARCHAR(100) REFERENCES model_catalog(model_id),
  tags TEXT[],  -- PostgreSQL array
  is_recommended BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_model_catalog_provider ON model_catalog(provider_id);
CREATE INDEX idx_model_catalog_status ON model_catalog(status);

-- Model aliases (e.g., "gpt-4" → "gpt-4-0125-preview")
CREATE TABLE model_aliases (
  alias_id VARCHAR(100) PRIMARY KEY,
  target_model_id VARCHAR(100) REFERENCES model_catalog(model_id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (already exists per issue #96, but adding validation fields)
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX idx_user_api_keys_validation ON user_api_keys(validation_status);
```

#### 5.2.2 Modified Tables

```sql
-- AgentSwarmInstance: Store provider-to-key mappings
-- Note: configuration JSON field already exists, we'll use it
-- New structure in configuration.providerApiKeyMappings:
-- {
--   "anthropic": "550e8400-e29b-41d4-a716-446655440000",  -- keyId from user_api_keys
--   "openai": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
-- }

-- No ALTER needed, just document the JSON schema
```

### 5.3 Service Layer Architecture

```python
# backend/services/model_catalog_service.py
class ModelCatalogService:
    """Centralized model catalog management"""

    def get_all_models(self) -> List[ModelCatalogEntry]:
        """Returns all models in catalog"""

    def get_available_models(self, user_id: UUID) -> Dict[str, List[ModelCatalogEntry]]:
        """
        Returns models filtered by user's valid API keys
        Returns: {
            "availableModels": [...],
            "unavailableModels": [...]
        }
        """
        # 1. Fetch user's API keys with validation_status = 'valid'
        # 2. Extract providerIds from valid keys
        # 3. Query model_catalog WHERE provider_id IN (valid_provider_ids)
        # 4. Query model_catalog WHERE provider_id NOT IN (valid_provider_ids) for unavailable

    def resolve_model_alias(self, alias_id: str) -> str:
        """Resolves alias to actual model ID"""

    def get_model_by_id(self, model_id: str) -> Optional[ModelCatalogEntry]:
        """Fetch model metadata"""

    def validate_model_access(self, user_id: UUID, model_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user can use this model
        Returns: (can_access: bool, error_message: Optional[str])
        """
        # 1. Parse model_id → extract provider_id
        # 2. Check user_api_keys for valid key with this provider_id
        # 3. Return (True, None) if found, else (False, "OpenAI API key required")

# backend/services/api_key_validation_service.py
class ApiKeyValidationService:
    """Handles API key testing and validation"""

    async def validate_key(self, provider_id: str, key_value: str) -> ValidationResult:
        """
        Test API key by making real request to provider
        Uses strategy pattern for provider-specific logic
        """
        validator = self._get_validator(provider_id)
        return await validator.validate(key_value)

    async def batch_revalidate_user_keys(self, user_id: UUID) -> List[ValidationResult]:
        """Background job: re-test all user's keys"""

    def _get_validator(self, provider_id: str) -> BaseProviderValidator:
        """Factory method for provider-specific validators"""
        # Returns AnthropicValidator, OpenAIValidator, etc.

# Provider-specific validators
class AnthropicValidator(BaseProviderValidator):
    async def validate(self, key_value: str) -> ValidationResult:
        # POST https://api.anthropic.com/v1/messages
        # Minimal payload: {"model": "claude-3-haiku-20240307", "messages": [...], "max_tokens": 1}
        # Check: 200 OK → valid, 401 → invalid, 429 → valid but quota exceeded
```

---

## 6. Extensibility & Future-Proofing

### 6.1 Adding New Providers

**Current Process (Hardcoded):**
1. Edit `API_KEY_PROVIDERS` constant
2. Edit `MODEL_OPTIONS` constant
3. Deploy frontend + backend
4. Hope nothing breaks

**Proposed Process (Database-Driven):**
1. Admin runs migration script:
   ```sql
   INSERT INTO model_providers VALUES ('mistral', 'Mistral AI', ...);
   INSERT INTO model_catalog VALUES
     ('mistral/mistral-large', 'mistral', 'Mistral Large', ..., 'stable'),
     ('mistral/mistral-small', 'mistral', 'Mistral Small', ..., 'stable');
   ```
2. Backend API automatically serves new models via `GET /api/v1/models`
3. Frontend re-fetches model list → new options appear
4. Zero code changes required

**Admin UI (Future Enhancement):**
```
┌────────────────────────────────────────────┐
│  Add New Model                             │
├────────────────────────────────────────────┤
│  Provider:         [Mistral AI ▼]          │
│  Model ID:         mistral/mistral-large   │
│  Display Name:     Mistral Large           │
│  Context Window:   128000                  │
│  Cost Tier:        [Medium ▼]              │
│  Status:           [Stable ▼]              │
│                                            │
│  [Cancel]                      [Add Model] │
└────────────────────────────────────────────┘
```

### 6.2 Custom Model Endpoints

**Use Case:** User wants to use self-hosted LLaMA 3 via OpenRouter or local Ollama

**Architecture:**
```typescript
// Agent configuration
{
  "customModelEndpoints": {
    "my-local-llama": {
      endpoint: "http://localhost:11434/v1/chat/completions",
      apiKeyHeaderName: "Authorization",  // Or "X-API-Key"
      modelId: "llama3:8b",
      providerId: "ollama",
      displayName: "Local LLaMA 3 8B"
    }
  }
}
```

**UX:**
- Settings → API Keys → "Add Custom Endpoint" button
- Form: Endpoint URL, Model ID, API Key (optional), Test Connection
- On success → model appears in model selector as "Custom: Local LLaMA 3 8B"

**Backend Changes:**
- Modify `AgentSwarmLifecycleService.provision_agent()` to check `customModelEndpoints`
- If model ID matches custom endpoint → use custom URL instead of default provider API

### 6.3 Model Marketplace (Future Vision)

**Concept:** Community-contributed model configurations

**Flow:**
1. User browses "Model Marketplace" in Settings
2. Discovers "Groq Llama 3.1 70B (Ultra-fast inference)"
3. Clicks "Install" → backend adds to their model catalog
4. User enters Groq API key
5. Model becomes available in agent creation

**Implementation:**
- `model_catalog_source` table with `source: 'official' | 'community' | 'custom'`
- Community models require manual approval before appearing in marketplace
- Prevents malicious endpoints

---

## 7. Data Structures

### 7.1 TypeScript Types (Frontend)

```typescript
// types/model-catalog.ts

/**
 * Provider Catalog Entry
 */
export interface ProviderCatalogEntry {
  id: string;
  name: string;
  website?: string;
  apiDocsUrl?: string;
  requiresApiKey: boolean;
  supportsCustomEndpoint: boolean;
  logoUrl?: string;
  status: 'active' | 'inactive';
}

/**
 * Model Catalog Entry
 */
export interface ModelCatalogEntry {
  id: string;
  providerId: string;
  providerName: string;
  displayName: string;
  description?: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxOutputTokens?: number;
  costTier: 'free' | 'low' | 'medium' | 'high' | 'premium';
  inputPricePerMToken?: number;
  outputPricePerMToken?: number;
  status: 'beta' | 'stable' | 'deprecated';
  releaseDate?: string;
  deprecationDate?: string;
  replacementModelId?: string;
  tags?: string[];
  isRecommended?: boolean;
  sortOrder?: number;
}

/**
 * Model Alias
 */
export interface ModelAlias {
  aliasId: string;
  targetModelId: string;
  description?: string;
}

/**
 * Available Models Response
 */
export interface AvailableModelsResponse {
  availableModels: ModelCatalogEntry[];
  unavailableModels: UnavailableModel[];
}

export interface UnavailableModel {
  id: string;
  displayName: string;
  requiredProviderId: string;
  requiredProviderName: string;
  providerLogoUrl?: string;
}

/**
 * API Key Validation Response
 */
export interface ApiKeyValidationResponse {
  valid: boolean;
  providerName?: string;
  errorMessage?: string;
  quotaInfo?: {
    remainingTokens?: number;
    remainingRequests?: number;
    resetDate?: string;
    currentTier?: string;
  };
  modelAccess?: {
    availableModels: string[];
    restrictedModels?: string[];
  };
}

/**
 * User API Key (Extended from existing types/api-keys.ts)
 */
export interface UserApiKey {
  keyId: string;
  providerId: string;
  providerName: string;
  maskedKey: string;
  validationStatus: 'pending' | 'valid' | 'invalid' | 'expired';
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  usedByAgents?: string[];  // List of agent IDs
}
```

### 7.2 Pydantic Schemas (Backend)

```python
# backend/schemas/model_catalog.py

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime

class CostTier(str, Enum):
    FREE = "free"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    PREMIUM = "premium"

class ModelStatus(str, Enum):
    BETA = "beta"
    STABLE = "stable"
    DEPRECATED = "deprecated"

class ProviderStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class ProviderCatalogEntry(BaseModel):
    id: str
    name: str
    website: Optional[str] = None
    api_docs_url: Optional[str] = None
    requires_api_key: bool = True
    supports_custom_endpoint: bool = False
    logo_url: Optional[str] = None
    status: ProviderStatus = ProviderStatus.ACTIVE

class ModelCatalogEntry(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    display_name: str
    description: Optional[str] = None
    context_window: int
    supports_vision: bool = False
    supports_streaming: bool = True
    supports_function_calling: bool = False
    max_output_tokens: Optional[int] = None
    cost_tier: CostTier = CostTier.MEDIUM
    input_price_per_mtoken: Optional[float] = None
    output_price_per_mtoken: Optional[float] = None
    status: ModelStatus = ModelStatus.STABLE
    release_date: Optional[date] = None
    deprecation_date: Optional[date] = None
    replacement_model_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_recommended: bool = False
    sort_order: int = 100

class ModelAlias(BaseModel):
    alias_id: str
    target_model_id: str
    description: Optional[str] = None

class UnavailableModel(BaseModel):
    id: str
    display_name: str
    required_provider_id: str
    required_provider_name: str
    provider_logo_url: Optional[str] = None

class AvailableModelsResponse(BaseModel):
    available_models: List[ModelCatalogEntry]
    unavailable_models: List[UnavailableModel]

class QuotaInfo(BaseModel):
    remaining_tokens: Optional[int] = None
    remaining_requests: Optional[int] = None
    reset_date: Optional[str] = None
    current_tier: Optional[str] = None

class ModelAccess(BaseModel):
    available_models: List[str]
    restricted_models: Optional[List[str]] = None

class ApiKeyValidationRequest(BaseModel):
    provider_id: str
    key_value: str
    endpoint: Optional[str] = None  # For custom endpoints

class ApiKeyValidationResponse(BaseModel):
    valid: bool
    provider_name: Optional[str] = None
    error_message: Optional[str] = None
    quota_info: Optional[QuotaInfo] = None
    model_access: Optional[ModelAccess] = None

class ValidationStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    EXPIRED = "expired"

class UserApiKey(BaseModel):
    key_id: str
    user_id: str
    provider_id: str
    provider_name: str
    masked_key: str
    validation_status: ValidationStatus
    last_validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    used_by_agents: Optional[List[str]] = None
```

### 7.3 Database Models (SQLAlchemy)

```python
# backend/models/model_catalog.py

from sqlalchemy import Column, String, Integer, Boolean, Numeric, Date, ARRAY, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from backend.db.base_class import Base

class ModelProvider(Base):
    __tablename__ = "model_providers"

    provider_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    website = Column(String(255))
    api_docs_url = Column(String(255))
    requires_api_key = Column(Boolean, default=True)
    supports_custom_endpoint = Column(Boolean, default=False)
    logo_url = Column(String(255))
    status = Column(String(20), default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ModelCatalog(Base):
    __tablename__ = "model_catalog"

    model_id = Column(String(100), primary_key=True)
    provider_id = Column(String(50), ForeignKey("model_providers.provider_id"), nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    context_window = Column(Integer, nullable=False)
    supports_vision = Column(Boolean, default=False)
    supports_streaming = Column(Boolean, default=True)
    supports_function_calling = Column(Boolean, default=False)
    max_output_tokens = Column(Integer)
    cost_tier = Column(String(20), default='medium')
    input_price_per_mtoken = Column(Numeric(10, 6))
    output_price_per_mtoken = Column(Numeric(10, 6))
    status = Column(String(20), default='stable')
    release_date = Column(Date)
    deprecation_date = Column(Date)
    replacement_model_id = Column(String(100), ForeignKey("model_catalog.model_id"))
    tags = Column(ARRAY(String))  # PostgreSQL array
    is_recommended = Column(Boolean, default=False)
    sort_order = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ModelAliases(Base):
    __tablename__ = "model_aliases"

    alias_id = Column(String(100), primary_key=True)
    target_model_id = Column(String(100), ForeignKey("model_catalog.model_id"), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## 8. API Contracts

### 8.1 Model Catalog Endpoints

```yaml
GET /api/v1/models
Summary: Get full model catalog
Auth: Required (Bearer token)
Query Parameters: None

Response 200:
  {
    "providers": [
      {
        "id": "anthropic",
        "name": "Anthropic",
        "website": "https://anthropic.com",
        "apiDocsUrl": "https://docs.anthropic.com",
        "requiresApiKey": true,
        "supportsCustomEndpoint": false,
        "logoUrl": "/providers/anthropic.svg",
        "status": "active"
      }
    ],
    "models": [
      {
        "id": "anthropic/claude-opus-4-5",
        "providerId": "anthropic",
        "providerName": "Anthropic",
        "displayName": "Claude Opus 4.5",
        "description": "Most capable model for complex reasoning",
        "contextWindow": 200000,
        "supportsVision": true,
        "supportsStreaming": true,
        "supportsFunctionCalling": true,
        "maxOutputTokens": 8192,
        "costTier": "premium",
        "inputPricePerMToken": 15.0,
        "outputPricePerMToken": 75.0,
        "status": "stable",
        "releaseDate": "2025-01-15",
        "tags": ["reasoning", "coding", "vision"],
        "isRecommended": true,
        "sortOrder": 10
      }
    ],
    "aliases": [
      {
        "aliasId": "claude-opus",
        "targetModelId": "anthropic/claude-opus-4-5",
        "description": "Always resolves to latest Claude Opus"
      }
    ]
  }
```

```yaml
GET /api/v1/models/available
Summary: Get models available to current user (filtered by API keys)
Auth: Required
Query Parameters:
  - includeUnavailable: boolean (default: true)

Response 200:
  {
    "availableModels": [
      {
        "id": "anthropic/claude-opus-4-5",
        "providerId": "anthropic",
        "displayName": "Claude Opus 4.5",
        ...
      }
    ],
    "unavailableModels": [
      {
        "id": "openai/gpt-4o",
        "displayName": "GPT-4o",
        "requiredProviderId": "openai",
        "requiredProviderName": "OpenAI",
        "providerLogoUrl": "/providers/openai.svg"
      }
    ]
  }
```

```yaml
POST /api/v1/settings/api-keys/validate
Summary: Validate API key before saving
Auth: Required
Request Body:
  {
    "providerId": "anthropic",
    "keyValue": "sk-ant-api03-...",
    "endpoint": null  // Optional for custom endpoints
  }

Response 200 (Valid):
  {
    "valid": true,
    "providerName": "Anthropic",
    "quotaInfo": {
      "remainingTokens": 1000000,
      "resetDate": "2026-04-01T00:00:00Z",
      "currentTier": "pro"
    },
    "modelAccess": {
      "availableModels": [
        "anthropic/claude-opus-4-5",
        "anthropic/claude-sonnet-4"
      ]
    }
  }

Response 200 (Invalid):
  {
    "valid": false,
    "errorMessage": "Invalid API key: 401 Unauthorized"
  }

Response 400 (Unsupported Provider):
  {
    "error": "UNSUPPORTED_PROVIDER",
    "message": "Provider 'unknown-provider' is not supported"
  }
```

### 8.2 Agent Creation/Update Validation

```yaml
POST /api/v1/agents
Summary: Create new agent
Auth: Required
Request Body:
  {
    "name": "My Agent",
    "model": "anthropic/claude-opus-4-5",
    "persona": "You are a helpful assistant",
    "heartbeat": {
      "enabled": true,
      "interval": "5m"
    }
  }

Response 201 (Success):
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Agent",
    "model": "anthropic/claude-opus-4-5",
    "status": "provisioning",
    ...
  }

Response 400 (API Key Required):
  {
    "error": "API_KEY_REQUIRED",
    "message": "OpenAI API key required for model openai/gpt-4o",
    "requiredProviderId": "openai",
    "requiredProviderName": "OpenAI"
  }

Response 400 (Invalid API Key):
  {
    "error": "INVALID_API_KEY",
    "message": "Your Anthropic API key is invalid or expired. Please update it in Settings.",
    "providerId": "anthropic"
  }

Response 404 (Model Not Found):
  {
    "error": "MODEL_NOT_FOUND",
    "message": "Model 'unknown/model-id' does not exist in catalog"
  }
```

---

## 9. Migration Plan

### Phase 1: Backend Foundation (Week 1)

**Goal:** Set up database and catalog without breaking existing agents

**Tasks:**
1. Create migration for new tables:
   - `model_providers`
   - `model_catalog`
   - `model_aliases`
   - Alter `user_api_keys` (add validation columns)

2. Seed initial data:
   ```sql
   INSERT INTO model_providers VALUES
     ('anthropic', 'Anthropic', 'https://anthropic.com', ...),
     ('openai', 'OpenAI', 'https://openai.com', ...),
     ('google', 'Google AI', 'https://ai.google.dev', ...);

   INSERT INTO model_catalog VALUES
     ('anthropic/claude-opus-4-5', 'anthropic', 'Claude Opus 4.5', ..., 200000, TRUE, ...),
     ('anthropic/claude-sonnet-4', 'anthropic', 'Claude Sonnet 4', ..., 200000, TRUE, ...),
     ('openai/gpt-4o', 'openai', 'GPT-4o', ..., 128000, TRUE, ...),
     ('google/gemini-2.0-flash', 'google', 'Gemini 2.0 Flash', ..., 1000000, TRUE, ...);
   ```

3. Implement service layer:
   - `ModelCatalogService.get_all_models()`
   - `ModelCatalogService.get_available_models(user_id)`
   - `ApiKeyValidationService.validate_key()`

4. Add new API endpoints (no frontend integration yet):
   - `GET /api/v1/models`
   - `GET /api/v1/models/available`
   - `POST /api/v1/settings/api-keys/validate`

**Validation:**
- All endpoints return 200 with seeded data
- Existing agent creation/updates still work (no breaking changes)
- API key validation works for Anthropic/OpenAI test keys

### Phase 2: API Key Validation UI (Week 2)

**Goal:** Add "Test Connection" button to Settings → API Keys

**Tasks:**
1. Update `AddApiKeyModal.tsx`:
   - Add "Test Connection" button
   - Call `POST /api/v1/settings/api-keys/validate` before save
   - Show validation result (✓ Valid / ✗ Invalid with error message)

2. Update `useApiKeys` hook:
   - Add `useTestApiKey()` mutation
   - Handle validation responses

3. Update `SettingsClient.tsx`:
   - Show validation status badge next to each key (Valid ✓ / Invalid ✗)
   - Add "Re-test" button for existing keys

**Validation:**
- User adds valid Anthropic key → shows "Valid ✓ 1M tokens remaining"
- User adds invalid key → shows "Invalid ✗ 401 Unauthorized" and prevents save
- Existing keys show validation status after re-test

### Phase 3: Model Filtering in UI (Week 3)

**Goal:** Show only models user can access based on API keys

**Tasks:**
1. Create `lib/model-catalog-service.ts`:
   ```typescript
   export async function getAvailableModels(includeUnavailable = true): Promise<AvailableModelsResponse> {
     const res = await fetch('/api/v1/models/available?includeUnavailable=' + includeUnavailable);
     return res.json();
   }
   ```

2. Create `hooks/useModelCatalog.ts`:
   ```typescript
   export function useAvailableModels() {
     return useQuery(['available-models'], () => getAvailableModels());
   }
   ```

3. Update `CreateAgentDialog.tsx`:
   - Replace hardcoded `MODEL_OPTIONS` with `useAvailableModels()`
   - Render available models as enabled options
   - Render unavailable models as disabled with "🔒 Requires {Provider}" badge

4. Update `AgentSettingsTab.tsx`:
   - Same filtering logic for model selector
   - Show warning if current model becomes unavailable (e.g., API key deleted)

**Validation:**
- User with only Anthropic key → sees only Claude models
- User with no API keys → sees all models as locked
- User adds OpenAI key → GPT models unlock immediately (query invalidation)

### Phase 4: Agent Provisioning Validation (Week 4)

**Goal:** Prevent agent creation if required API key missing

**Tasks:**
1. Update `agent_lifecycle_api_service.py`:
   ```python
   def create_agent(self, request: CreateAgentRequest):
       # 1. Parse model ID → extract provider_id
       provider_id = request.model.split('/')[0]

       # 2. Validate API key exists and is valid
       has_valid_key = self.model_catalog_service.validate_model_access(
           user_id=current_user.id,
           model_id=request.model
       )

       if not has_valid_key:
           raise HTTPException(
               status_code=400,
               detail={
                   "error": "API_KEY_REQUIRED",
                   "message": f"{provider_id} API key required",
                   "requiredProviderId": provider_id
               }
           )

       # 3. Create agent as before
   ```

2. Update frontend error handling:
   - Catch `API_KEY_REQUIRED` error
   - Show modal: "Add {Provider} API key to use this model"
   - Provide deep link to Settings → API Keys

**Validation:**
- User tries to create agent with locked model → error modal appears
- User adds required key → can create agent successfully
- Existing agents continue working (no retroactive validation)

### Phase 5: Advanced Features (Week 5+)

**Optional Enhancements:**
1. Background API key re-validation (cron job every 6 hours)
2. Key expiration warnings (email + in-app banner)
3. Model deprecation warnings in UI
4. Custom endpoint support for self-hosted models
5. Model marketplace (community-contributed configs)

### Rollback Plan

**If critical bug discovered:**
1. Revert to hardcoded `MODEL_OPTIONS` constant in frontend
2. Disable `GET /api/v1/models/available` endpoint (return empty arrays)
3. Remove API key validation from agent creation (allow all models)
4. Database tables remain (no data loss), just unused

**Rollback SQL:**
```sql
-- No destructive changes needed, just disable features in code
-- Tables can stay (no harm)
```

---

## 10. Security Considerations

### 10.1 API Key Storage

**Current Risk:** API keys stored in `agent.configuration` JSON field (not encrypted)

**Proposed Solution:**
1. User API keys encrypted at rest using AES-256
2. Encryption key stored in environment variable `API_KEY_ENCRYPTION_SECRET`
3. Key never returned to frontend (only masked version)
4. Key decrypted only at runtime when making provider API calls

**Implementation:**
```python
# backend/security/api_key_encryption.py
from cryptography.fernet import Fernet
import os

class ApiKeyEncryption:
    def __init__(self):
        secret = os.getenv('API_KEY_ENCRYPTION_SECRET')
        if not secret:
            raise ValueError("API_KEY_ENCRYPTION_SECRET not set")
        self.cipher = Fernet(secret.encode())

    def encrypt(self, plaintext: str) -> str:
        return self.cipher.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self.cipher.decrypt(ciphertext.encode()).decode()
```

### 10.2 API Key Validation Security

**Risk:** Malicious user tests thousands of API keys to find valid ones

**Mitigation:**
1. Rate limit: 5 validation attempts per user per minute
2. Exponential backoff: 1st fail = no delay, 2nd = 2s, 3rd = 4s, 4th = 8s...
3. After 10 failed validations → 1-hour lockout
4. Audit log all validation attempts (IP address, timestamp, success/failure)

**Implementation:**
```python
@router.post("/api/v1/settings/api-keys/validate")
@limiter.limit("5 per minute")
async def validate_api_key(request: ApiKeyValidationRequest, user_id: UUID):
    # Check lockout status
    if await is_user_locked_out(user_id):
        raise HTTPException(429, "Too many failed validation attempts. Try again in 1 hour.")

    # Attempt validation
    result = await validation_service.validate_key(request.provider_id, request.key_value)

    # Log audit trail
    await audit_logger.log_event(
        event_type="API_KEY_VALIDATION",
        user_id=user_id,
        metadata={
            "provider_id": request.provider_id,
            "success": result.valid,
            "ip_address": request.client.host
        }
    )

    # Update failed attempt counter
    if not result.valid:
        await increment_failed_validation_count(user_id)

    return result
```

### 10.3 Model Catalog Injection Prevention

**Risk:** Admin adds malicious model with custom endpoint pointing to attacker-controlled server

**Mitigation:**
1. Admin-only access to catalog management (no user-editable catalog)
2. Custom endpoints require domain whitelist:
   ```python
   ALLOWED_CUSTOM_ENDPOINT_DOMAINS = [
       "api.openrouter.ai",
       "api.together.xyz",
       "localhost",  # For development only
       "127.0.0.1"
   ]
   ```
3. Custom endpoint validation:
   - Must use HTTPS (except localhost)
   - Must respond to OPTIONS preflight (CORS check)
   - Must return valid OpenAI-compatible response schema

---

## 11. UX Wireframes

### 11.1 Agent Creation Dialog (Model Selection)

```
┌─────────────────────────────────────────────────────────────┐
│  Create Agent                                           [X] │
├─────────────────────────────────────────────────────────────┤
│  Name                                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ My Sales Assistant                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Model                                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ● Claude Opus 4.5                              [▼]    │ │ ← Selected, enabled
│  └───────────────────────────────────────────────────────┘ │
│  ↓ Dropdown expanded:                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Anthropic (2 models)                    ✓ Configured  │ │
│  │   ● Claude Opus 4.5                           Premium │ │
│  │   ○ Claude Sonnet 4                            Medium │ │
│  │                                                        │ │
│  │ OpenAI                              🔒 Configure Key  │ │ ← Locked section
│  │   ○ GPT-4o                               Premium      │ │ ← Disabled
│  │   ○ GPT-4 Turbo                          High         │ │ ← Disabled
│  │                                                        │ │
│  │ Google AI                           🔒 Configure Key  │ │
│  │   ○ Gemini 2.0 Flash                     Low          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Learn more about models]                                 │
│                                                             │
│  Persona                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ You are a sales assistant who helps...                │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                                      [Cancel]  [Create →] │
└─────────────────────────────────────────────────────────────┘
```

**Interaction:** User clicks locked "GPT-4o" option

```
┌─────────────────────────────────────────────────────────────┐
│  🔑 OpenAI API Key Required                             [X] │
├─────────────────────────────────────────────────────────────┤
│  To use GPT-4o and other OpenAI models, you need to add     │
│  an OpenAI API key.                                          │
│                                                              │
│  Get your API key:                                           │
│  https://platform.openai.com/api-keys                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Go to Settings → API Keys]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                      [Cancel]  [Add Key →] │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Settings → API Keys (Test Connection Flow)

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > API Keys                                         │
├─────────────────────────────────────────────────────────────┤
│  Configure API keys for AI model providers.                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Anthropic                                   ✓ Valid    │ │
│  │ sk-ant-***...xyz                                       │ │
│  │ Added: 2 days ago                                      │ │
│  │ Last tested: 1 hour ago                                │ │
│  │ Used by: 3 agents                                      │ │
│  │                                                        │ │
│  │ [Re-test]  [Remove]                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ OpenAI                                      ✗ Invalid  │ │ ← Shows warning
│  │ sk-...                                                 │ │
│  │ Last tested: 3 hours ago                               │ │
│  │ Error: "Incorrect API key provided"                    │ │
│  │                                                        │ │
│  │ [Re-test]  [Update Key]  [Remove]                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Add API Key]                                             │
└─────────────────────────────────────────────────────────────┘
```

**User clicks "+ Add API Key"**

```
┌─────────────────────────────────────────────────────────────┐
│  Add API Key                                            [X] │
├─────────────────────────────────────────────────────────────┤
│  Provider                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Anthropic                                      [▼]    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  API Key                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●                          │ │ ← Password input
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  Get your Anthropic API key:                                │
│  https://console.anthropic.com/settings/keys                │
│                                                              │
│                           [Cancel]  [Test Connection]       │
└─────────────────────────────────────────────────────────────┘
```

**After clicking "Test Connection" (success)**

```
┌─────────────────────────────────────────────────────────────┐
│  Add API Key                                            [X] │
├─────────────────────────────────────────────────────────────┤
│  Provider                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Anthropic                                      [▼]    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  API Key                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✓ Valid Key                                            │ │ ← Success message
│  │ Quota: 1,000,000 tokens remaining                      │ │
│  │ Resets: April 1, 2026                                  │ │
│  │                                                         │ │
│  │ This key can access:                                    │ │
│  │ • Claude Opus 4.5                                       │ │
│  │ • Claude Sonnet 4                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                           [Cancel]  [Save Key →]            │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 Agent Settings → Model Selector (Locked Model Warning)

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Settings                                              │
├─────────────────────────────────────────────────────────────┤
│  Model                                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ● anthropic/claude-opus-4-5                    [▼]    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ⚠️ Warning: Your OpenAI API key is invalid                 │ ← Contextual warning
│  You cannot switch to GPT-4o until you fix your key.        │
│  [Update OpenAI Key]                                         │
│                                                              │
│  Heartbeat                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [✓] Enabled        Every 15 min              [▼]      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│                                      [Cancel]  [Save]       │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Reference Implementation

### Sample Migration Script

```sql
-- migrations/20260307_001_create_model_catalog.sql

-- Create providers table
CREATE TABLE IF NOT EXISTS model_providers (
  provider_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  api_docs_url VARCHAR(255),
  requires_api_key BOOLEAN DEFAULT TRUE,
  supports_custom_endpoint BOOLEAN DEFAULT FALSE,
  logo_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Seed initial providers
INSERT INTO model_providers (provider_id, name, website, api_docs_url, logo_url) VALUES
  ('anthropic', 'Anthropic', 'https://anthropic.com', 'https://docs.anthropic.com', '/providers/anthropic.svg'),
  ('openai', 'OpenAI', 'https://openai.com', 'https://platform.openai.com/docs', '/providers/openai.svg'),
  ('google', 'Google AI', 'https://ai.google.dev', 'https://ai.google.dev/docs', '/providers/google.svg'),
  ('mistral', 'Mistral AI', 'https://mistral.ai', 'https://docs.mistral.ai', '/providers/mistral.svg');

-- Create models table
CREATE TABLE IF NOT EXISTS model_catalog (
  model_id VARCHAR(100) PRIMARY KEY,
  provider_id VARCHAR(50) REFERENCES model_providers(provider_id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  context_window INTEGER NOT NULL,
  supports_vision BOOLEAN DEFAULT FALSE,
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT FALSE,
  max_output_tokens INTEGER,
  cost_tier VARCHAR(20) DEFAULT 'medium',
  input_price_per_mtoken DECIMAL(10, 6),
  output_price_per_mtoken DECIMAL(10, 6),
  status VARCHAR(20) DEFAULT 'stable',
  release_date DATE,
  deprecation_date DATE,
  replacement_model_id VARCHAR(100) REFERENCES model_catalog(model_id) ON DELETE SET NULL,
  tags TEXT[],
  is_recommended BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_model_catalog_provider ON model_catalog(provider_id);
CREATE INDEX idx_model_catalog_status ON model_catalog(status);
CREATE INDEX idx_model_catalog_sort ON model_catalog(sort_order);

-- Seed initial models
INSERT INTO model_catalog VALUES
  -- Anthropic
  ('anthropic/claude-opus-4-5', 'anthropic', 'Claude Opus 4.5',
   'Most capable model for complex reasoning, coding, and vision tasks',
   200000, TRUE, TRUE, TRUE, 8192, 'premium', 15.0, 75.0, 'stable',
   '2025-01-15', NULL, NULL, ARRAY['reasoning', 'coding', 'vision'], TRUE, 10, NOW(), NULL),

  ('anthropic/claude-sonnet-4', 'anthropic', 'Claude Sonnet 4',
   'Balanced performance and cost for most tasks',
   200000, TRUE, TRUE, TRUE, 8192, 'medium', 3.0, 15.0, 'stable',
   '2024-11-20', NULL, NULL, ARRAY['reasoning', 'coding', 'vision'], FALSE, 20, NOW(), NULL),

  -- OpenAI
  ('openai/gpt-4o', 'openai', 'GPT-4o',
   'Flagship model with vision, audio, and advanced reasoning',
   128000, TRUE, TRUE, TRUE, 16384, 'high', 2.5, 10.0, 'stable',
   '2024-05-13', NULL, NULL, ARRAY['reasoning', 'coding', 'vision'], TRUE, 30, NOW(), NULL),

  ('openai/gpt-4-turbo', 'openai', 'GPT-4 Turbo',
   'High-performance model with larger context window',
   128000, TRUE, TRUE, TRUE, 4096, 'high', 10.0, 30.0, 'stable',
   '2024-01-25', NULL, NULL, ARRAY['reasoning', 'coding'], FALSE, 40, NOW(), NULL),

  -- Google
  ('google/gemini-2.0-flash', 'google', 'Gemini 2.0 Flash',
   'Ultra-fast model with massive context window',
   1000000, TRUE, TRUE, TRUE, 8192, 'low', 0.1, 0.3, 'stable',
   '2024-12-11', NULL, NULL, ARRAY['reasoning', 'vision', 'fast'], TRUE, 50, NOW(), NULL);

-- Create aliases table
CREATE TABLE IF NOT EXISTS model_aliases (
  alias_id VARCHAR(100) PRIMARY KEY,
  target_model_id VARCHAR(100) REFERENCES model_catalog(model_id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common aliases
INSERT INTO model_aliases VALUES
  ('claude-opus', 'anthropic/claude-opus-4-5', 'Always resolves to latest Claude Opus', NOW()),
  ('gpt-4', 'openai/gpt-4-turbo', 'Always resolves to latest GPT-4', NOW()),
  ('gemini-flash', 'google/gemini-2.0-flash', 'Always resolves to latest Gemini Flash', NOW());

-- Add validation columns to user_api_keys (if not exists)
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_api_keys_validation ON user_api_keys(validation_status);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_expires ON user_api_keys(expires_at) WHERE expires_at IS NOT NULL;
```

---

## Appendix B: Success Metrics

**Phase 1 (Backend Foundation):**
- [ ] All 4 catalog tables created and seeded
- [ ] `GET /api/v1/models` returns 5+ models
- [ ] `GET /api/v1/models/available` filters correctly based on test API keys
- [ ] API key validation works for Anthropic, OpenAI, Google

**Phase 2 (API Key Validation UI):**
- [ ] "Test Connection" button shows validation results
- [ ] Invalid keys cannot be saved
- [ ] Valid keys show quota information
- [ ] 90%+ of saved API keys are valid (reduces runtime errors)

**Phase 3 (Model Filtering in UI):**
- [ ] Model selector shows only accessible models by default
- [ ] Locked models show "🔒 Requires {Provider}" badge
- [ ] Adding API key immediately unlocks models (query invalidation works)
- [ ] Zero runtime errors: "API key required for this model"

**Phase 4 (Agent Provisioning Validation):**
- [ ] Agent creation fails fast with clear error if API key missing
- [ ] Error modal guides users to Settings → API Keys
- [ ] 95%+ of agent provisioning attempts succeed (vs current ~70%)

**Phase 5 (Advanced Features):**
- [ ] Background re-validation detects expired keys within 6 hours
- [ ] Key expiration warnings sent 3 days before expiry
- [ ] Deprecated model warnings shown in agent settings
- [ ] Custom endpoint support for OpenRouter/Ollama users

---

## Appendix C: FAQ

**Q: Why not use OpenRouter for unified API access?**
A: OpenRouter is great for aggregation, but:
1. Requires users to trust third party with API keys
2. Adds latency (extra hop)
3. Doesn't solve model catalog/validation UX problems
4. We still need direct provider access for some features (streaming, function calling)

**Q: Should we cache model catalog in frontend localStorage?**
A: No, because:
1. Model availability changes when API keys are added/removed
2. Cache invalidation is hard ("There are only two hard things in Computer Science...")
3. React Query already caches for 30s (good enough)

**Q: What if a model is removed from the catalog?**
A: Existing agents using removed models continue working (no breaking change). New agents cannot select removed models. Admin should:
1. Mark model `status: 'deprecated'` (30-day warning)
2. Set `replacement_model_id`
3. After 30 days, delete model from catalog
4. Cron job auto-migrates agents to replacement model

**Q: How do we handle rate limits?**
A: Rate limits are provider-specific and not part of this design. Future enhancement:
- Store quota information from validation response
- Track API call counts per agent per day
- Show "⚠️ 90% of daily quota used" warning
- Auto-pause agents when quota exceeded

---

**End of Document**

