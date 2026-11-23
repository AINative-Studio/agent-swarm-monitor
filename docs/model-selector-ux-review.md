# Model Selector UX Review & Enhancement Proposal

**Document Version:** 1.0
**Date:** March 7, 2026
**Reviewer:** UX Advocate (Claude Code)
**Scope:** AgentSettingsTab Model Selection Experience

---

## Executive Summary

The current model selector in AgentSettingsTab presents a **critical disconnect** between API key configuration and model availability. Users can add 11 different provider API keys, but the model selector shows only 4 hardcoded options with no indication of which keys are required. This creates a **discoverability crisis** and **error-prone workflow** that will lead to user frustration and support tickets.

**Severity Ratings:**
- **Critical Issues:** 3
- **High Priority Issues:** 5
- **Medium Priority Issues:** 4
- **Low Priority Issues:** 2

**Recommended Timeline:** Address critical issues immediately, high priority within current sprint.

---

## Current State Analysis

### Implementation Location
- **File:** `/Users/aideveloper/agent-swarm-monitor/components/openclaw/AgentSettingsTab.tsx`
- **Model Selector:** Lines 500-522
- **API Keys Section:** Lines 625-674
- **Model Options:** `/Users/aideveloper/agent-swarm-monitor/lib/openclaw-utils.ts` (lines 44-49)

### Current Model Options (Hardcoded)
```typescript
const MODEL_OPTIONS_RAW = [
  { value: 'anthropic/claude-opus-4-5', label: 'anthropic/claude-opus-4-5' },
  { value: 'anthropic/claude-sonnet-4', label: 'anthropic/claude-sonnet-4' },
  { value: 'openai/gpt-4o', label: 'openai/gpt-4o' },
  { value: 'google/gemini-2.0-flash', label: 'google/gemini-2.0-flash' },
] as const;
```

### Available API Key Providers (11 total)
- Anthropic
- Google AI
- Mistral
- Venice AI
- MiniMax
- OpenAI
- OpenRouter
- Groq
- Moonshot AI
- 2.AI
- Cerebras

### Current User Flow
1. User navigates to Settings tab
2. User sees Model dropdown (4 options, always visible)
3. User scrolls down 150+ pixels to API Keys section (visually disconnected)
4. User adds API key for a provider (e.g., OpenAI)
5. **Nothing happens** - model dropdown still shows same 4 options
6. User selects `openai/gpt-4o` model
7. **No feedback** if they haven't added OpenAI API key yet
8. Error occurs at runtime when agent tries to use model without key

---

## Critical UX Issues

### 1. CRITICAL: Zero Feedback Loop Between API Keys and Models
**Severity:** Critical
**User Impact:** High frustration, runtime errors, failed agent operations

**Problem:**
- Adding an API key provides no visual indication that new models are now available
- Selecting a model provides no warning that the required API key is missing
- No relationship established between the two sections despite being on same page

**Current Flow:**
```
[Add OpenAI Key] → (no feedback) → [Select GPT-4o] → (no warning) → [Agent fails at runtime]
```

**Expected Flow:**
```
[Add OpenAI Key] → (success + "3 models now available") → [Select GPT-4o ✓ Ready] → [Agent works]
```

**Evidence:** Lines 297-323 handle API key save with toast notification but don't trigger model list update or provide any connection to model selector.

---

### 2. CRITICAL: No Discovery Mechanism for Available Models
**Severity:** Critical
**User Impact:** Users don't know what models they can access

**Problem:**
- Only 4 models shown, but 11 providers supported
- No indication of which providers offer which models
- Users with Anthropic key can't discover Mistral models exist
- No way to browse "all possible models" before adding keys

**Example Scenario:**
> User adds Cerebras API key. They scroll up to model selector. They see 4 models, none from Cerebras. They assume: "OpenClaw doesn't support Cerebras models yet." They abandon the feature.

**Reality:** Cerebras models may be available, but aren't shown in hardcoded list.

---

### 3. CRITICAL: Invisible Error State
**Severity:** Critical
**User Impact:** Silent failures, confusion about why agent isn't working

**Problem:**
- User can select `openai/gpt-4o` even if they haven't added OpenAI key
- No validation at selection time
- No visual indicator in dropdown that key is missing
- Error only surfaces when agent tries to use the model (potentially hours later)

**Lines 504-521:** Model selector has no validation logic, just a plain Select component.

---

### 4. HIGH: Poor Information Scent
**Severity:** High
**User Impact:** Users can't find what they're looking for

**Problem:**
- No provider logos/icons in model selector
- Technical string `anthropic/claude-opus-4-5` doesn't communicate capabilities
- No metadata about model features (vision, code, speed, cost)
- No grouping or categorization

**Current Display:**
```
Model
[Sparkle Icon] anthropic/claude-opus-4-5
```

**Missing Information:**
- Which provider owns this model?
- What is it good at?
- How much does it cost?
- What context window size?
- Is my API key configured?

---

### 5. HIGH: No Empty State Guidance
**Severity:** High
**User Impact:** New users don't know where to start

**Problem:**
- When user has zero API keys configured, model selector shows 4 models
- No indication that these might not work
- No guidance like "Add an API key below to unlock models"
- Empty state would be more honest than showing unusable options

**Lines 500-522:** No conditional rendering based on API key availability.

---

### 6. HIGH: Visual Disconnection Between Related Sections
**Severity:** High
**User Impact:** Users don't realize sections are related

**Problem:**
- Model selector at top of page (lines 500-522)
- API Keys section 125+ lines below (lines 625-674)
- Two `<Separator />` components between them
- Intervening sections: Heartbeat (50+ lines), Integrations (20+ lines)
- No visual affordance linking the two

**Spatial Distance:**
- Model selector: Y-position ~200px
- API Keys section: Y-position ~800px
- **Separation: 600px+ of vertical scroll**

Users treat these as independent sections, not realizing API keys unlock models.

---

### 7. HIGH: Inconsistent Interaction Pattern
**Severity:** High
**User Impact:** Confusing mental model

**Problem:**
- API Keys use add/remove buttons with inline list
- Model uses dropdown selector
- Why not model cards with "Available" badges?
- Why not API key dropdown like model?

**Current Patterns:**
```
Model:     [Dropdown with 4 items]
API Keys:  [Grid of 11 items with +/- buttons]
```

**Question:** Should these use similar interaction patterns since they're related?

---

### 8. MEDIUM: No Capability-Based Filtering
**Severity:** Medium
**User Impact:** Users can't find models for specific tasks

**Problem:**
- No way to filter models by capability (e.g., "Show me vision models")
- No indication of which models support vision, function calling, etc.
- Users doing image work can't easily find compatible models

**Use Case:**
> User needs vision model for screenshot analysis. They open model dropdown, see 4 technical strings, have to Google each one to find if it supports vision. Bad UX.

---

### 9. MEDIUM: No Cost Transparency
**Severity:** Medium
**User Impact:** Users unknowingly select expensive models

**Problem:**
- No indication of model costs
- Claude Opus 4.5 is ~10x more expensive than Gemini 2.0 Flash
- Users select "best sounding name" without cost awareness
- No budget/usage warnings

**Lines 514-519:** SelectItem shows only label, no cost metadata.

---

### 10. MEDIUM: No Context Window Information
**Severity:** Medium
**User Impact:** Users hit token limits unexpectedly

**Problem:**
- Models have vastly different context windows (8K - 200K tokens)
- No indication in selector
- Users select small-context model for large document processing
- Agent fails with context overflow errors

---

### 11. MEDIUM: Keyboard Navigation Incomplete
**Severity:** Medium
**User Impact:** Power users and accessibility users slowed down

**Problem:**
- Select component is keyboard navigable (good)
- But no keyboard shortcut to jump to API keys section
- No keyboard shortcut to "add key for selected model"
- No focus management after adding API key (doesn't return to model selector)

**Lines 504-521:** Standard Select component, no custom keyboard handling.

---

### 12. LOW: No Model Performance Indicators
**Severity:** Low
**User Impact:** Users don't know which models are fast/slow

**Problem:**
- Some models (Groq, Cerebras) are 10x faster than others
- No speed indicators
- Users doing real-time tasks unknowingly select slow models

---

### 13. LOW: No Recently Used Models
**Severity:** Low
**User Impact:** Repetitive selection for users who switch between 2-3 models

**Problem:**
- No history of which models user has tried
- No "pin favorites" functionality
- Users who frequently switch between Claude Opus and Sonnet must re-find them each time

---

## Accessibility Audit

### WCAG 2.1 AA Compliance Status

#### Perceivable
- **1.3.1 Info and Relationships (A):** ✗ FAIL
  - Label "Model" doesn't communicate relationship to API Keys section
  - SelectItems don't indicate which provider they belong to
  - No programmatic relationship between API key status and model availability

- **1.4.3 Contrast (AA):** ✓ PASS
  - Text meets 4.5:1 contrast ratio
  - Gray labels (#6B7280) on white background: ~4.6:1

- **1.4.11 Non-text Contrast (AA):** ✓ PASS
  - Select border meets 3:1 contrast

#### Operable
- **2.1.1 Keyboard (A):** ✓ PASS
  - Select is keyboard navigable (arrow keys, Enter)
  - Focus visible on SelectTrigger

- **2.4.3 Focus Order (A):** ✓ PASS
  - Logical top-to-bottom focus order

- **2.4.6 Headings and Labels (AA):** ⚠ PARTIAL
  - Label "Model" is too generic
  - Should be "AI Model" or "Language Model"
  - No aria-describedby linking to help text

#### Understandable
- **3.2.2 On Input (A):** ✓ PASS
  - Changing model doesn't cause unexpected context changes

- **3.3.1 Error Identification (A):** ✗ FAIL
  - No error shown if user selects model without API key
  - Error only visible at runtime (invisible to user at selection time)

- **3.3.2 Labels or Instructions (A):** ✗ FAIL
  - No instructions explaining relationship between models and API keys
  - No indication of which API key is needed for each model

- **3.3.3 Error Suggestion (AA):** ✗ FAIL
  - When user selects unconfigured model, no suggestion to add API key
  - No recovery path provided

#### Robust
- **4.1.2 Name, Role, Value (A):** ✓ PASS
  - Select has proper ARIA roles
  - SelectValue programmatically exposed

### Accessibility Recommendations

1. **Add aria-describedby to Model selector:**
   ```tsx
   <SelectTrigger
     id="settings-model"
     aria-describedby="model-help-text"
   >
   ```

2. **Add help text below Model selector:**
   ```tsx
   <p id="model-help-text" className="text-xs text-gray-500 mt-1">
     Add API keys below to unlock additional models
   </p>
   ```

3. **Add aria-invalid when model requires missing key:**
   ```tsx
   <SelectTrigger
     aria-invalid={modelRequiresKey && !keyConfigured}
     aria-errormessage={modelRequiresKey && !keyConfigured ? "model-error" : undefined}
   >
   ```

4. **Announce model availability changes:**
   ```tsx
   <div role="status" aria-live="polite" className="sr-only">
     {apiKeysJustAdded && "New models are now available"}
   </div>
   ```

5. **Add provider name to screen reader label:**
   ```tsx
   <SelectItem value="openai/gpt-4o" aria-label="GPT-4o from OpenAI">
     <span aria-hidden="true">openai/gpt-4o</span>
   </SelectItem>
   ```

---

## Proposed Solutions

### Solution A: Hybrid "Show All + Indicate Availability" (RECOMMENDED)

**Concept:** Show all models, use badges to indicate which are ready to use.

**Visual Mockup (Text Description):**
```
┌─────────────────────────────────────────────────┐
│ Model                                           │
│ ┌─────────────────────────────────────────────┐│
│ │ [Sparkle] Claude Opus 4.5          ✓ Ready  ││
│ ├─────────────────────────────────────────────┤│
│ │ [Sparkle] Claude Sonnet 4          ✓ Ready  ││
│ ├─────────────────────────────────────────────┤│
│ │ [Sparkle] GPT-4o                   + Add Key││
│ ├─────────────────────────────────────────────┤│
│ │ [Sparkle] Gemini 2.0 Flash         + Add Key││
│ ├─────────────────────────────────────────────┤│
│ │ [Sparkle] Llama 3.3 70B (Groq)     + Add Key││
│ ├─────────────────────────────────────────────┤│
│ │ [Sparkle] Mistral Large            + Add Key││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
   ↓ Click "+ Add Key" opens API key modal for that provider
```

**Advantages:**
- ✓ Solves discoverability (users see all options)
- ✓ Clear availability status (badge system)
- ✓ Single-click to add missing key (inline CTA)
- ✓ No hidden functionality
- ✓ Progressive disclosure (show all, explain constraints)

**Disadvantages:**
- Longer dropdown list (12+ items vs 4)
- Requires model-to-provider mapping logic
- Slightly more complex component

**Implementation Complexity:** Medium

---

### Solution B: Two-Section Dropdown (Provider → Model)

**Concept:** Dropdown organized by provider, with expand/collapse for each.

**Visual Mockup:**
```
┌─────────────────────────────────────────────────┐
│ Model                                           │
│ ┌─────────────────────────────────────────────┐│
│ │ ▼ Anthropic (2 models) ✓ Key configured     ││
│ │   • Claude Opus 4.5                          ││
│ │   • Claude Sonnet 4                          ││
│ ├─────────────────────────────────────────────┤│
│ │ ▼ OpenAI (1 model) + Add Key                ││
│ │   • GPT-4o                                   ││
│ ├─────────────────────────────────────────────┤│
│ │ ▼ Google (1 model) + Add Key                ││
│ │   • Gemini 2.0 Flash                         ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Advantages:**
- ✓ Natural grouping by provider
- ✓ Key status shown at provider level
- ✓ Scales well to many models
- ✓ Matches mental model ("I have an Anthropic key, what models can I use?")

**Disadvantages:**
- More complex component (nested structure)
- Requires click to expand (extra interaction)
- Some users think by use-case, not provider

**Implementation Complexity:** High

---

### Solution C: Modal Model Picker with Tabs

**Concept:** Replace dropdown with button that opens modal with tabs for filtering.

**Visual Mockup:**
```
┌─────────────────────────────────────────┐
│ Model                                   │
│ ┌─────────────────────────────────────┐ │
│ │ Claude Opus 4.5        [Change...]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Click [Change...] opens:

┌──────────────────────────────────────────────┐
│ Choose a Model                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [All] [Ready to Use] [Vision] [Reasoning]│ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Ready to Use (2)                             │
│ ┌──────────────────────────────────────────┐ │
│ │ Claude Opus 4.5                          │ │
│ │ 200K context • Vision • $15/$75 per 1M   │ │
│ │ ✓ Anthropic key configured               │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ Claude Sonnet 4                          │ │
│ │ 200K context • Vision • $3/$15 per 1M    │ │
│ │ ✓ Anthropic key configured               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Requires Setup (4)                           │
│ ┌──────────────────────────────────────────┐ │
│ │ GPT-4o                       [+ Add Key] │ │
│ │ 128K context • Vision • $2.50/$10 per 1M │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Advantages:**
- ✓ Maximum information density
- ✓ Space for model metadata (cost, features, context)
- ✓ Powerful filtering (by capability, cost, provider)
- ✓ Inline "Add Key" CTAs
- ✓ Can include model comparison features

**Disadvantages:**
- Heavier component (full modal)
- More clicks to change model
- Overkill if user only has 2-3 options

**Implementation Complexity:** Very High

---

### Solution D: Inline Expansion with Smart Filtering (BALANCED)

**Concept:** Default shows configured models. "Show all models" link expands to full list.

**Visual Mockup:**
```
Initial State (2 keys configured):
┌─────────────────────────────────────────────────┐
│ Model                                           │
│ ┌─────────────────────────────────────────────┐│
│ │ [Sparkle] Claude Opus 4.5                   ││
│ │ [Sparkle] Claude Sonnet 4                   ││
│ └─────────────────────────────────────────────┘│
│ Show all models (10 more) →                    │
└─────────────────────────────────────────────────┘

After clicking "Show all models":
┌─────────────────────────────────────────────────┐
│ Model                                           │
│ ┌─────────────────────────────────────────────┐│
│ │ ✓ Claude Opus 4.5 (Ready)                   ││
│ │ ✓ Claude Sonnet 4 (Ready)                   ││
│ ├─────────────────────────────────────────────┤│
│ │ GPT-4o (Requires OpenAI key) [+ Add]        ││
│ │ Gemini 2.0 Flash (Requires Google key) [+]  ││
│ │ Llama 3.3 70B (Requires Groq key) [+]       ││
│ │ Mistral Large (Requires Mistral key) [+]    ││
│ └─────────────────────────────────────────────┘│
│ Show only configured models ←                  │
└─────────────────────────────────────────────────┘
```

**Advantages:**
- ✓ Progressive disclosure (simple by default, powerful when needed)
- ✓ Doesn't overwhelm new users with 12+ options
- ✓ Clear distinction between ready and needs-setup
- ✓ Inline CTAs for adding keys
- ✓ Collapses back to simple state

**Disadvantages:**
- Requires two interactions to see all options
- "Show all" link might be missed by some users

**Implementation Complexity:** Medium

---

## Recommended Solution: Hybrid Approach (Solution A + D)

**Recommendation:** Combine Solution A's clarity with Solution D's progressive disclosure.

**Default State:** Show configured models + 2-3 popular unconfigured models
**Expanded State:** Show all models with clear availability indicators

### Component Structure

```typescript
// /Users/aideveloper/agent-swarm-monitor/components/openclaw/ModelSelector.tsx

interface ModelOption {
  id: string;                          // "anthropic/claude-opus-4-5"
  name: string;                        // "Claude Opus 4.5"
  provider: ApiKeyProviderId;          // "anthropic"
  providerName: string;                // "Anthropic"
  contextWindow: number;               // 200000
  capabilities: string[];              // ["vision", "code", "reasoning"]
  pricing: {
    input: number;                     // per 1M tokens
    output: number;
  };
  speed: 'fast' | 'medium' | 'slow';
  category: 'flagship' | 'balanced' | 'fast' | 'specialized';
}

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  configuredProviders: Set<ApiKeyProviderId>;  // from agentConfig.apiKeys
  onAddApiKey: (providerId: ApiKeyProviderId) => void;
}

export function ModelSelector({ ... }) {
  const [showAll, setShowAll] = useState(false);

  const models = useMemo(() => getAllModels(), []); // ~12-15 models

  const availableModels = models.filter(m =>
    configuredProviders.has(m.provider)
  );

  const unavailableModels = models.filter(m =>
    !configuredProviders.has(m.provider)
  );

  const displayedModels = showAll
    ? models
    : [...availableModels, ...unavailableModels.slice(0, 3)];

  return (
    <div className="space-y-2">
      <Label htmlFor="model-selector">
        AI Model
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="model-selector"
          aria-describedby="model-help"
        >
          <ModelValueDisplay modelId={value} />
        </SelectTrigger>

        <SelectContent className="max-h-[400px]">
          {/* Available Models Section */}
          {availableModels.length > 0 && (
            <>
              <SelectLabel>Ready to Use ({availableModels.length})</SelectLabel>
              {availableModels.map(model => (
                <ModelSelectItem
                  key={model.id}
                  model={model}
                  status="ready"
                />
              ))}
              {unavailableModels.length > 0 && <SelectSeparator />}
            </>
          )}

          {/* Unavailable Models Section */}
          {unavailableModels.length > 0 && (
            <>
              <SelectLabel>
                Requires API Key ({unavailableModels.length})
              </SelectLabel>
              {(showAll ? unavailableModels : unavailableModels.slice(0, 3))
                .map(model => (
                  <ModelSelectItem
                    key={model.id}
                    model={model}
                    status="needs-key"
                    onAddKey={() => onAddApiKey(model.provider)}
                  />
                ))}
            </>
          )}

          {/* Show All Toggle */}
          {!showAll && unavailableModels.length > 3 && (
            <button
              className="w-full px-2 py-2 text-sm text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.preventDefault();
                setShowAll(true);
              }}
            >
              Show {unavailableModels.length - 3} more models →
            </button>
          )}
        </SelectContent>
      </Select>

      {/* Help Text */}
      <p id="model-help" className="text-xs text-gray-500">
        {availableModels.length === 0
          ? "Add an API key below to unlock models"
          : `${availableModels.length} ${availableModels.length === 1 ? 'model' : 'models'} available`
        }
      </p>
    </div>
  );
}

// Individual model item component
function ModelSelectItem({
  model,
  status,
  onAddKey
}: {
  model: ModelOption;
  status: 'ready' | 'needs-key';
  onAddKey?: () => void;
}) {
  return (
    <SelectItem
      value={model.id}
      className="flex items-start justify-between py-3"
      disabled={status === 'needs-key'}
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <ProviderIcon provider={model.provider} className="h-4 w-4" />
          <span className="font-medium">{model.name}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{model.contextWindow / 1000}K tokens</span>
          {model.capabilities.includes('vision') && (
            <Badge variant="secondary" size="xs">Vision</Badge>
          )}
          <span>•</span>
          <span className="text-gray-400">
            ${model.pricing.input}/${model.pricing.output} per 1M
          </span>
        </div>
      </div>

      {/* Status Badge or CTA */}
      {status === 'ready' ? (
        <Badge variant="success" size="sm" className="ml-2">
          ✓ Ready
        </Badge>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddKey?.();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Key
        </Button>
      )}
    </SelectItem>
  );
}
```

---

## Information Architecture Proposal

### Model Organization Strategy

**Primary Grouping:** By availability (Ready vs Needs Setup)
**Secondary Sorting:** Within each group, sort by:
1. Provider (alphabetically)
2. Model tier (Flagship → Balanced → Fast)

**Rationale:**
- Users care most about "Can I use this now?" (availability-first)
- Within available models, grouping by provider helps users who have brand preferences
- Capability-based filtering can be added later as enhancement

### Model Metadata Display

**Essential (Always Show):**
- Model name (human-readable)
- Provider (icon + name)
- Availability status (badge)
- Context window size

**Secondary (Show on hover or in tooltip):**
- Pricing (input/output per 1M tokens)
- Key capabilities (vision, function calling, code)
- Speed tier

**Tertiary (Show in help docs):**
- Benchmark scores
- Training data cutoff
- Special limitations

---

## Interaction Design Specifications

### State Management

```typescript
// Model selector should react to API key changes
useEffect(() => {
  // When API keys change, check if new models became available
  const newlyAvailableCount = getNewlyAvailableModels(
    previousApiKeys,
    currentApiKeys
  ).length;

  if (newlyAvailableCount > 0) {
    // Announce to screen readers
    announceToScreenReader(
      `${newlyAvailableCount} new ${pluralize('model', newlyAvailableCount)} now available`
    );

    // Show toast notification
    toast({
      title: `${newlyAvailableCount} New Models Available`,
      description: `You can now use models from ${providerName}`,
      action: <Button onClick={openModelSelector}>Choose Model</Button>
    });
  }
}, [currentApiKeys]);
```

### Error Prevention

```typescript
// Before changing model, validate API key is configured
function handleModelChange(newModelId: string) {
  const model = getModelById(newModelId);
  const hasRequiredKey = configuredProviders.has(model.provider);

  if (!hasRequiredKey) {
    // Prevent selection, prompt to add key
    showDialog({
      title: `${model.providerName} API Key Required`,
      description: `To use ${model.name}, you need to add a ${model.providerName} API key.`,
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: `Add ${model.providerName} Key`,
          variant: 'primary',
          onClick: () => openApiKeyModal(model.provider)
        }
      ]
    });
    return; // Don't change model
  }

  // Key is configured, allow change
  onChange(newModelId);
}
```

### Loading States

```typescript
// When adding API key that unlocks models
{isSavingApiKey && (
  <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <Loader2 className="h-8 w-8 animate-spin mb-2" />
      <p>Adding API key...</p>
      <p className="text-sm text-gray-500">
        Checking for available models
      </p>
    </div>
  </div>
)}
```

### Success Feedback

```typescript
// After successfully adding API key
toast({
  title: `${providerName} Key Added`,
  description: (
    <div className="space-y-2">
      <p>{modelCount} models are now available</p>
      <ul className="text-sm list-disc list-inside">
        {newModels.slice(0, 3).map(m => (
          <li key={m.id}>{m.name}</li>
        ))}
        {newModels.length > 3 && (
          <li>+{newModels.length - 3} more</li>
        )}
      </ul>
    </div>
  ),
  action: <Button onClick={openModelSelector}>Select Model</Button>
});
```

---

## Accessibility Implementation Checklist

### WCAG AA Compliance
- [ ] **1.3.1 Info and Relationships**
  - [ ] Add aria-describedby linking model selector to help text
  - [ ] Add aria-label to SelectItems with provider context
  - [ ] Use semantic grouping with SelectLabel for "Ready" vs "Needs Key"

- [ ] **2.4.6 Headings and Labels**
  - [ ] Change label from "Model" to "AI Model"
  - [ ] Add descriptive help text explaining API key requirement

- [ ] **3.3.1 Error Identification**
  - [ ] Show inline error if user selects model without key
  - [ ] Use aria-invalid when validation fails

- [ ] **3.3.2 Labels or Instructions**
  - [ ] Add instruction text: "Add API keys below to unlock models"
  - [ ] Show count of available models in help text

- [ ] **3.3.3 Error Suggestion**
  - [ ] When user selects unconfigured model, show dialog with "Add Key" CTA
  - [ ] Provide direct link to API key section

### Keyboard Navigation
- [ ] Tab to model selector
- [ ] Arrow keys to navigate options
- [ ] Enter to select model
- [ ] If model needs key: Enter opens "Add Key" dialog
- [ ] Escape to close dropdown
- [ ] Space bar alternative to Enter

### Screen Reader Support
- [ ] Announce model availability count on page load
- [ ] Announce when new models become available after adding key
- [ ] Provide aria-label for provider icons (they're decorative but context-relevant)
- [ ] Use role="status" for dynamic updates

### Focus Management
- [ ] After adding API key, return focus to model selector (if it was the trigger)
- [ ] After selecting model, announce selection to screen reader
- [ ] Visible focus indicators (2px solid ring, primary color)

---

## Visual Design Recommendations

### Color System

**Status Colors:**
```css
/* Ready to Use */
--model-ready-bg: hsl(142, 76%, 36%);      /* green-600 */
--model-ready-text: hsl(142, 76%, 96%);

/* Needs API Key */
--model-needs-key-bg: hsl(45, 93%, 47%);   /* amber-500 */
--model-needs-key-text: hsl(45, 5%, 15%);

/* Disabled (not available in any tier) */
--model-disabled-bg: hsl(0, 0%, 86%);      /* gray-300 */
--model-disabled-text: hsl(0, 0%, 45%);
```

**Provider Brand Colors:**
```typescript
const PROVIDER_COLORS = {
  anthropic: '#D97757',     // Anthropic orange
  openai: '#10A37F',        // OpenAI teal
  google: '#4285F4',        // Google blue
  mistral: '#FF7000',       // Mistral orange
  groq: '#000000',          // Groq black
  // ... etc
}
```

### Typography

```css
/* Model Name */
.model-name {
  font-size: 0.875rem;        /* 14px */
  font-weight: 500;           /* medium */
  line-height: 1.25rem;       /* 20px */
  color: hsl(0, 0%, 9%);      /* gray-900 */
}

/* Provider Name */
.provider-name {
  font-size: 0.75rem;         /* 12px */
  font-weight: 400;           /* normal */
  color: hsl(0, 0%, 45%);     /* gray-600 */
}

/* Metadata (context, pricing) */
.model-metadata {
  font-size: 0.6875rem;       /* 11px */
  font-weight: 400;
  color: hsl(0, 0%, 60%);     /* gray-500 */
  font-variant-numeric: tabular-nums;  /* for pricing alignment */
}
```

### Iconography

**Provider Icons:** Use official brand logos at 16x16px
**Status Icons:**
- Ready: ✓ checkmark (green)
- Needs Key: + plus icon (amber)
- Coming Soon: 🔒 lock icon (gray)

**Capability Badges:**
- Vision: 👁 eye icon
- Code: </> code bracket icon
- Fast: ⚡ lightning icon
- Reasoning: 🧠 brain icon

### Spacing

```css
/* Select Item Padding */
.model-select-item {
  padding: 12px 16px;           /* vertical | horizontal */
  gap: 8px;                     /* between icon and text */
}

/* Section Spacing */
.model-section {
  margin-bottom: 8px;           /* between "Ready" and "Needs Key" sections */
}

/* Badge Spacing */
.capability-badge {
  margin-left: 4px;
  padding: 2px 6px;
}
```

---

## User Flow Diagrams

### Flow 1: New User First Model Selection

```
START: User creates new agent
  ↓
[Settings Tab - Default State]
  • Model selector shows 4 hardcoded models
  • API Keys section empty (0/11 providers)
  • Help text: "Add an API key below to unlock models"
  ↓
USER ACTION: Clicks model dropdown
  ↓
[Dropdown Opens]
  • Section: "Requires API Key (4)"
    - anthropic/claude-opus-4-5 [+ Add Key]
    - anthropic/claude-sonnet-4 [+ Add Key]
    - openai/gpt-4o [+ Add Key]
    - google/gemini-2.0-flash [+ Add Key]
  • Footer: "Show 8 more models →"
  ↓
USER ACTION: Clicks [+ Add Key] next to GPT-4o
  ↓
[API Key Modal Opens]
  • Title: "Add OpenAI API Key"
  • Input field (password type)
  • [Test Connection] button
  ↓
USER ACTION: Pastes key, clicks Test Connection
  ↓
[Testing... spinner]
  ↓
SUCCESS: Key is valid
  ↓
[Modal shows success]
  • ✓ "Valid OpenAI API key"
  • Quota: "1M tokens remaining"
  • [Save Key] button enabled
  ↓
USER ACTION: Clicks Save Key
  ↓
[Key saved, modal closes]
  ↓
[Toast notification]
  • "OpenAI Key Added"
  • "1 model now available"
  • [Select Model] button
  ↓
USER ACTION: Clicks [Select Model] in toast
  ↓
[Model dropdown auto-opens]
  • Section: "Ready to Use (1)"
    - openai/gpt-4o ✓ Ready
  • Section: "Requires API Key (3)"
    - anthropic/claude-opus-4-5 [+ Add Key]
    - anthropic/claude-sonnet-4 [+ Add Key]
    - google/gemini-2.0-flash [+ Add Key]
  ↓
USER ACTION: Selects GPT-4o
  ↓
[Model selected, dropdown closes]
  • Model field now shows "openai/gpt-4o"
  • Help text: "1 model available"
  ↓
USER ACTION: Clicks Save (at bottom of page)
  ↓
END: Agent configured with GPT-4o
```

### Flow 2: Experienced User Switching Models

```
START: User with 3 API keys configured (Anthropic, OpenAI, Google)
  ↓
[Settings Tab]
  • Current model: "anthropic/claude-opus-4-5"
  • Help text: "5 models available"
  ↓
USER ACTION: Clicks model dropdown
  ↓
[Dropdown Opens]
  • Section: "Ready to Use (5)"
    - anthropic/claude-opus-4-5 ✓ Ready [SELECTED]
    - anthropic/claude-sonnet-4 ✓ Ready
    - anthropic/claude-haiku-4 ✓ Ready
    - openai/gpt-4o ✓ Ready
    - google/gemini-2.0-flash ✓ Ready
  • Section: "Requires API Key (7)"
    - mistral/mistral-large [+ Add Key]
    - groq/llama-3.3-70b [+ Add Key]
    - ... (collapsed)
  • Footer: "Show 5 more models →"
  ↓
USER ACTION: Hovers over "anthropic/claude-sonnet-4"
  ↓
[Tooltip appears]
  • "Claude Sonnet 4"
  • "200K context • Vision support"
  • "$3 / $15 per 1M tokens"
  • "Balanced speed and quality"
  ↓
USER ACTION: Clicks "anthropic/claude-sonnet-4"
  ↓
[Model selected, dropdown closes]
  • Model field updates to "anthropic/claude-sonnet-4"
  • No validation error (key already configured)
  ↓
USER ACTION: Clicks Save
  ↓
END: Agent now uses Claude Sonnet 4
```

### Flow 3: Error Prevention - Selecting Unconfigured Model

```
START: User with only Anthropic key
  ↓
[Settings Tab]
  • Current model: "anthropic/claude-opus-4-5"
  • Configured keys: Anthropic only
  ↓
USER ACTION: Clicks "Show all models"
  ↓
[Dropdown expands to show all 12 models]
  • Ready to Use (3): Anthropic models
  • Requires API Key (9): Others
  ↓
USER ACTION: Tries to select "openai/gpt-4o"
  ↓
[Validation intercepts]
  ↓
[Dialog appears - CRITICAL UX]
  • Title: "OpenAI API Key Required"
  • Body: "To use GPT-4o, you need to add an OpenAI API key first."
  • Icon: Warning/info icon
  • Actions:
    - [Cancel] (ghost button)
    - [Add OpenAI Key] (primary button)
  ↓
BRANCH A: User clicks Cancel
  ↓
  [Dialog closes, model remains unchanged]
  END
  ↓
BRANCH B: User clicks [Add OpenAI Key]
  ↓
  [API Key Modal opens for OpenAI]
  ↓
  USER ACTION: Adds key
  ↓
  [Key saved successfully]
  ↓
  [Toast: "OpenAI key added. GPT-4o is now available."]
  ↓
  [Model dropdown auto-updates]
  • "Ready to Use" now includes GPT-4o
  ↓
  USER ACTION: Selects GPT-4o
  ↓
  END: Model changed successfully
```

---

## Priority Matrix

### Impact vs Effort Assessment

| Issue | Impact | Effort | Priority | Recommended Sprint |
|-------|--------|--------|----------|-------------------|
| #1: Zero feedback loop | High | Medium | **P0** | Current |
| #2: No discovery mechanism | High | Medium | **P0** | Current |
| #3: Invisible error state | High | Low | **P0** | Current |
| #4: Poor information scent | High | Medium | **P1** | Current |
| #5: No empty state | Medium | Low | **P1** | Current |
| #6: Visual disconnection | Medium | Low | **P1** | Next |
| #7: Inconsistent patterns | Low | High | P2 | Backlog |
| #8: No capability filtering | Medium | High | P2 | Backlog |
| #9: No cost transparency | Medium | Medium | P2 | Next |
| #10: No context window info | Medium | Low | P2 | Next |
| #11: Keyboard nav incomplete | Low | Medium | P3 | Backlog |
| #12: No performance indicators | Low | Low | P3 | Backlog |
| #13: No recently used | Low | Medium | P3 | Backlog |

### Implementation Phases

**Phase 1: Foundation (Current Sprint)**
- Implement dynamic model list based on configured API keys
- Add validation preventing selection of unconfigured models
- Add error dialog with "Add Key" CTA
- Add help text showing available model count
- Add basic provider icons

**Phase 2: Enhanced Discovery (Next Sprint)**
- Add "Ready to Use" vs "Requires API Key" sections
- Implement inline [+ Add Key] buttons
- Add toast notification when new models unlock
- Show basic model metadata (context window size)

**Phase 3: Rich Information (Future)**
- Add pricing information
- Add capability badges (vision, code, etc.)
- Implement hover tooltips with full specs
- Add "Show all models" progressive disclosure

**Phase 4: Advanced Features (Backlog)**
- Capability-based filtering
- Model comparison view
- Recently used / favorites
- Performance indicators
- Cost tracking

---

## Implementation Recommendations for Frontend-UI-Builder Agent

### File Structure

```
/Users/aideveloper/agent-swarm-monitor/
├── components/openclaw/
│   ├── ModelSelector.tsx              [NEW - Main component]
│   ├── ModelSelectItem.tsx            [NEW - Individual model option]
│   ├── ModelValueDisplay.tsx          [NEW - Selected value display]
│   └── AgentSettingsTab.tsx           [MODIFY - Use new ModelSelector]
├── lib/
│   ├── model-registry.ts              [NEW - Model definitions]
│   ├── model-utils.ts                 [NEW - Helper functions]
│   └── openclaw-utils.ts              [MODIFY - Deprecate MODEL_OPTIONS_RAW]
├── hooks/
│   └── useAvailableModels.ts          [NEW - Compute available models]
└── types/
    └── models.ts                      [NEW - Model type definitions]
```

### Data Model Definition

```typescript
// /Users/aideveloper/agent-swarm-monitor/types/models.ts

export type ModelCapability =
  | 'vision'
  | 'code'
  | 'reasoning'
  | 'function-calling'
  | 'json-mode';

export type ModelSpeed = 'fast' | 'medium' | 'slow';

export type ModelCategory =
  | 'flagship'        // Most capable, expensive
  | 'balanced'        // Good balance of speed/cost/quality
  | 'fast'            // Optimized for speed
  | 'specialized';    // Niche use cases

export interface ModelPricing {
  input: number;      // USD per 1M tokens
  output: number;     // USD per 1M tokens
}

export interface ModelDefinition {
  id: string;                         // "anthropic/claude-opus-4-5"
  name: string;                       // "Claude Opus 4.5"
  provider: ApiKeyProviderId;         // "anthropic"
  providerName: string;               // "Anthropic"
  contextWindow: number;              // 200000
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  speed: ModelSpeed;
  category: ModelCategory;
  description?: string;               // Optional long description
  releaseDate?: string;               // ISO date
  deprecated?: boolean;
}

export interface ModelGroup {
  provider: ApiKeyProviderId;
  providerName: string;
  isConfigured: boolean;
  models: ModelDefinition[];
}
```

### Model Registry

```typescript
// /Users/aideveloper/agent-swarm-monitor/lib/model-registry.ts

import { ModelDefinition } from '@/types/models';

/**
 * Central registry of all supported models
 *
 * IMPORTANT: Keep this in sync with backend model support
 * TODO: Consider fetching from API endpoint for dynamic updates
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // Anthropic Models
  {
    id: 'anthropic/claude-opus-4-5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    providerName: 'Anthropic',
    contextWindow: 200000,
    capabilities: ['vision', 'code', 'reasoning', 'function-calling'],
    pricing: { input: 15, output: 75 },
    speed: 'medium',
    category: 'flagship',
    description: 'Most capable model for complex reasoning and analysis',
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    providerName: 'Anthropic',
    contextWindow: 200000,
    capabilities: ['vision', 'code', 'reasoning', 'function-calling'],
    pricing: { input: 3, output: 15 },
    speed: 'medium',
    category: 'balanced',
    description: 'Balanced performance and cost for most use cases',
  },
  {
    id: 'anthropic/claude-haiku-4',
    name: 'Claude Haiku 4',
    provider: 'anthropic',
    providerName: 'Anthropic',
    contextWindow: 200000,
    capabilities: ['vision', 'code'],
    pricing: { input: 0.25, output: 1.25 },
    speed: 'fast',
    category: 'fast',
    description: 'Fast and cost-effective for high-volume tasks',
  },

  // OpenAI Models
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    contextWindow: 128000,
    capabilities: ['vision', 'code', 'function-calling', 'json-mode'],
    pricing: { input: 2.5, output: 10 },
    speed: 'medium',
    category: 'flagship',
    description: 'OpenAI flagship model with vision capabilities',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    providerName: 'OpenAI',
    contextWindow: 128000,
    capabilities: ['code', 'function-calling', 'json-mode'],
    pricing: { input: 0.15, output: 0.6 },
    speed: 'fast',
    category: 'fast',
    description: 'Fast and affordable alternative to GPT-4o',
  },

  // Google Models
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google-ai',
    providerName: 'Google AI',
    contextWindow: 1000000,
    capabilities: ['vision', 'code', 'reasoning'],
    pricing: { input: 0.1, output: 0.4 },
    speed: 'fast',
    category: 'fast',
    description: 'Ultra-fast with massive context window',
  },

  // Groq Models (via API)
  {
    id: 'groq/llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    providerName: 'Groq',
    contextWindow: 128000,
    capabilities: ['code', 'reasoning'],
    pricing: { input: 0.59, output: 0.79 },
    speed: 'fast',
    category: 'fast',
    description: 'Open-source model optimized for speed on Groq hardware',
  },

  // Mistral Models
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    providerName: 'Mistral',
    contextWindow: 128000,
    capabilities: ['code', 'reasoning', 'function-calling'],
    pricing: { input: 2, output: 6 },
    speed: 'medium',
    category: 'flagship',
    description: 'Flagship European model with strong multilingual support',
  },

  // Add more models as they become available...
  // TODO: Fetch this dynamically from backend API
];

/**
 * Get model definition by ID
 */
export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(m => m.id === id);
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(providerId: string): ModelDefinition[] {
  return MODEL_REGISTRY.filter(m => m.provider === providerId);
}

/**
 * Get models by capability
 */
export function getModelsByCapability(capability: ModelCapability): ModelDefinition[] {
  return MODEL_REGISTRY.filter(m => m.capabilities.includes(capability));
}

/**
 * Group models by provider
 */
export function groupModelsByProvider(
  configuredProviders: Set<string>
): ModelGroup[] {
  const groups = new Map<string, ModelDefinition[]>();

  MODEL_REGISTRY.forEach(model => {
    if (!groups.has(model.provider)) {
      groups.set(model.provider, []);
    }
    groups.get(model.provider)!.push(model);
  });

  return Array.from(groups.entries()).map(([provider, models]) => ({
    provider: provider as ApiKeyProviderId,
    providerName: models[0].providerName,
    isConfigured: configuredProviders.has(provider),
    models: models.sort((a, b) => {
      // Sort: flagship → balanced → fast → specialized
      const order = { flagship: 0, balanced: 1, fast: 2, specialized: 3 };
      return order[a.category] - order[b.category];
    }),
  }));
}
```

### Custom Hook for Available Models

```typescript
// /Users/aideveloper/agent-swarm-monitor/hooks/useAvailableModels.ts

import { useMemo } from 'react';
import { MODEL_REGISTRY, getModelById } from '@/lib/model-registry';
import type { ApiKeyProviderId } from '@/types/agent-configuration';
import type { ModelDefinition } from '@/types/models';

export interface UseAvailableModelsResult {
  allModels: ModelDefinition[];
  availableModels: ModelDefinition[];
  unavailableModels: ModelDefinition[];
  configuredProviders: Set<ApiKeyProviderId>;
  isModelAvailable: (modelId: string) => boolean;
  getModelRequirement: (modelId: string) => {
    provider: ApiKeyProviderId;
    providerName: string;
  } | null;
}

/**
 * Hook to compute which models are available based on configured API keys
 */
export function useAvailableModels(
  configuredApiKeys?: Record<string, any>
): UseAvailableModelsResult {
  const configuredProviders = useMemo(() => {
    if (!configuredApiKeys) return new Set<ApiKeyProviderId>();
    return new Set(Object.keys(configuredApiKeys) as ApiKeyProviderId[]);
  }, [configuredApiKeys]);

  const { availableModels, unavailableModels } = useMemo(() => {
    const available: ModelDefinition[] = [];
    const unavailable: ModelDefinition[] = [];

    MODEL_REGISTRY.forEach(model => {
      if (configuredProviders.has(model.provider)) {
        available.push(model);
      } else {
        unavailable.push(model);
      }
    });

    return { availableModels: available, unavailableModels: unavailable };
  }, [configuredProviders]);

  const isModelAvailable = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (!model) return false;
    return configuredProviders.has(model.provider);
  }, [configuredProviders]);

  const getModelRequirement = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (!model) return null;
    return {
      provider: model.provider,
      providerName: model.providerName,
    };
  }, []);

  return {
    allModels: MODEL_REGISTRY,
    availableModels,
    unavailableModels,
    configuredProviders,
    isModelAvailable,
    getModelRequirement,
  };
}
```

### Component Implementation

See **Solution A + D Hybrid** component code above (lines 229-377 of this document).

### Integration with AgentSettingsTab

```typescript
// Modify AgentSettingsTab.tsx

import { ModelSelector } from './ModelSelector';
import { useAvailableModels } from '@/hooks/useAvailableModels';

export default function AgentSettingsTab({ agent, ... }) {
  // ... existing state ...

  // Compute available models based on configured API keys
  const { isModelAvailable, getModelRequirement } = useAvailableModels(
    agentConfig.apiKeys
  );

  // Validate model selection
  const handleModelChange = useCallback((newModelId: string) => {
    if (!isModelAvailable(newModelId)) {
      const requirement = getModelRequirement(newModelId);
      if (!requirement) return;

      // Show dialog prompting user to add API key
      showDialog({
        title: `${requirement.providerName} API Key Required`,
        description: `To use this model, you need to add a ${requirement.providerName} API key.`,
        actions: [
          { label: 'Cancel', onClick: () => {} },
          {
            label: `Add ${requirement.providerName} Key`,
            onClick: () => {
              setSelectedProvider(requirement.provider as ApiKeyProviderId);
              setShowApiKeyModal(true);
            }
          }
        ]
      });
      return;
    }

    setModel(newModelId);
  }, [isModelAvailable, getModelRequirement]);

  // ... rest of component ...

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Agent Name + Model row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          {/* Name input - unchanged */}
        </div>

        {/* REPLACE OLD SELECT WITH NEW MODELSELECTOR */}
        <ModelSelector
          value={model}
          onChange={handleModelChange}
          configuredProviders={new Set(Object.keys(agentConfig.apiKeys || {}))}
          onAddApiKey={(providerId) => {
            setSelectedProvider(providerId);
            setShowApiKeyModal(true);
          }}
        />
      </div>

      {/* ... rest of component unchanged ... */}
    </div>
  );
}
```

### Testing Checklist

**Unit Tests:**
- [ ] `getModelById()` returns correct model
- [ ] `getModelsByProvider()` filters correctly
- [ ] `useAvailableModels()` computes availability correctly
- [ ] `isModelAvailable()` validates correctly

**Integration Tests:**
- [ ] Adding API key updates model list
- [ ] Removing API key removes models from available list
- [ ] Selecting unavailable model shows error dialog
- [ ] Error dialog "Add Key" button opens correct API key modal
- [ ] Toast notification shows after adding key
- [ ] Model selector auto-updates after key added

**Accessibility Tests:**
- [ ] Keyboard navigation works (Tab, Arrow, Enter, Escape)
- [ ] Screen reader announces model availability
- [ ] ARIA labels are present and correct
- [ ] Focus visible on all interactive elements
- [ ] Error messages announced to screen readers

**Visual Regression Tests:**
- [ ] Model selector matches design specs
- [ ] Provider icons display correctly
- [ ] Status badges render correctly
- [ ] Dropdown scrolls properly with 12+ models
- [ ] Responsive behavior on mobile (320px width)

---

## Migration Strategy

### Phase 1: Add New Components (No Breaking Changes)
1. Create `ModelSelector.tsx` as new component
2. Create `model-registry.ts` with model definitions
3. Create `useAvailableModels.ts` hook
4. **Do not modify** `AgentSettingsTab.tsx` yet

### Phase 2: Feature Flag Rollout
1. Add feature flag `ENABLE_DYNAMIC_MODELS` (env var)
2. Conditionally render old or new model selector based on flag
3. Deploy to staging with flag enabled
4. QA test thoroughly
5. Deploy to production with flag disabled
6. Enable flag for 10% of users
7. Monitor error rates and user feedback
8. Gradually increase to 100%

### Phase 3: Cleanup
1. Remove old hardcoded `MODEL_OPTIONS_RAW` from `openclaw-utils.ts`
2. Remove feature flag
3. Delete old code paths
4. Update documentation

### Rollback Plan
If issues arise:
1. Disable feature flag immediately (zero downtime)
2. Investigate root cause
3. Fix and redeploy
4. Re-enable flag gradually

---

## Success Metrics

### Quantitative
- **Reduce** model selection errors by 80%
- **Increase** API key additions by 40% (better discoverability)
- **Reduce** time-to-first-model-selection by 50%
- **Increase** usage of non-default models by 60%

### Qualitative
- Users report "it's obvious which models I can use"
- Support tickets about "model not working" decrease significantly
- Users discover and try more model options
- Higher satisfaction scores in Settings UX survey

### Tracking Implementation
```typescript
// Add analytics events
analytics.track('model_selected', {
  model_id: modelId,
  had_api_key: isAvailable,
  provider: provider,
  selection_source: 'dropdown' | 'toast_cta' | 'error_dialog'
});

analytics.track('api_key_added', {
  provider: providerId,
  models_unlocked_count: newlyAvailableModels.length,
  trigger: 'settings_page' | 'model_selection_error' | 'inline_cta'
});
```

---

## Open Questions for Product Team

1. **Model Discovery**: Should we show all 12+ models by default, or continue hiding unavailable ones initially?
   - **Recommendation:** Show all with clear status indicators (better discovery)

2. **Pricing Display**: Do we show pricing in the model selector, or keep it in docs?
   - **Recommendation:** Show pricing (users care about cost, especially for production use)

3. **Model Recommendations**: Should we add "Recommended for [use case]" badges?
   - **Example:** "Recommended for code" on Claude Sonnet 4
   - **Recommendation:** Yes, in Phase 3 (after basic functionality is solid)

4. **API Key Validation**: Should we validate API keys immediately when user adds them, or only when they select a model?
   - **Current implementation:** Validate immediately (via Test Connection flow)
   - **Recommendation:** Keep current approach (prevents storing invalid keys)

5. **Default Model**: If user has multiple providers configured, which model should be selected by default?
   - **Current:** First model in hardcoded list (Claude Opus 4.5)
   - **Recommendation:** Most recently used, or cheapest flagship model (Claude Sonnet 4)

6. **Model Deprecation**: How do we handle when a model is deprecated (e.g., GPT-4 → GPT-4o)?
   - **Recommendation:** Add `deprecated: true` flag, show warning banner, suggest replacement

---

## Appendix: Related Issues & Documentation

### Related GitHub Issues (Hypothetical)
- Issue #24: User-Level API Key Storage (Frontend) - COMPLETED
- Issue #96: User-Level API Key Storage (Backend) - IN PROGRESS
- Issue #XXX: Dynamic Model Selection UI - THIS PROPOSAL
- Issue #YYY: Model Cost Tracking & Budgets - BACKLOG

### Related Documentation
- `/Users/aideveloper/agent-swarm-monitor/docs/ISSUE_24_API_KEYS_FRONTEND_IMPLEMENTATION.md`
- `/Users/aideveloper/agent-swarm-monitor/types/agent-configuration.ts`
- `/Users/aideveloper/openclaw-backend/CLAUDE.md` (backend model support)

### External References
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Model Context Protocol (MCP): https://modelcontextprotocol.io
- Anthropic Model Pricing: https://www.anthropic.com/pricing
- OpenAI Model Pricing: https://openai.com/pricing

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-07 | UX Advocate (Claude Code) | Initial UX review and proposal |

---

**END OF DOCUMENT**
