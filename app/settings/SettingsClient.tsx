'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Server,
  Bot,
  Radio,
  Lock,
  ArrowUpRight,
  CheckCircle2,
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
import ComingSoonModal from '@/components/openclaw/ComingSoonModal';
// Static provider list — these are well-known LLM providers, not dynamic backend data
import { MOCK_API_KEY_PROVIDERS, MOCK_CHANNELS } from '@/lib/openclaw-mock-data';
import { fadeUp, MODEL_OPTIONS } from '@/lib/openclaw-utils';
import { useSettings, useUpdateSettings } from '@/hooks/useAuditLog';
import type { GatewayBindMode, OpenClawSettings } from '@/types/openclaw';

const BIND_MODE_OPTIONS: { value: GatewayBindMode; label: string }[] = [
  { value: 'localhost', label: 'Localhost only' },
  { value: 'lan', label: 'LAN' },
  { value: 'public', label: 'Public' },
];

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

  // Neither 2FA enrollment nor session management is built yet — surface an
  // honest "Coming Soon" modal (same pattern used for Microsoft Teams on
  // /channels and Gmail/LinkedIn on /integrations) instead of a silent no-op.
  const [securityComingSoon, setSecurityComingSoon] = useState<
    'Two-factor authentication' | 'Active sessions' | null
  >(null);

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

  // Gateway configuration, agent defaults, channel summary, and tool
  // permissions — currently backed by lib/audit-log-service.ts mock data.
  // TODO: Replace with real openclaw-gateway config API once available.
  const { data: openClawSettings, isLoading: isSettingsLoading } = useSettings();
  const updateOpenClawSettings = useUpdateSettings();
  const [gatewayForm, setGatewayForm] = useState<OpenClawSettings | null>(null);
  const [showGatewaySaved, setShowGatewaySaved] = useState(false);

  useEffect(() => {
    if (openClawSettings && !gatewayForm) {
      setGatewayForm(openClawSettings);
    }
  }, [openClawSettings, gatewayForm]);

  const handleSaveGatewaySettings = async () => {
    if (!gatewayForm) return;
    await updateOpenClawSettings.mutateAsync({
      gateway: gatewayForm.gateway,
      agentDefaults: gatewayForm.agentDefaults,
      toolPermissions: gatewayForm.toolPermissions,
    });
    setShowGatewaySaved(true);
    setTimeout(() => setShowGatewaySaved(false), 3000);
  };

  const connectedChannelCount = MOCK_CHANNELS.filter((c) => c.connected).length;

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
            onClick={() => setSecurityComingSoon('Two-factor authentication')}
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
            onClick={() => setSecurityComingSoon('Active sessions')}
            className="border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            View Sessions
          </Button>
        </div>
      </motion.div>

      {/* Security features coming soon modal (2FA enrollment, session management) */}
      <ComingSoonModal
        open={securityComingSoon !== null}
        onOpenChange={(open) => !open && setSecurityComingSoon(null)}
        channelName={securityComingSoon ?? ''}
      />

      {/* Gateway Configuration */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Gateway</h2>
          </div>
          {showGatewaySaved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Saved
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Configure the openclaw-gateway process that agents connect through.
        </p>

        {isSettingsLoading || !gatewayForm ? (
          <p className="text-sm text-gray-500">Loading gateway settings&hellip;</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="gateway-port"
                  className="text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Port
                </Label>
                <Input
                  id="gateway-port"
                  type="number"
                  value={gatewayForm.gateway.port}
                  onChange={(e) =>
                    setGatewayForm({
                      ...gatewayForm,
                      gateway: { ...gatewayForm.gateway, port: Number(e.target.value) },
                    })
                  }
                  className="bg-white border-gray-200 text-gray-900 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Bind mode
                </Label>
                <Select
                  value={gatewayForm.gateway.bindMode}
                  onValueChange={(v) =>
                    setGatewayForm({
                      ...gatewayForm,
                      gateway: { ...gatewayForm.gateway, bindMode: v as GatewayBindMode },
                    })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {BIND_MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-gray-900 text-sm">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Require authentication</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Require an auth token for all incoming gateway connections.
                </p>
              </div>
              <Switch
                checked={gatewayForm.gateway.authEnabled}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    gateway: { ...gatewayForm.gateway, authEnabled: checked },
                  })
                }
                aria-label="Require authentication"
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Agent Defaults */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Agent Defaults</h2>
        </div>
        <p className="text-sm text-gray-500">
          Defaults applied when a new agent is created.
        </p>

        {isSettingsLoading || !gatewayForm ? (
          <p className="text-sm text-gray-500">Loading agent defaults&hellip;</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Default model
              </Label>
              <Select
                value={gatewayForm.agentDefaults.defaultModel}
                onValueChange={(v) =>
                  setGatewayForm({
                    ...gatewayForm,
                    agentDefaults: { ...gatewayForm.agentDefaults, defaultModel: v },
                  })
                }
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-10 text-sm">
                  <SelectValue />
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

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Sandbox by default</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  New agents run in an isolated sandbox unless disabled.
                </p>
              </div>
              <Switch
                checked={gatewayForm.agentDefaults.sandboxEnabled}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    agentDefaults: { ...gatewayForm.agentDefaults, sandboxEnabled: checked },
                  })
                }
                aria-label="Sandbox by default"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Context compaction</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automatically compact long conversation history to save tokens.
                </p>
              </div>
              <Switch
                checked={gatewayForm.agentDefaults.compactionEnabled}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    agentDefaults: { ...gatewayForm.agentDefaults, compactionEnabled: checked },
                  })
                }
                aria-label="Context compaction"
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Channel Configuration */}
      <motion.div
        custom={7}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Channels</h2>
          </div>
          <Link
            href="/channels"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-700"
          >
            Manage channels
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          {connectedChannelCount} of {MOCK_CHANNELS.length} channels connected.
        </p>
        <ul className="divide-y divide-gray-100">
          {MOCK_CHANNELS.map((channel) => (
            <li key={channel.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-700">{channel.name}</span>
              <span className={channel.connected ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                {channel.connected ? 'Connected' : 'Not connected'}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Tool Permissions */}
      <motion.div
        custom={8}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Tool Permissions</h2>
          </div>
          <Button onClick={handleSaveGatewaySettings} disabled={updateOpenClawSettings.isPending || !gatewayForm}>
            {updateOpenClawSettings.isPending ? 'Saving...' : 'Save gateway settings'}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Controls what agents are permitted to do on the host running the gateway.
        </p>

        {isSettingsLoading || !gatewayForm ? (
          <p className="text-sm text-gray-500">Loading tool permissions&hellip;</p>
        ) : (
          <>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">File access</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Allow agents to read and write files on the host filesystem.
                </p>
              </div>
              <Switch
                checked={gatewayForm.toolPermissions.fileAccess}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    toolPermissions: { ...gatewayForm.toolPermissions, fileAccess: checked },
                  })
                }
                aria-label="File access"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Network access</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Allow agents to make outbound network requests.
                </p>
              </div>
              <Switch
                checked={gatewayForm.toolPermissions.networkAccess}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    toolPermissions: { ...gatewayForm.toolPermissions, networkAccess: checked },
                  })
                }
                aria-label="Network access"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Shell execution</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Allow agents to execute arbitrary shell commands.
                </p>
              </div>
              <Switch
                checked={gatewayForm.toolPermissions.shellExecution}
                onCheckedChange={(checked) =>
                  setGatewayForm({
                    ...gatewayForm,
                    toolPermissions: { ...gatewayForm.toolPermissions, shellExecution: checked },
                  })
                }
                aria-label="Shell execution"
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        custom={9}
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
