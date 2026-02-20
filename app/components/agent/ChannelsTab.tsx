'use client'

import { useState } from 'react'
import { ChannelCard } from './ChannelCard'
import { AddChannelModal } from './AddChannelModal'
import { Button } from '@/components/ui/button'

export interface Channel {
  id: string
  type: 'slack' | 'discord' | 'whatsapp' | 'teams' | 'telegram'
  name: string
  isActive: boolean
  config: Record<string, any>
  lastMessageAt?: Date
}

interface ChannelsTabProps {
  agentId: string
}

export function ChannelsTab({ agentId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)

  const handleToggle = (channelId: string, newState: boolean) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId ? { ...ch, isActive: newState } : ch
      )
    )
  }

  const handleConfigure = (channel: Channel) => {
    setEditingChannel(channel)
    setIsModalOpen(true)
  }

  const handleDisconnect = (channelId: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId))
  }

  const handleAddChannel = (newChannel: Omit<Channel, 'id' | 'isActive'>) => {
    const channel: Channel = {
      ...newChannel,
      id: crypto.randomUUID(),
      isActive: true
    }
    setChannels(prev => [...prev, channel])
    setIsModalOpen(false)
    setEditingChannel(null)
  }

  const handleUpdateChannel = (updatedChannel: Channel) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === updatedChannel.id ? updatedChannel : ch
      )
    )
    setIsModalOpen(false)
    setEditingChannel(null)
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No channels connected
          </h3>
          <p className="text-sm text-gray-500">
            Connect your agent to communication channels to enable direct interactions.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Channel
        </Button>
        <AddChannelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddChannel}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Connected Channels</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map(channel => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onToggle={handleToggle}
            onConfigure={handleConfigure}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      <AddChannelModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingChannel(null)
        }}
        onSave={editingChannel ? handleUpdateChannel : handleAddChannel}
        editingChannel={editingChannel}
      />
    </div>
  )
}
