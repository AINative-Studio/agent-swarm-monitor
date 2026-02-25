'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Key,
  Bell,
  Shield,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { MOCK_API_KEY_PROVIDERS } from '@/lib/openclaw-mock-data';
import { fadeUp } from '@/lib/openclaw-utils';

interface ApiKeyEntry {
  providerId: string;
  value: string;
  visible: boolean;
}

export default function SettingsClient() {
  const [workspaceName, setWorkspaceName] = useState('AINative Studio');
  const [workspaceSlug, setWorkspaceSlug] = useState('ainative-studio');
  const [defaultModel, setDefaultModel] = useState('anthropic/claude-opus-4-5');
  const [timezone, setTimezone] = useState('America/Los_Angeles');

  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [addingKey, setAddingKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [agentErrorAlerts, setAgentErrorAlerts] = useState(true);
  const [heartbeatFailAlerts, setHeartbeatFailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState(false);

  const handleAddKey = () => {
    if (!newKeyProvider || !newKeyValue.trim()) return;
    setApiKeys((prev) => [
      ...prev,
      { providerId: newKeyProvider, value: newKeyValue.trim(), visible: false },
    ]);
    setNewKeyProvider('');
    setNewKeyValue('');
    setAddingKey(false);
  };

  const handleRemoveKey = (idx: number) => {
    setApiKeys((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleKeyVisibility = (idx: number) => {
    setApiKeys((prev) =>
      prev.map((k, i) => (i === idx ? { ...k, visible: !k.visible } : k))
    );
  };

  const handleCopySlug = () => {
    navigator.clipboard.writeText(workspaceSlug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const configuredProviderIds = new Set(apiKeys.map((k) => k.providerId));
  const availableProviders = MOCK_API_KEY_PROVIDERS.filter(
    (p) => !configuredProviderIds.has(p.id)
  );

  const getProviderName = (id: string) =>
    MOCK_API_KEY_PROVIDERS.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage workspace settings, API keys, and preferences
        </p>
      </motion.div>

      {/* Workspace Profile */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Workspace</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="ws-name"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Workspace Name
            </Label>
            <Input
              id="ws-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="ws-slug"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Slug
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="ws-slug"
                value={workspaceSlug}
                onChange={(e) =>
                  setWorkspaceSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  )
                }
                className="bg-white border-gray-200 text-gray-900 h-10 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySlug}
                className="shrink-0 border-gray-200 bg-white hover:bg-gray-50 h-10 px-3"
              >
                {copiedSlug ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Default Model
            </Label>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="anthropic/claude-opus-4-5" className="text-gray-900 text-sm">
                  Claude Opus 4.5
                </SelectItem>
                <SelectItem value="anthropic/claude-sonnet-4" className="text-gray-900 text-sm">
                  Claude Sonnet 4
                </SelectItem>
                <SelectItem value="openai/gpt-4o" className="text-gray-900 text-sm">
                  GPT-4o
                </SelectItem>
                <SelectItem value="google/gemini-2.0-flash" className="text-gray-900 text-sm">
                  Gemini 2.0 Flash
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="America/Los_Angeles" className="text-gray-900 text-sm">
                  Pacific Time (PT)
                </SelectItem>
                <SelectItem value="America/Chicago" className="text-gray-900 text-sm">
                  Central Time (CT)
                </SelectItem>
                <SelectItem value="America/New_York" className="text-gray-900 text-sm">
                  Eastern Time (ET)
                </SelectItem>
                <SelectItem value="Europe/London" className="text-gray-900 text-sm">
                  GMT / London
                </SelectItem>
                <SelectItem value="Europe/Berlin" className="text-gray-900 text-sm">
                  CET / Berlin
                </SelectItem>
                <SelectItem value="Asia/Tokyo" className="text-gray-900 text-sm">
                  JST / Tokyo
                </SelectItem>
                <SelectItem value="UTC" className="text-gray-900 text-sm">
                  UTC
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6">
            Save Changes
          </Button>
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">API Keys</h2>
          </div>
          {!addingKey && availableProviders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingKey(true)}
              className="border-gray-200 bg-white hover:bg-gray-50 text-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Key
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-500">
          API keys are used by your agents to call LLM providers. Keys are
          encrypted at rest and never exposed in logs.
        </p>

        {apiKeys.length === 0 && !addingKey && (
          <div className="text-center py-8">
            <Key className="h-8 w-8 text-[#D4D2CD] mx-auto mb-3" />
            <p className="text-sm text-gray-500">No API keys configured yet</p>
            <p className="text-xs text-[#8C8C8C] mt-1">
              Add provider keys so agents can call LLM APIs
            </p>
          </div>
        )}

        {apiKeys.length > 0 && (
          <div className="divide-y divide-gray-100">
            {apiKeys.map((key, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {getProviderName(key.providerId)}
                  </p>
                  <p className="text-xs font-mono text-gray-500 mt-0.5 truncate">
                    {key.visible
                      ? key.value
                      : `${'*'.repeat(8)}...${key.value.slice(-4)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleKeyVisibility(idx)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                  aria-label={key.visible ? 'Hide key' : 'Show key'}
                >
                  {key.visible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveKey(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                  aria-label="Remove key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addingKey && (
          <>
            <Separator className="bg-gray-100" />
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Provider
                  </Label>
                  <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10 text-sm">
                      <SelectValue placeholder="Select provider..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {availableProviders.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="text-gray-900 text-sm"
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    API Key
                  </Label>
                  <Input
                    type="password"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="sk-..."
                    className="bg-white border-gray-200 text-gray-900 h-10 font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddKey();
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingKey(false);
                    setNewKeyProvider('');
                    setNewKeyValue('');
                  }}
                  className="border-gray-200 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddKey}
                  disabled={!newKeyProvider || !newKeyValue.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Save Key
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Notifications */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Email notifications
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Receive email updates for important workspace events
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              aria-label="Email notifications"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Agent error alerts
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Get notified when an agent encounters an error
              </p>
            </div>
            <Switch
              checked={agentErrorAlerts}
              onCheckedChange={setAgentErrorAlerts}
              aria-label="Agent error alerts"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Heartbeat failure alerts
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Alert when a heartbeat check fails or times out
              </p>
            </div>
            <Switch
              checked={heartbeatFailAlerts}
              onCheckedChange={setHeartbeatFailAlerts}
              aria-label="Heartbeat failure alerts"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Weekly digest
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Summary of agent activity sent every Monday
              </p>
            </div>
            <Switch
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
              aria-label="Weekly digest"
            />
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Two-factor authentication
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            Enable
          </Button>
        </div>

        <Separator className="bg-gray-100" />

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Active sessions</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage devices currently logged in to your account
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            View Sessions
          </Button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-red-200 bg-red-50/30 p-5 space-y-4"
      >
        <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-red-700">
              Delete workspace
            </p>
            <p className="text-sm text-red-600/70 mt-0.5">
              Permanently delete this workspace, all agents, and all data.
              This action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
