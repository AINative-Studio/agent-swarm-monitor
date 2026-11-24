'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { useAgentChannels } from '@/hooks/useAgentChannels';
import { fadeUp } from '@/lib/openclaw-utils';
import AgentPicker from '@/components/openclaw/AgentPicker';
import ChannelRow from '@/components/openclaw/ChannelRow';
import ListErrorState from '@/components/openclaw/ListErrorState';
import WhatsAppConnectionModal from '@/components/openclaw/WhatsAppConnectionModal';
import TokenConnectionModal from '@/components/openclaw/TokenConnectionModal';
import ComingSoonModal from '@/components/openclaw/ComingSoonModal';
import DisconnectChannelDialog from '@/components/openclaw/DisconnectChannelDialog';
import type { Channel } from '@/types/openclaw';
import type { AgentChannelId } from '@/hooks/useAgentChannels';

type ModalState = { type: AgentChannelId; channelName: string } | null;

export default function OpenClawChannelsClient() {
  const { data, isError, error, refetch } = useAgentList();
  const agents = data?.agents ?? [];
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    agents[0]?.id
  );

  // Modal states
  const [connectionModal, setConnectionModal] = useState<ModalState>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<ModalState>(null);

  const { channels, connectWhatsApp, connectWithToken, disconnect } =
    useAgentChannels(selectedAgentId);

  // Update selection when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Handle connect button click
  const handleConnect = (channel: Channel) => {
    if (channel.connected) {
      // If already connected, show disconnect dialog
      setDisconnectDialog({ type: channel.id as AgentChannelId, channelName: channel.name });
    } else {
      // If not connected, show connection modal
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
        {isError ? (
          <ListErrorState
            error={error}
            message="Couldn't load agents."
            onRetry={() => refetch()}
          />
        ) : (
          <AgentPicker
            agents={agents}
            selectedId={selectedAgentId}
            onSelect={setSelectedAgentId}
          />
        )}
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
