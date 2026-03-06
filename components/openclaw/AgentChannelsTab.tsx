'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ChannelRow from './ChannelRow';
import openClawService from '@/lib/openclaw-service';
import { useToast } from '@/hooks/use-toast';

interface ChannelCapability {
  channel: string;
  accountId: string;
  configured: boolean;
  enabled: boolean;
  support: {
    chatTypes?: string[];
    polls?: boolean;
    reactions?: boolean;
    media?: boolean;
    threads?: boolean;
    nativeCommands?: boolean;
  };
  actions: string[];
}

interface ConfiguredChannelsResponse {
  chat: Record<string, string[]>;
  auth: any[];
  usage: any;
}

interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  accountId?: string;
}

export default function AgentChannelsTab({ agentId }: { agentId?: string }) {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, [agentId]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get available channels (capabilities)
      const availableData = await openClawService.getAvailableChannels();
      const configuredData: ConfiguredChannelsResponse = await openClawService.getConfiguredChannels();

      // Map available channels to UI format
      const channelCapabilities: ChannelCapability[] = availableData.channels || [];

      const channelsMap: Record<string, Channel> = {};

      // Process each available channel
      channelCapabilities.forEach((cap) => {
        const channelId = cap.channel;
        const isConfigured = configuredData.chat[channelId]?.includes(cap.accountId || 'default') || false;

        // Map channel names to user-friendly display
        const displayNames: Record<string, string> = {
          whatsapp: 'WhatsApp',
          slack: 'Slack',
          telegram: 'Telegram',
          discord: 'Discord',
          signal: 'Signal',
          imessage: 'iMessage',
          msteams: 'Microsoft Teams',
          googlechat: 'Google Chat',
          matrix: 'Matrix',
          mattermost: 'Mattermost',
        };

        // Generate descriptions based on capabilities
        const features: string[] = [];
        if (cap.support.chatTypes?.length) {
          features.push(cap.support.chatTypes.join(', '));
        }
        if (cap.support.media) features.push('media');
        if (cap.support.reactions) features.push('reactions');
        if (cap.support.threads) features.push('threads');

        const description = features.length
          ? `Supports ${features.slice(0, 3).join(', ')}`
          : 'Messaging platform';

        channelsMap[channelId] = {
          id: channelId,
          name: displayNames[channelId] || channelId.charAt(0).toUpperCase() + channelId.slice(1),
          icon: channelId,
          description,
          connected: isConfigured,
          accountId: cap.accountId,
        };
      });

      // Add popular channels that might not be in capabilities yet
      const popularChannels = ['telegram', 'discord', 'signal', 'msteams'];
      popularChannels.forEach((channelId) => {
        if (!channelsMap[channelId]) {
          const displayNames: Record<string, string> = {
            telegram: 'Telegram',
            discord: 'Discord',
            signal: 'Signal',
            msteams: 'Microsoft Teams',
          };

          channelsMap[channelId] = {
            id: channelId,
            name: displayNames[channelId] || channelId,
            icon: channelId,
            description: 'Messaging platform',
            connected: false,
          };
        }
      });

      setChannels(Object.values(channelsMap));
    } catch (err: any) {
      console.error('Failed to load channels:', err);
      setError(err.message || 'Failed to load channels');
      toast({
        title: 'Failed to load channels',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelConnect = async (channel: Channel) => {
    try {
      if (channel.connected) {
        // Show manage/disconnect options
        toast({
          title: `Managing ${channel.name}`,
          description: 'Disconnect functionality coming soon'
        });
        return;
      }

      // Get authentication instructions
      const instructions = await openClawService.getChannelAuthInstructions(channel.id);

      // For now, show instructions in console and toast
      console.log(`[${channel.name}] Authentication instructions:`, instructions);

      if (instructions.auth_type === 'qr_code') {
        // WhatsApp QR code flow
        toast({
          title: `Opening QR code for ${channel.name}`,
          description: 'Scan the QR code with your phone'
        });
        const loginResult = await openClawService.loginChannel({
          channel: channel.id,
          verbose: true,
        });
        console.log('Login result:', loginResult);

        if (loginResult.success) {
          toast({
            title: `${channel.name} connected successfully!`
          });
          loadChannels(); // Reload to update status
        }
      } else if (instructions.auth_type === 'bot_token') {
        // Show token input dialog
        toast({
          title: `Connect ${channel.name}`,
          description: instructions.instructions.slice(0, 2).join('. ')
        });

        // TODO: Show modal with token input form
        // For now, just log instructions
        console.log(`${channel.name} setup instructions:`, instructions.instructions);
      } else if (instructions.auth_type === 'oauth') {
        // Slack OAuth flow
        toast({
          title: `Connect ${channel.name}`,
          description: instructions.instructions.slice(0, 2).join('. ')
        });
      } else {
        toast({
          title: `${channel.name} setup`,
          description: instructions.instructions.slice(0, 2).join('. ')
        });
      }
    } catch (err: any) {
      console.error(`Failed to connect ${channel.name}:`, err);
      toast({
        title: `Failed to connect ${channel.name}`,
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Channels</h3>
          <p className="text-sm text-gray-500 mt-0.5">Connect messaging platforms</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Loading channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Channels</h3>
          <p className="text-sm text-gray-500 mt-0.5">Connect messaging platforms</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadChannels}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Channels</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect messaging platforms for agent communication
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadChannels}
          className="text-gray-600"
        >
          Refresh
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No channels available</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white px-4">
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              onConnect={() => handleChannelConnect(channel)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 Channels are managed system-wide in OpenClaw. Connected channels can be used by all agents.
        </p>
      </div>
    </div>
  );
}
