/**
 * Model Catalog
 *
 * Maps API key providers to their available models.
 * Each model includes a display label and the full model identifier.
 */

export interface ModelOption {
  value: string;
  label: string;
  provider: string;
  tier?: 'premium' | 'standard' | 'fast';
}

export interface ProviderModels {
  id: string;
  name: string;
  models: ModelOption[];
}

/**
 * Comprehensive catalog of models organized by provider
 */
export const MODEL_CATALOG: ProviderModels[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { value: 'anthropic/claude-opus-4-5', label: 'Claude Opus 4.5', provider: 'anthropic', tier: 'premium' },
      { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'anthropic', tier: 'standard' },
      { value: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'standard' },
      { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (cheapest)', provider: 'anthropic', tier: 'fast' },
      { value: 'anthropic/claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'anthropic', tier: 'premium' },
      { value: 'anthropic/claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'anthropic', tier: 'fast' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openai', tier: 'premium' },
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', tier: 'fast' },
      { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai', tier: 'premium' },
      { value: 'openai/gpt-4', label: 'GPT-4', provider: 'openai', tier: 'premium' },
      { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai', tier: 'fast' },
      { value: 'openai/o1-preview', label: 'o1 Preview', provider: 'openai', tier: 'premium' },
      { value: 'openai/o1-mini', label: 'o1 Mini', provider: 'openai', tier: 'standard' },
    ],
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    models: [
      { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google-ai', tier: 'fast' },
      { value: 'google/gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google-ai', tier: 'premium' },
      { value: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'google-ai', tier: 'fast' },
      { value: 'google/gemini-pro', label: 'Gemini Pro', provider: 'google-ai', tier: 'standard' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    models: [
      { value: 'mistral/mistral-large-latest', label: 'Mistral Large', provider: 'mistral', tier: 'premium' },
      { value: 'mistral/mistral-medium-latest', label: 'Mistral Medium', provider: 'mistral', tier: 'standard' },
      { value: 'mistral/mistral-small-latest', label: 'Mistral Small', provider: 'mistral', tier: 'fast' },
      { value: 'mistral/mixtral-8x7b-instruct', label: 'Mixtral 8x7B', provider: 'mistral', tier: 'standard' },
      { value: 'mistral/mistral-7b-instruct', label: 'Mistral 7B', provider: 'mistral', tier: 'fast' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    models: [
      { value: 'groq/llama-3.1-70b-versatile', label: 'Llama 3.1 70B', provider: 'groq', tier: 'premium' },
      { value: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B', provider: 'groq', tier: 'fast' },
      { value: 'groq/llama-3-70b-8192', label: 'Llama 3 70B', provider: 'groq', tier: 'premium' },
      { value: 'groq/llama-3-8b-8192', label: 'Llama 3 8B', provider: 'groq', tier: 'fast' },
      { value: 'groq/mixtral-8x7b-32768', label: 'Mixtral 8x7B', provider: 'groq', tier: 'standard' },
      { value: 'groq/gemma-7b-it', label: 'Gemma 7B', provider: 'groq', tier: 'fast' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { value: 'openrouter/anthropic/claude-opus-4-5', label: 'Claude Opus 4.5 (via OpenRouter)', provider: 'openrouter', tier: 'premium' },
      { value: 'openrouter/anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (via OpenRouter)', provider: 'openrouter', tier: 'standard' },
      { value: 'openrouter/openai/gpt-4o', label: 'GPT-4o (via OpenRouter)', provider: 'openrouter', tier: 'premium' },
      { value: 'openrouter/google/gemini-2.0-flash', label: 'Gemini 2.0 Flash (via OpenRouter)', provider: 'openrouter', tier: 'fast' },
      { value: 'openrouter/meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (via OpenRouter)', provider: 'openrouter', tier: 'premium' },
      { value: 'openrouter/qwen/qwen-2-72b-instruct', label: 'Qwen 2 72B (via OpenRouter)', provider: 'openrouter', tier: 'premium' },
    ],
  },
  {
    id: 'venice-ai',
    name: 'Venice AI',
    models: [
      { value: 'venice-ai/llama-3.1-405b', label: 'Llama 3.1 405B', provider: 'venice-ai', tier: 'premium' },
      { value: 'venice-ai/llama-3.1-70b', label: 'Llama 3.1 70B', provider: 'venice-ai', tier: 'standard' },
      { value: 'venice-ai/llama-3.1-8b', label: 'Llama 3.1 8B', provider: 'venice-ai', tier: 'fast' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    models: [
      { value: 'minimax/abab6-chat', label: 'ABAB 6 Chat', provider: 'minimax', tier: 'standard' },
      { value: 'minimax/abab5.5-chat', label: 'ABAB 5.5 Chat', provider: 'minimax', tier: 'standard' },
    ],
  },
  {
    id: 'moonshot-ai',
    name: 'Moonshot AI',
    models: [
      { value: 'moonshot-ai/moonshot-v1-128k', label: 'Moonshot v1 128K', provider: 'moonshot-ai', tier: 'premium' },
      { value: 'moonshot-ai/moonshot-v1-32k', label: 'Moonshot v1 32K', provider: 'moonshot-ai', tier: 'standard' },
      { value: 'moonshot-ai/moonshot-v1-8k', label: 'Moonshot v1 8K', provider: 'moonshot-ai', tier: 'fast' },
    ],
  },
  {
    id: '2-ai',
    name: '2.AI',
    models: [
      { value: '2-ai/twoai-chat', label: '2.AI Chat', provider: '2-ai', tier: 'standard' },
    ],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    models: [
      { value: 'cerebras/llama3.1-70b', label: 'Llama 3.1 70B', provider: 'cerebras', tier: 'premium' },
      { value: 'cerebras/llama3.1-8b', label: 'Llama 3.1 8B', provider: 'cerebras', tier: 'fast' },
    ],
  },
];

/**
 * Default models shown when no API keys are configured
 */
export const DEFAULT_MODELS: ModelOption[] = [
  { value: 'anthropic/claude-opus-4-5', label: 'Claude Opus 4.5', provider: 'anthropic', tier: 'premium' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'anthropic', tier: 'standard' },
  { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (cheapest)', provider: 'anthropic', tier: 'fast' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openai', tier: 'premium' },
  { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google-ai', tier: 'fast' },
];

/**
 * Get available models based on configured API keys
 *
 * @param apiKeys - The configured API keys from agent.configuration.apiKeys
 * @returns Array of available model options
 */
export function getAvailableModels(apiKeys?: Record<string, any>): ModelOption[] {
  // If no API keys configured, return default models
  if (!apiKeys || Object.keys(apiKeys).length === 0) {
    return DEFAULT_MODELS;
  }

  // Get models from all providers with configured API keys
  const availableModels: ModelOption[] = [];

  for (const provider of MODEL_CATALOG) {
    if (apiKeys[provider.id]) {
      availableModels.push(...provider.models);
    }
  }

  // If no models found from configured providers, fall back to defaults
  return availableModels.length > 0 ? availableModels : DEFAULT_MODELS;
}

/**
 * Get models grouped by provider for a categorized display
 *
 * @param apiKeys - The configured API keys from agent.configuration.apiKeys
 * @returns Array of provider groups with their models
 */
export function getModelsByProvider(apiKeys?: Record<string, any>): ProviderModels[] {
  if (!apiKeys || Object.keys(apiKeys).length === 0) {
    // Group default models by provider
    const grouped = new Map<string, ModelOption[]>();
    for (const model of DEFAULT_MODELS) {
      if (!grouped.has(model.provider)) {
        grouped.set(model.provider, []);
      }
      grouped.get(model.provider)!.push(model);
    }

    return Array.from(grouped.entries()).map(([provider, models]) => ({
      id: provider,
      name: MODEL_CATALOG.find(p => p.id === provider)?.name || provider,
      models,
    }));
  }

  return MODEL_CATALOG.filter(provider => apiKeys[provider.id]);
}

/**
 * Format model name for short display
 * Preserves existing logic from openclaw-utils.ts
 */
export function formatModelShort(model: string): string {
  const parts = model.split('/');
  const name = parts[parts.length - 1];
  return name
    .replace('claude-', 'Claude ')
    .replace('opus-4-5', 'Opus 4.5')
    .replace('sonnet-4', 'Sonnet 4')
    .replace('gpt-4o', 'GPT-4o')
    .replace('gemini-2.0-flash', 'Gemini 2.0 Flash')
    .replace('llama-3.1-70b-versatile', 'Llama 3.1 70B')
    .replace('llama-3.1-8b-instant', 'Llama 3.1 8B')
    .replace('mistral-large-latest', 'Mistral Large')
    .replace('mixtral-8x7b-instruct', 'Mixtral 8x7B');
}

/**
 * Get provider info for a given model
 */
export function getProviderForModel(modelValue: string): { id: string; name: string } | null {
  for (const provider of MODEL_CATALOG) {
    if (provider.models.some(m => m.value === modelValue)) {
      return { id: provider.id, name: provider.name };
    }
  }
  return null;
}

/**
 * Check if a specific model requires an API key that is not configured
 */
export function isModelAvailable(modelValue: string, apiKeys?: Record<string, any>): boolean {
  const provider = getProviderForModel(modelValue);
  if (!provider) return false;

  // If no API keys configured, only default models are available
  if (!apiKeys || Object.keys(apiKeys).length === 0) {
    return DEFAULT_MODELS.some(m => m.value === modelValue);
  }

  return !!apiKeys[provider.id];
}
