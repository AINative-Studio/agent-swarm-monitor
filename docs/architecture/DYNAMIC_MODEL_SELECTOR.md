# Dynamic Model Selector Implementation

## Overview
Connected the API Keys section to the Model selector dropdown, enabling dynamic model availability based on configured API keys.

## Files Created

### `/lib/model-catalog.ts` (NEW)
Comprehensive model catalog with 70+ models from 11 providers:
- **Anthropic**: Claude Opus 4.5, Sonnet 4, 3.5 Sonnet, 3 Opus, 3 Haiku
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo, o1 Preview, o1 Mini
- **Google AI**: Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash, Pro
- **Mistral**: Large, Medium, Small, Mixtral 8x7B, 7B
- **Groq**: Llama 3.1 70B/8B, Llama 3 70B/8B, Mixtral 8x7B, Gemma 7B
- **OpenRouter**: Claude, GPT, Gemini, Llama, Qwen via OpenRouter
- **Venice AI**: Llama 3.1 405B/70B/8B
- **MiniMax**: ABAB 6/5.5 Chat
- **Moonshot AI**: v1 128K/32K/8K
- **2.AI**: Chat
- **Cerebras**: Llama 3.1 70B/8B

**Key Features**:
- Model tier classification (premium/standard/fast)
- Provider-to-models mapping
- Dynamic filtering based on API keys
- Backward compatibility with default models
- Helper functions for model availability checks

## Files Modified

### `/lib/openclaw-utils.ts`
- Replaced hardcoded `MODEL_OPTIONS` and `MODEL_OPTIONS_RAW` with re-exports from `model-catalog.ts`
- Maintained backward compatibility for existing imports
- Moved `formatModelShort` to model-catalog for centralized model formatting

### `/components/openclaw/AgentSettingsTab.tsx`
Enhanced Model selector with dynamic features:

**New State**:
```typescript
const availableModels = useMemo(() =>
  getAvailableModels(agentConfig.apiKeys), [agentConfig.apiKeys]
);
const isCurrentModelAvailable = useMemo(() =>
  isModelAvailable(model, agentConfig.apiKeys), [model, agentConfig.apiKeys]
);
const modelsByProvider = useMemo(() =>
  getModelsByProvider(agentConfig.apiKeys), [agentConfig.apiKeys]
);
```

**UI Enhancements**:
1. **No API Keys Warning**: Shows amber alert when no API keys configured
2. **Grouped Models**: Models organized by provider in dropdown (Anthropic, OpenAI, etc.)
3. **Tier Badges**: Visual indicators for premium/standard/fast models
4. **Availability Warning**: Amber highlight + warning icon if selected model requires missing API key
5. **Max Height**: Scrollable dropdown for 70+ models (max-h-[400px])

**Visual States**:
- Default state: Shows 4 default models (Claude Opus 4.5, Sonnet 4, GPT-4o, Gemini 2.0 Flash)
- API keys configured: Shows all models from providers with keys
- Missing key for current model: Amber border + warning message below selector

## Key Functions

### `getAvailableModels(apiKeys)`
Returns array of available models based on configured API keys.
- No keys → returns default 4 models
- With keys → returns all models from configured providers
- Empty results → falls back to default models

### `getModelsByProvider(apiKeys)`
Returns models grouped by provider for organized dropdown display.
- Used for categorized Select dropdown
- Shows provider name as section header

### `isModelAvailable(modelValue, apiKeys)`
Checks if a specific model is available with current API key configuration.
- Used for validation warning
- No keys → only default models available
- With keys → checks if provider key exists

### `getProviderForModel(modelValue)`
Returns provider info for a given model value.
- Used for model-to-provider lookups

### `formatModelShort(model)`
Formats model identifier for short display.
- Preserves existing formatting logic
- Supports extended model list

## Testing

Created `/lib/model-catalog.test.ts` with 6 test cases:
1. ✓ No API keys returns 4 default models
2. ✓ Empty API keys object returns defaults
3. ✓ Single provider (Anthropic) returns 5 Anthropic models
4. ✓ Multiple providers return combined models (18 total for 3 providers)
5. ✓ `isModelAvailable` correctly validates model availability
6. ✓ `getModelsByProvider` groups models correctly

All tests passed.

## Backward Compatibility

- `MODEL_OPTIONS` still exported from `openclaw-utils.ts` (re-exported from model-catalog)
- `MODEL_OPTIONS_RAW` still exported (same re-export)
- `formatModelShort` still exported from `openclaw-utils.ts`
- CreateAgentDialog continues to use default models (appropriate for new agents)
- Existing code using these exports requires no changes

## User Experience

### Before
- 4 hardcoded models always shown
- No connection to API Keys section
- No indication which models require which keys

### After
- 4-70+ models shown based on configured API keys
- Clear visual feedback when API keys missing
- Provider-grouped dropdown for easy navigation
- Tier badges (premium/standard/fast) for model selection
- Warning when current model requires missing key
- Helpful message when no API keys configured

## Example Usage Flow

1. User opens agent Settings tab
2. No API keys configured → sees default 4 models + warning message
3. User adds Anthropic API key in API Keys section
4. Model selector updates → shows 5 Anthropic models (Claude Opus 4.5, Sonnet 4, 3.5 Sonnet, 3 Opus, 3 Haiku)
5. User adds OpenAI key → selector now shows 12 models (5 Anthropic + 7 OpenAI)
6. User adds Groq key → selector shows 18 models with provider grouping
7. Models grouped as: ANTHROPIC (5), OPENAI (7), GROQ (6)
8. Each model shows tier badge (premium/standard/fast)
9. If user selects GPT-4o but removes OpenAI key → amber warning appears

## Implementation Notes

- All model values follow `provider/model-id` format
- Provider IDs match API_KEY_PROVIDERS in `agent-configuration.ts`
- Model catalog is static (not fetched from API) for performance
- Can easily add new providers/models by extending MODEL_CATALOG array
- Tier classification helps users choose appropriate model for their use case
