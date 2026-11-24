import { useMemo } from 'react';
import { useAgent, useUpdateAgentSettings } from '@/hooks/useOpenClawAgents';
import { useToast } from '@/hooks/use-toast';
import type { Channel, ChannelConfiguration } from '@/types/openclaw';

/**
 * Single source of truth for an agent's connected messaging channels.
 *
 * Channel connection state lives on `agent.configuration.channels`, written via
 * `PATCH /api/v1/agents/{agentId}/settings` (useUpdateAgentSettings). This hook is
 * shared by the standalone /channels page and the agent detail page's Channels tab
 * so both surfaces read and write the exact same per-agent data -- see issue #139.
 */
export const AVAILABLE_CHANNELS = [
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

export type AgentChannelId = typeof AVAILABLE_CHANNELS[number]['id'];

export function useAgentChannels(agentId: string | undefined) {
  const { data: agent, isError, error, refetch } = useAgent(agentId);
  const { toast } = useToast();
  const updateSettings = useUpdateAgentSettings(agentId || '');

  const channelConfig = useMemo(() => {
    if (!agent?.configuration) return {} as ChannelConfiguration;
    return (agent.configuration.channels || {}) as ChannelConfiguration;
  }, [agent]);

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

  const connectWhatsApp = async (data: { phoneNumber: string }) => {
    if (!agent) return;
    try {
      const updatedConfig = {
        ...agent.configuration,
        channels: {
          ...(agent.configuration?.channels || {}),
          whatsapp: {
            enabled: true,
            phoneNumber: data.phoneNumber,
            connectedAt: new Date().toISOString(),
          },
        },
      };

      await updateSettings.mutateAsync({ configuration: updatedConfig });

      toast({
        title: 'WhatsApp Connected',
        description: 'WhatsApp channel has been successfully connected.',
      });
    } catch (err) {
      console.error('Error saving WhatsApp config:', err);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect WhatsApp channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const connectWithToken = async (
    channelId: 'telegram' | 'discord' | 'slack',
    data: { botToken: string; botUsername?: string }
  ) => {
    if (!agent) return;
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
        ...agent.configuration,
        channels: {
          ...(agent.configuration?.channels || {}),
          [channelId]: channelData,
        },
      };

      await updateSettings.mutateAsync({ configuration: updatedConfig });

      const channelName = channelId.charAt(0).toUpperCase() + channelId.slice(1);
      toast({
        title: `${channelName} Connected`,
        description: `${channelName} channel has been successfully connected.`,
      });
    } catch (err) {
      console.error(`Error saving ${channelId} config:`, err);
      const channelName = channelId.charAt(0).toUpperCase() + channelId.slice(1);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect ${channelName} channel. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const disconnect = async (channelId: AgentChannelId, channelName: string) => {
    if (!agent) return;
    try {
      const updatedConfig = {
        ...agent.configuration,
        channels: {
          ...(agent.configuration?.channels || {}),
          [channelId]: { enabled: false },
        },
      };

      await updateSettings.mutateAsync({ configuration: updatedConfig });

      toast({
        title: 'Channel Disconnected',
        description: `${channelName} has been disconnected.`,
      });
    } catch (err) {
      console.error('Error disconnecting channel:', err);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    agent,
    channels,
    isError,
    error,
    refetch,
    connectWhatsApp,
    connectWithToken,
    disconnect,
    isMutating: updateSettings.isPending,
  };
}
