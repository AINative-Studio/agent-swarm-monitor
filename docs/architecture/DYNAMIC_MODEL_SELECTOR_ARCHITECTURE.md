# Dynamic Model Selector - Architecture Diagram

## Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AgentSettingsTab Component                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Agent Configuration State                  │  │
│  │  - agentConfig.apiKeys (from agent.configuration)    │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Model Catalog Functions                 │  │
│  │                                                      │  │
│  │  getAvailableModels(apiKeys)  ────────────┐         │  │
│  │  getModelsByProvider(apiKeys) ─────────┐  │         │  │
│  │  isModelAvailable(model, apiKeys) ──┐  │  │         │  │
│  └─────────────────────────────────────┼──┼──┼─────────┘  │
│                                        │  │  │             │
│                       ┌────────────────┘  │  │             │
│                       │     ┌─────────────┘  │             │
│                       │     │     ┌──────────┘             │
│                       ▼     ▼     ▼                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Model Selector UI                    │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ No API Keys?                                   │ │  │
│  │  │   → Show warning message                       │ │  │
│  │  │   → "Add API keys below to access models"      │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Has API Keys?                                  │ │  │
│  │  │   → Group models by provider                   │ │  │
│  │  │   → Show tier badges (premium/standard/fast)   │ │  │
│  │  │   → Validate current model availability        │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Current Model Unavailable?                     │ │  │
│  │  │   → Amber border on selector                   │ │  │
│  │  │   → Warning icon + message below               │ │  │
│  │  │   → "Requires API key that is not configured"  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────┐
│   Agent Database    │
│                     │
│  configuration: {   │
│    apiKeys: {       │
│      anthropic: {}  │
│      openai: {}     │
│      groq: {}       │
│    }                │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AgentSettingsTab    │
│  useMemo hooks      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│        Model Catalog Logic              │
│                                         │
│  MODEL_CATALOG (11 providers)           │
│    ├─ anthropic (5 models)              │
│    ├─ openai (7 models)                 │
│    ├─ google-ai (4 models)              │
│    ├─ mistral (5 models)                │
│    ├─ groq (6 models)                   │
│    ├─ openrouter (6 models)             │
│    ├─ venice-ai (3 models)              │
│    ├─ minimax (2 models)                │
│    ├─ moonshot-ai (3 models)            │
│    ├─ 2-ai (1 model)                    │
│    └─ cerebras (2 models)               │
│                                         │
│  Filter by apiKeys:                     │
│    apiKeys present? → return provider   │
│    no apiKeys? → return DEFAULT_MODELS  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         Rendered UI States              │
│                                         │
│  STATE 1: No API Keys                   │
│    ┌─────────────────────────────────┐  │
│    │ ⚠️  No API keys configured      │  │
│    │ Add API keys below to access    │  │
│    │ available models.               │  │
│    └─────────────────────────────────┘  │
│                                         │
│  STATE 2: API Keys Configured           │
│    ┌─────────────────────────────────┐  │
│    │ ✨ Model ▼                      │  │
│    │                                 │  │
│    │ ANTHROPIC                       │  │
│    │   Claude Opus 4.5 [premium]     │  │
│    │   Claude Sonnet 4 [standard]    │  │
│    │                                 │  │
│    │ OPENAI                          │  │
│    │   GPT-4o [premium]              │  │
│    │   GPT-4o Mini [fast]            │  │
│    └─────────────────────────────────┘  │
│                                         │
│  STATE 3: Model Requires Missing Key    │
│    ┌─────────────────────────────────┐  │
│    │ ✨ Model ▼ (amber border)      │  │
│    └─────────────────────────────────┘  │
│    ⚠️ Current model requires an API    │
│    key that is not configured           │
└─────────────────────────────────────────┘
```

## API Key Provider Mapping

```
┌──────────────────────┬────────────────────────────────┐
│   Provider ID        │   Available Models             │
├──────────────────────┼────────────────────────────────┤
│ anthropic            │ 5 Claude models                │
│ openai               │ 7 GPT/o1 models                │
│ google-ai            │ 4 Gemini models                │
│ mistral              │ 5 Mistral/Mixtral models       │
│ groq                 │ 6 Llama/Mixtral/Gemma models   │
│ openrouter           │ 6 models via OpenRouter        │
│ venice-ai            │ 3 Llama models                 │
│ minimax              │ 2 ABAB models                  │
│ moonshot-ai          │ 3 Moonshot models              │
│ 2-ai                 │ 1 2.AI Chat model              │
│ cerebras             │ 2 Llama models                 │
└──────────────────────┴────────────────────────────────┘

Total: 44+ unique models across 11 providers
```

## Tier System

```
┌──────────┬─────────────────────────────────────────────┐
│  Tier    │  Examples                                   │
├──────────┼─────────────────────────────────────────────┤
│ premium  │ Claude Opus 4.5, GPT-4o, Gemini 1.5 Pro     │
│          │ Llama 3.1 70B, Mistral Large                │
├──────────┼─────────────────────────────────────────────┤
│ standard │ Claude Sonnet 4, Mistral Medium             │
│          │ Mixtral 8x7B, o1 Mini                       │
├──────────┼─────────────────────────────────────────────┤
│ fast     │ Claude 3 Haiku, GPT-4o Mini                 │
│          │ Gemini 2.0 Flash, Llama 3.1 8B              │
└──────────┴─────────────────────────────────────────────┘
```

## Function Call Flow

```
Component Render
    ├─▶ useMemo(() => getAvailableModels(apiKeys))
    │       ├─▶ Check if apiKeys empty/undefined
    │       ├─▶ If empty: return DEFAULT_MODELS (4 models)
    │       └─▶ If present: filter MODEL_CATALOG by provider
    │
    ├─▶ useMemo(() => isModelAvailable(model, apiKeys))
    │       ├─▶ Find provider for model
    │       ├─▶ Check if provider key exists
    │       └─▶ Return availability boolean
    │
    └─▶ useMemo(() => getModelsByProvider(apiKeys))
            ├─▶ Filter providers with API keys
            └─▶ Return grouped structure for dropdown
```

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│                   API Keys Section                      │
│  User adds/removes API keys                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Updates agent.configuration.apiKeys
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Model Selector Section                    │
│  React to apiKeys changes via useMemo                   │
│  Re-render with new available models                    │
└─────────────────────────────────────────────────────────┘

State Flow:
  1. User clicks "Add Key" for Anthropic
  2. ApiKeyModal opens → user enters key
  3. handleSaveApiKey() updates configuration
  4. Agent configuration saved to database
  5. onAgentUpdate() refreshes agent data
  6. Component re-renders with new agentConfig
  7. useMemo hooks recalculate:
     - availableModels (4 → 9 models)
     - modelsByProvider (1 → 2 groups)
     - isCurrentModelAvailable (re-check)
  8. UI updates: dropdown shows new models
```

## Backward Compatibility Layer

```
┌──────────────────────────────────────────────────────────┐
│           /lib/openclaw-utils.ts                         │
│                                                          │
│  export { formatModelShort } from './model-catalog';     │
│  export { DEFAULT_MODELS as MODEL_OPTIONS }              │
│  export { DEFAULT_MODELS as MODEL_OPTIONS_RAW }          │
└──────────────┬───────────────────────────────────────────┘
               │
               │ Re-exports maintain compatibility
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│        Existing Code (unchanged)                         │
│                                                          │
│  import { MODEL_OPTIONS } from '@/lib/openclaw-utils'    │
│  import { formatModelShort } from '@/lib/openclaw-utils' │
│                                                          │
│  Still works without modifications!                      │
└──────────────────────────────────────────────────────────┘
```

## Performance Considerations

- **useMemo hooks**: Prevent unnecessary recalculation of available models
- **Static catalog**: No API calls needed for model list
- **Efficient filtering**: O(n) where n = number of providers (max 11)
- **Lazy loading**: Select dropdown only renders when opened
- **Bounded size**: Max 70 models (scrollable dropdown with max-h-[400px])
