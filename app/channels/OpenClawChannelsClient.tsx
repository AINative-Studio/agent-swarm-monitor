'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { useUpdateAgentSettings } from '@/hooks/useOpenClawAgents';
import { useToast } from '@/hooks/use-toast';
import { fadeUp } from '@/lib/openclaw-utils';
import AgentPicker from '@/components/openclaw/AgentPicker';
import ChannelRow from '@/components/openclaw/ChannelRow';
import WhatsAppConnectionModal from '@/components/openclaw/WhatsAppConnectionModal';
import TokenConnectionModal from '@/components/openclaw/TokenConnectionModal';
import ComingSoonModal from '@/components/openclaw/ComingSoonModal';
import DisconnectChannelDialog from '@/components/openclaw/DisconnectChannelDialog';
import type { Channel, ChannelConfiguration } from '@/types/openclaw';

// Define the static list of available channels
const AVAILABLE_CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    description: 'Connect to WhatsApp by scanning a QR code.',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    description: 'Connect a Telegram bot. Fastest to set up — just a bot token from @BotFather.',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    description: 'Connect to Slack workspaces via Socket Mode or HTTP Events API.',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'discord',
    description: 'Connect a Discord bot to servers, channels, and DMs.',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    icon: 'teams',
    description: 'Connect to Microsoft Teams via the Bot Framework (plugin-based channel).',
  },
] as const;

type ChannelId = typeof AVAILABLE_CHANNELS[number]['id'];
type ModalState = { type: ChannelId; channelName: string } | null;

export default function OpenClawChannelsClient() {
  const { data } = useAgentList();
  const agents = data?.agents ?? [];
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    agents[0]?.id
  );

  // Modal states
  const [connectionModal, setConnectionModal] = useState<ModalState>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<ModalState>(null);

  // Toast hook for notifications
  const { toast } = useToast();

  // Mutation for updating agent settings
  const updateSettings = useUpdateAgentSettings(selectedAgentId || '');

  // Get the selected agent
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  // Update selection when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Get channel configuration from selected agent
  const channelConfig = useMemo(() => {
    if (!selectedAgent?.configuration) return {};
    return (selectedAgent.configuration.channels || {}) as ChannelConfiguration;
  }, [selectedAgent]);

  // Generate channels list from static data + agent configuration
  const channels: Channel[] = useMemo(() => {
    return AVAILABLE_CHANNELS.map((channel) => {
      const config = channelConfig[channel.id as keyof ChannelConfiguration];
      const connected = config?.enabled || false;

      return {
        ...channel,
        connected,
        connectionDetails: connected
          ? {
              workspace: 'workspace' in (config || {}) ? (config as any).workspace : undefined,
              username: 'botUsername' in (config || {}) ? (config as any).botUsername : undefined,
              phoneNumber: 'phoneNumber' in (config || {}) ? (config as any).phoneNumber : undefined,
              connectedAt: config?.connectedAt,
            }
          : undefined,
      };
    });
  }, [channelConfig]);

  // Handle connect button click
  const handleConnect = (channel: Channel) => {
    console.log('[ChannelsClient] handleConnect called with channel:', channel);
    if (channel.connected) {
      console.log('[ChannelsClient] Channel already connected, showing disconnect dialog');
      // If already connected, show disconnect dialog
      setDisconnectDialog({ type: channel.id as ChannelId, channelName: channel.name });
    } else {
      console.log('[ChannelsClient] Channel not connected, showing connection modal');
      // If not connected, show connection modal
      setConnectionModal({ type: channel.id as ChannelId, channelName: channel.name });
    }
  };

  // Handle WhatsApp connection
  const handleWhatsAppConnect = async (data: { phoneNumber: string }) => {
    console.log('[ChannelsClient] handleWhatsAppConnect called with data:', data);
    if (!selectedAgent) {
      console.log('[ChannelsClient] No selected agent, aborting WhatsApp connection');
      return;
    }

    try {
      const updatedConfig = {
        ...selectedAgent.configuration,
        channels: {
          ...(selectedAgent.configuration?.channels || {}),
          whatsapp: {
            enabled: true,
            phoneNumber: data.phoneNumber,
            connectedAt: new Date().toISOString(),
          },
        },
      };

      console.log('[ChannelsClient] Saving WhatsApp config:', updatedConfig);
      await updateSettings.mutateAsync({
        configuration: updatedConfig,
      });
      console.log('[ChannelsClient] WhatsApp config saved successfully');

      toast({
        title: 'WhatsApp Connected',
        description: 'WhatsApp channel has been successfully connected.',
      });
    } catch (error) {
      console.error('[ChannelsClient] Error saving WhatsApp config:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect WhatsApp channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle token-based connection (Telegram, Discord, Slack)
  const handleTokenConnect = async (
    channelId: 'telegram' | 'discord' | 'slack',
    data: { botToken: string; botUsername?: string }
  ) => {
    console.log(`[ChannelsClient] handleTokenConnect called for ${channelId} with data:`, data);
    if (!selectedAgent) {
      console.log('[ChannelsClient] No selected agent, aborting token connection');
      return;
    }

    try {
      const channelData =
        channelId === 'slack'
          ? {
              enabled: true,
              botToken: data.botToken,
              workspace: data.botUsername,
              connectedAt: new Date().toISOString(),
            }
          : {
              enabled: true,
              botToken: data.botToken,
              botUsername: data.botUsername,
              connectedAt: new Date().toISOString(),
            };

      const updatedConfig = {
        ...selectedAgent.configuration,
        channels: {
          ...(selectedAgent.configuration?.channels || {}),
          [channelId]: channelData,
        },
      };

      console.log(`[ChannelsClient] Saving ${channelId} config:`, updatedConfig);
      await updateSettings.mutateAsync({
        configuration: updatedConfig,
      });
      console.log(`[ChannelsClient] ${channelId} config saved successfully`);

      const channelName = channelId.charAt(0).toUpperCase() + channelId.slice(1);
      toast({
        title: `${channelName} Connected`,
        description: `${channelName} channel has been successfully connected.`,
      });
    } catch (error) {
      console.error(`[ChannelsClient] Error saving ${channelId} config:`, error);
      const channelName = channelId.charAt(0).toUpperCase() + channelId.slice(1);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect ${channelName} channel. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!selectedAgent || !disconnectDialog) return;

    try {
      const channelId = disconnectDialog.type;
      const channelName = disconnectDialog.channelName;
      const updatedConfig = {
        ...selectedAgent.configuration,
        channels: {
          ...(selectedAgent.configuration?.channels || {}),
          [channelId]: {
            enabled: false,
          },
        },
      };

      await updateSettings.mutateAsync({
        configuration: updatedConfig,
      });

      toast({
        title: 'Channel Disconnected',
        description: `${channelName} has been disconnected.`,
      });

      setDisconnectDialog(null);
    } catch (error) {
      console.error('[ChannelsClient] Error disconnecting channel:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect messaging platforms to your agents
        </p>
      </motion.div>

      {/* Agent picker */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <AgentPicker
          agents={agents}
          selectedId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
      </motion.div>

      {/* Channels card */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Channels</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect messaging platforms
          </p>
        </div>

        <div className="px-5">
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              onConnect={() => handleConnect(channel)}
            />
          ))}
        </div>
      </motion.div>

      {/* WhatsApp Connection Modal */}
      <WhatsAppConnectionModal
        open={connectionModal?.type === 'whatsapp'}
        onOpenChange={(open) => !open && setConnectionModal(null)}
        onConnect={handleWhatsAppConnect}
      />

      {/* Telegram Connection Modal */}
      <TokenConnectionModal
        open={connectionModal?.type === 'telegram'}
        onOpenChange={(open) => !open && setConnectionModal(null)}
        onConnect={(data) => handleTokenConnect('telegram', data)}
        channelType="telegram"
        channelName="Telegram"
      />

      {/* Discord Connection Modal */}
      <TokenConnectionModal
        open={connectionModal?.type === 'discord'}
        onOpenChange={(open) => !open && setConnectionModal(null)}
        onConnect={(data) => handleTokenConnect('discord', data)}
        channelType="discord"
        channelName="Discord"
      />

      {/* Slack Connection Modal */}
      <TokenConnectionModal
        open={connectionModal?.type === 'slack'}
        onOpenChange={(open) => !open && setConnectionModal(null)}
        onConnect={(data) => handleTokenConnect('slack', data)}
        channelType="slack"
        channelName="Slack"
      />

      {/* Microsoft Teams Coming Soon Modal */}
      <ComingSoonModal
        open={connectionModal?.type === 'microsoft-teams'}
        onOpenChange={(open) => !open && setConnectionModal(null)}
        channelName="Microsoft Teams"
      />

      {/* Disconnect Confirmation Dialog */}
      {disconnectDialog && (
        <DisconnectChannelDialog
          open={true}
          onOpenChange={(open) => !open && setDisconnectDialog(null)}
          onConfirm={handleDisconnect}
          channelName={disconnectDialog.channelName}
        />
      )}
    </div>
  );
}
