'use client';

import { useState, useCallback } from 'react';
import { Plus, ExternalLink, Play, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OpenClawAgent, UpdateAgentSettingsRequest, HeartbeatInterval } from '@/types/openclaw';
import { MOCK_INTEGRATIONS, MOCK_API_KEY_PROVIDERS } from '@/lib/openclaw-mock-data';
import { MODEL_OPTIONS_RAW as MODEL_OPTIONS, HEARTBEAT_OPTIONS } from '@/lib/openclaw-utils';
import IntegrationRow from './IntegrationRow';

interface AgentSettingsTabProps {
  agent: OpenClawAgent;
  onSave: (data: UpdateAgentSettingsRequest) => void;
  onDelete: () => void;
  onRunHeartbeat: () => void;
  onRestart: () => void;
}

export default function AgentSettingsTab({
  agent,
  onSave,
  onDelete,
  onRunHeartbeat,
  onRestart,
}: AgentSettingsTabProps) {
  const [name, setName] = useState(agent.name);
  const [model, setModel] = useState(agent.model);
  const [persona, setPersona] = useState(agent.persona ?? '');
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(agent.heartbeatEnabled);
  const [heartbeatInterval, setHeartbeatInterval] = useState<HeartbeatInterval>(
    agent.heartbeatInterval ?? '5m'
  );
  const [activeHours, setActiveHours] = useState(false);
  const [heartbeatChecklist, setHeartbeatChecklist] = useState(
    agent.heartbeatChecklist?.join('\n') ?? ''
  );
  const [fixPrompt, setFixPrompt] = useState('');

  const handleSave = useCallback(() => {
    onSave({
      model,
      persona: persona.trim() || undefined,
      heartbeat: {
        enabled: heartbeatEnabled,
        interval: heartbeatEnabled ? heartbeatInterval : undefined,
        checklist: heartbeatEnabled && heartbeatChecklist.trim()
          ? heartbeatChecklist.split('\n').filter((line) => line.trim())
          : undefined,
      },
    });
  }, [model, persona, heartbeatEnabled, heartbeatInterval, heartbeatChecklist, onSave]);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Agent Name + Model row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="settings-name" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Agent Name
          </Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white border-gray-200 text-gray-900 h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-model" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Model
          </Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger
              id="settings-model"
              className="bg-white border-gray-200 text-gray-900 h-10"
            >
              <div className="flex items-center gap-2">
                <Sparkle className="h-3.5 w-3.5 text-gray-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {MODEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-gray-900 text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Persona */}
      <div className="space-y-2">
        <Label htmlFor="settings-persona" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Persona <span className="font-mono text-[10px] ml-1 text-blue-500 normal-case">SOUL.md</span>
        </Label>
        <Textarea
          id="settings-persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          rows={4}
          className="bg-white border-gray-200 text-gray-900 resize-none text-sm leading-relaxed"
          placeholder="Describe the agent's personality, role, and behavior..."
        />
      </div>

      <Separator className="bg-gray-100" />

      {/* Heartbeat section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Enable Heartbeat</h3>
            <p className="text-sm text-gray-500 mt-0.5">Run periodic background tasks</p>
          </div>
          <Switch
            checked={heartbeatEnabled}
            onCheckedChange={setHeartbeatEnabled}
            aria-label="Enable heartbeat"
          />
        </div>

        {heartbeatEnabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Heartbeat Interval
                </Label>
                <Select value={heartbeatInterval} onValueChange={(v) => setHeartbeatInterval(v as HeartbeatInterval)}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {HEARTBEAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-gray-900 text-sm">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-checklist" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Heartbeat Checklist <span className="font-mono text-[10px] ml-1 text-blue-500 normal-case">HEARTBEAT.md</span>
              </Label>
              <Textarea
                id="settings-checklist"
                value={heartbeatChecklist}
                onChange={(e) => setHeartbeatChecklist(e.target.value)}
                rows={4}
                className="bg-white border-gray-200 text-gray-900 resize-none text-sm leading-relaxed"
                placeholder="One task per line..."
              />
            </div>
          </>
        )}
      </div>

      <Separator className="bg-gray-100" />

      {/* Integrations */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
          <p className="text-sm text-gray-500 mt-0.5">Connect external services</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4">
          {MOCK_INTEGRATIONS.map((integration) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
            />
          ))}
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* API Keys */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">API Keys</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {MOCK_API_KEY_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between py-2 border-b border-gray-100"
            >
              <span className="text-sm text-gray-700">{provider.name}</span>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Add Key</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* Control */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Control</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Access your agent&apos;s built-in management dashboard.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Control UI
        </Button>
      </div>

      <Separator className="bg-gray-100" />

      {/* Maintenance */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Maintenance</h3>
          <p className="text-sm text-gray-500 mt-0.5">Debug and manage this agent instance.</p>
        </div>

        {/* Run Heartbeat */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Run Heartbeat</p>
            <p className="text-sm text-gray-500">Trigger one immediate heartbeat cycle.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRunHeartbeat}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Once
          </Button>
        </div>

        {/* Add Fix Prompt */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Add Fix Prompt</p>
            <p className="text-sm text-gray-500">Supply a human hint, config fix, or debug assist.</p>
          </div>
        </div>
        <Input
          value={fixPrompt}
          onChange={(e) => setFixPrompt(e.target.value)}
          placeholder="Enter a fix prompt..."
          className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
        />

        {/* Restart Agent */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Restart Agent</p>
            <p className="text-sm text-gray-500">Restart the gateway process, derive sessions and re-initiate connections.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Restart
          </Button>
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-700">Delete Agent</h3>
            <p className="text-sm text-red-600/70 mt-0.5">
              Permanently delete this agent and all data.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Small sparkle icon for model selector */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
