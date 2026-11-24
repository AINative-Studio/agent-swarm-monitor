'use client';

import { useState } from 'react';
import { useAgentChannels, type AgentChannelId } from '@/hooks/useAgentChannels';
import ChannelRow from './ChannelRow';
import WhatsAppConnectionModal from './WhatsAppConnectionModal';
import TokenConnectionModal from './TokenConnectionModal';
import ComingSoonModal from './ComingSoonModal';
import DisconnectChannelDialog from './DisconnectChannelDialog';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/types/openclaw';

type ModalState = { type: AgentChannelId; channelName: string } | null;

/**
 * Agent detail page's Channels tab.
 *
 * Shares the exact same per-agent `configuration.channels` data source (via
 * useAgentChannels) as the standalone /channels page, so a channel connected on
 * either surface shows as connected on both -- see issue #139. This previously
 * called a separate "global" OpenClaw channel API with its own channel catalog,
 * which was never in sync with /channels and, in practice, hung indefinitely on
 * every load in this environment.
 */
export default function AgentChannelsTab({ agentId }: { agentId?: string }) {
  const { channels, isError, refetch, connectWhatsApp, connectWithToken, disconnect } =
    useAgentChannels(agentId);

  const [connectionModal, setConnectionModal] = useState<ModalState>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<ModalState>(null);

  const handleConnect = (channel: Channel) => {
    if (channel.connected) {
      setDisconnectDialog({ type: channel.id as AgentChannelId, channelName: channel.name });
    } else {
      setConnectionModal({ type: channel.id as AgentChannelId, channelName: channel.name });
    }
  };

  const handleWhatsAppConnect = async (data: { phoneNumber: string }) => {
    await connectWhatsApp(data);
    setConnectionModal(null);
  };

  const handleTokenConnect = async (
    channelId: 'telegram' | 'discord' | 'slack',
    data: { botToken: string; botUsername?: string }
  ) => {
    await connectWithToken(channelId, data);
    setConnectionModal(null);
  };

  const handleDisconnect = async () => {
    if (!disconnectDialog) return;
    await disconnect(disconnectDialog.type, disconnectDialog.channelName);
    setDisconnectDialog(null);
  };

  if (isError) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Channels</h3>
          <p className="text-sm text-gray-500 mt-0.5">Connect messaging platforms</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">Couldn&apos;t load this agent&apos;s channels.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
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
            Connect messaging platforms for this agent
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-4">
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            onConnect={() => handleConnect(channel)}
          />
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          Channels connected here are scoped to this agent. Manage them from this
          tab or from the main Channels page — both stay in sync.
        </p>
      </div>

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
