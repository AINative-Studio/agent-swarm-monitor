# Issue #77: Active Hours Toggle Implementation Guide

This document provides complete instructions for implementing the Active Hours toggle functionality in AgentSettingsTab.tsx.

## Files Created
1. `/types/agent-configuration.ts` - Type definitions with DEFAULT_ACTIVE_HOURS and COMMON_TIMEZONES
2. `/components/openclaw/ActiveHoursModal.tsx` - Modal component for configuring active hours

## Changes Needed in AgentSettingsTab.tsx

### 1. Update Imports

**Add to lucide-react import:**
```typescript
import { Plus, ExternalLink, Play, RotateCcw, Trash2, Send, Clock } from 'lucide-react';
```

**Add type imports:**
```typescript
import type { ActiveHours } from '@/types/agent-configuration';
import { DEFAULT_ACTIVE_HOURS } from '@/types/agent-configuration';
```

**Add component import:**
```typescript
import ActiveHoursModal from './ActiveHoursModal';
```

### 2. Replace State Management

**Find this line (around line 47):**
```typescript
const [activeHours, setActiveHours] = useState(false);
```

**Replace with:**
```typescript
// Active Hours state - Initialize from agent configuration
const [activeHoursConfig, setActiveHoursConfig] = useState<ActiveHours>(() => {
  const config = (agent.configuration as any)?.activeHours;
  return config || DEFAULT_ACTIVE_HOURS;
});
const [showActiveHoursModal, setShowActiveHoursModal] = useState(false);
```

### 3. Add Handler Functions

**Add after handleSubmitFixPrompt function (around line 115):**
```typescript
  // Active Hours handlers
  const handleActiveHoursToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Open configuration modal
      setShowActiveHoursModal(true);
    } else {
      // Disable active hours
      try {
        const currentConfig = agent.configuration || {};
        const updatedConfig = {
          ...currentConfig,
          activeHours: {
            ...activeHoursConfig,
            enabled: false,
          },
        };

        await openClawService.updateSettings(agent.id, {
          configuration: updatedConfig,
        });

        setActiveHoursConfig((prev) => ({
          ...prev,
          enabled: false,
        }));
      } catch (error) {
        console.error('Failed to disable active hours:', error);
      }
    }
  }, [agent.id, agent.configuration, activeHoursConfig]);

  const handleSaveActiveHours = useCallback(async (newActiveHours: ActiveHours) => {
    try {
      const currentConfig = agent.configuration || {};
      const updatedConfig = {
        ...currentConfig,
        activeHours: newActiveHours,
      };

      await openClawService.updateSettings(agent.id, {
        configuration: updatedConfig,
      });

      setActiveHoursConfig(newActiveHours);
      setShowActiveHoursModal(false);
    } catch (error) {
      console.error('Failed to save active hours:', error);
    }
  }, [agent.id, agent.configuration]);

  const getActiveHoursSummary = useCallback(() => {
    if (!activeHoursConfig.enabled) {
      return 'Not configured';
    }

    const enabledDays = Object.keys(activeHoursConfig.schedule).length;
    if (enabledDays === 0) {
      return 'No days scheduled';
    }

    return `${enabledDays} day${enabledDays !== 1 ? 's' : ''} configured`;
  }, [activeHoursConfig]);
```

### 4. Update Active Hours UI Section

**Find the Active Hours section (around line 194-203):**
```typescript
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Active Hours
                </Label>
                <Switch
                  checked={activeHours}
                  onCheckedChange={setActiveHours}
                  aria-label="Enable active hours"
                />
              </div>
```

**Replace with:**
```typescript
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Active Hours
                </Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={activeHoursConfig.enabled}
                    onCheckedChange={handleActiveHoursToggle}
                    aria-label="Enable active hours"
                  />
                  {activeHoursConfig.enabled && (
                    <button
                      type="button"
                      onClick={() => setShowActiveHoursModal(true)}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{getActiveHoursSummary()}</span>
                    </button>
                  )}
                </div>
              </div>
```

### 5. Add Modal at End of Component

**Find the closing div and return statement at the end of the component (before the Sparkle function):**
```typescript
      </div>
    </div>
  );
}
```

**Insert the modal BEFORE the closing `</div>` (inside the main component div):**
```typescript
      </div>

      {/* Active Hours Modal */}
      <ActiveHoursModal
        open={showActiveHoursModal}
        onClose={() => setShowActiveHoursModal(false)}
        activeHours={activeHoursConfig}
        onSave={handleSaveActiveHours}
      />
    </div>
  );
}
```

## Testing Instructions

1. Start the development server
2. Navigate to an agent's settings tab
3. Enable heartbeat
4. Toggle Active Hours on - modal should open
5. Configure timezone and days with time ranges
6. Save - verify data is stored in `agent.configuration.activeHours`
7. Toggle Active Hours off - verify `enabled` is set to false
8. Refresh page - verify configuration persists

## API Integration

The implementation uses `openClawService.updateSettings(agentId, { configuration })` which sends a PATCH request to `/agents/:id/settings` with the updated configuration object.

The active hours configuration is stored in:
```json
{
  "configuration": {
    "activeHours": {
      "enabled": true,
      "timezone": "America/New_York",
      "schedule": {
        "monday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "tuesday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" }
      }
    }
  }
}
```

## Notes

- This is configuration-only. Backend enforcement of active hours scheduling would require a separate background service.
- Times are stored in 24-hour format (HH:mm) but displayed with AM/PM in the modal.
- Timezone is stored as IANA timezone string (e.g., "America/New_York").
