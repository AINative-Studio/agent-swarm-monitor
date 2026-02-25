# API Keys Management Implementation Guide

This guide documents the changes needed to wire up the API Keys section in `AgentSettingsTab.tsx`.

## Files Created

1. `/Users/aideveloper/agent-swarm-monitor/types/agent-configuration.ts` - Updated with API key types
2. `/Users/aideveloper/agent-swarm-monitor/lib/api-key-utils.ts` - Utility functions for masking API keys
3. `/Users/aideveloper/agent-swarm-monitor/components/openclaw/ApiKeyModal.tsx` - Modal for adding/editing API keys

## Changes Needed to AgentSettingsTab.tsx

### 1. Update Imports

Add these imports at the top:

```typescript
import { X } from 'lucide-react'; // Add X to existing lucide-react import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API_KEY_PROVIDERS } from '@/types/agent-configuration';
import type { AgentConfiguration } from '@/types/agent-configuration';
import { maskApiKey } from '@/lib/api-key-utils';
import ApiKeyModal from './ApiKeyModal';
```

Remove or replace:
```typescript
import { MOCK_API_KEY_PROVIDERS } from '@/lib/openclaw-mock-data';
```

### 2. Add State Variables

After existing state variables, add:

```typescript
  // API Key modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; name: string } | null>(null);
  const [keyToRemove, setKeyToRemove] = useState<{ id: string; name: string } | null>(null);

  // Get agent configuration with type safety
  const agentConfig = useMemo<AgentConfiguration>(() => {
    return (agent.configuration as AgentConfiguration) || {};
  }, [agent.configuration]);
```

### 3. Add Handler Functions

After the `handleSave` function, add these handlers:

```typescript
  // API Key handlers
  const handleAddApiKey = useCallback((providerId: string, providerName: string) => {
    setSelectedProvider({ id: providerId, name: providerName });
    setShowApiKeyModal(true);
  }, []);

  const handleSaveApiKey = useCallback(async (providerId: string, apiKey: string) => {
    try {
      const currentConfig = agentConfig;
      const updatedConfig: AgentConfiguration = {
        ...currentConfig,
        apiKeys: {
          ...currentConfig.apiKeys,
          [providerId]: {
            key: apiKey,
            masked: maskApiKey(apiKey),
            addedAt: new Date().toISOString(),
          },
        },
      };

      await openClawService.updateSettings(agent.id, {
        configuration: updatedConfig,
      });

      // Show success toast if toast is available
      console.log(`API key for ${selectedProvider?.name} saved successfully`);

      // TODO: Refresh agent data if callback is available
      // if (onAgentUpdate) await onAgentUpdate();
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  }, [agent.id, agentConfig, selectedProvider]);

  const handleRemoveApiKey = useCallback(async () => {
    if (!keyToRemove) return;

    try {
      const currentConfig = agentConfig;
      const updatedApiKeys = { ...currentConfig.apiKeys };
      delete updatedApiKeys[keyToRemove.id];

      const updatedConfig: AgentConfiguration = {
        ...currentConfig,
        apiKeys: updatedApiKeys,
      };

      await openClawService.updateSettings(agent.id, {
        configuration: updatedConfig,
      });

      console.log(`API key for ${keyToRemove.name} removed successfully`);
      setKeyToRemove(null);

      // TODO: Refresh agent data if callback is available
      // if (onAgentUpdate) await onAgentUpdate();
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  }, [agent.id, agentConfig, keyToRemove]);
```

### 4. Replace API Keys JSX Section

Replace the existing API Keys section (lines ~212-234) with:

```typescript
      {/* API Keys */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">API Keys</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {API_KEY_PROVIDERS.map((provider) => {
            const apiKeyConfig = agentConfig.apiKeys?.[provider.id];
            const hasKey = !!apiKeyConfig;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{provider.name}</span>
                  {hasKey && (
                    <span className="ml-2 text-xs text-gray-500 font-mono">
                      {apiKeyConfig.masked}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasKey ? (
                    <button
                      type="button"
                      onClick={() => setKeyToRemove({ id: provider.id, name: provider.name })}
                      className={cn(
                        'inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded'
                      )}
                      title={`Remove ${provider.name} API key`}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="text-xs">Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddApiKey(provider.id, provider.name)}
                      className={cn(
                        'inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs">Add Key</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
```

### 5. Add Modal Components at End of Component

Before the closing `</div>` and after the Danger Zone section, add:

```typescript
      {/* API Key Modal */}
      {selectedProvider && (
        <ApiKeyModal
          open={showApiKeyModal}
          onClose={() => {
            setShowApiKeyModal(false);
            setSelectedProvider(null);
          }}
          providerName={selectedProvider.name}
          providerId={selectedProvider.id}
          onSave={handleSaveApiKey}
        />
      )}

      {/* Remove API Key Confirmation Dialog */}
      <AlertDialog open={!!keyToRemove} onOpenChange={(open) => !open && setKeyToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the {keyToRemove?.name} API key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveApiKey} className="bg-red-600 hover:bg-red-700">
              Remove Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

## Testing

1. Navigate to an agent's settings tab
2. Click "Add Key" for any provider (e.g., Anthropic)
3. Enter a test API key (e.g., `sk-ant-test-1234567890abcdef`)
4. Verify the key is saved and shows as masked (e.g., `sk-...cdef`)
5. Click "Remove" to delete the key
6. Confirm the removal dialog works
7. Verify the key is removed from the configuration

## Security Notes

- API keys are stored in the `agent.configuration.apiKeys` object
- Keys are masked for display using the `maskApiKey` utility
- Full keys are only sent to the backend, never logged to console
- Password input type is used in the modal for security
