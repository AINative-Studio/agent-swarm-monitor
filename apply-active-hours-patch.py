#!/usr/bin/env python3
"""
Script to apply Active Hours functionality to AgentSettingsTab.tsx
This script makes all necessary changes in one atomic operation to avoid linter conflicts.
"""

import re

FILE_PATH = "components/openclaw/AgentSettingsTab.tsx"

def main():
    with open(FILE_PATH, 'r') as f:
        content = f.read()

    # 1. Add Clock to lucide-react imports
    content = content.replace(
        "import { Plus, ExternalLink, Play, RotateCcw, Trash2, Send } from 'lucide-react';",
        "import { Plus, ExternalLink, Play, RotateCcw, Trash2, Send, Clock } from 'lucide-react';"
    )

    # 2. Add ActiveHours type import
    content = content.replace(
        "import type { OpenClawAgent, UpdateAgentSettingsRequest, HeartbeatInterval } from '@/types/openclaw';",
        "import type { OpenClawAgent, UpdateAgentSettingsRequest, HeartbeatInterval } from '@/types/openclaw';\nimport type { ActiveHours } from '@/types/agent-configuration';\nimport { DEFAULT_ACTIVE_HOURS } from '@/types/agent-configuration';"
    )

    # 3. Add ActiveHoursModal import
    content = content.replace(
        "import IntegrationRow from './IntegrationRow';",
        "import IntegrationRow from './IntegrationRow';\nimport ActiveHoursModal from './ActiveHoursModal';"
    )

    # 4. Replace activeHours state
    content = content.replace(
        "  const [activeHours, setActiveHours] = useState(false);",
        """  // Active Hours state - Initialize from agent configuration
  const [activeHoursConfig, setActiveHoursConfig] = useState<ActiveHours>(() => {
    const config = (agent.configuration as any)?.activeHours;
    return config || DEFAULT_ACTIVE_HOURS;
  });
  const [showActiveHoursModal, setShowActiveHoursModal] = useState(false);"""
    )

    # 5. Add handler functions after handleSubmitFixPrompt
    handler_functions = """
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
"""

    # Find where to insert handler functions (after handleSubmitFixPrompt)
    pattern = r'(  }, \[agent\.id, fixPrompt, agent\.configuration, agent\.openclawSessionKey\]\);)\n'
    if re.search(pattern, content):
        content = re.sub(pattern, r'\1' + handler_functions, content)

    # 6. Replace Active Hours UI section
    old_ui = """              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Active Hours
                </Label>
                <Switch
                  checked={activeHours}
                  onCheckedChange={setActiveHours}
                  aria-label="Enable active hours"
                />
              </div>"""

    new_ui = """              <div className="space-y-2">
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
              </div>"""

    content = content.replace(old_ui, new_ui)

    # 7. Add modal before closing the main component div
    # Find the pattern: Delete button section, then closing divs, then closing paren-semicolon
    modal_code = """
      {/* Active Hours Modal */}
      <ActiveHoursModal
        open={showActiveHoursModal}
        onClose={() => setShowActiveHoursModal(false)}
        activeHours={activeHoursConfig}
        onSave={handleSaveActiveHours}
      />"""

    # Insert before the final </div> of the component (before the Sparkle function)
    pattern = r'(      </div>\n    </div>\n  \);\n}\n\n/\*\* Small sparkle icon)'
    if re.search(pattern, content):
        content = re.sub(pattern, r'      </div>' + modal_code + r'\n    </div>\n  );\n}\n\n/** Small sparkle icon', content)

    # Write the modified content
    with open(FILE_PATH, 'w') as f:
        f.write(content)

    print(f"✓ Successfully applied Active Hours functionality to {FILE_PATH}")
    print("Changes made:")
    print("  1. Added Clock icon import")
    print("  2. Added ActiveHours type imports")
    print("  3. Added ActiveHoursModal component import")
    print("  4. Replaced activeHours state with activeHoursConfig")
    print("  5. Added handler functions (handleActiveHoursToggle, handleSaveActiveHours, getActiveHoursSummary)")
    print("  6. Updated Active Hours UI section with toggle and summary")
    print("  7. Added ActiveHoursModal component at end")

if __name__ == "__main__":
    main()
