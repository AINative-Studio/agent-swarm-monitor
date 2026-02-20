'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Channel } from './ChannelsTab'
import { MessageSquare, Settings, X } from 'lucide-react'

interface ChannelCardProps {
  channel: Channel
  onToggle: (channelId: string, newState: boolean) => void
  onConfigure: (channel: Channel) => void
  onDisconnect: (channelId: string) => void
}

const channelIcons: Record<Channel['type'], string> = {
  slack: '💬',
  discord: '🎮',
  whatsapp: '💚',
  teams: '📋',
  telegram: '✈️'
}

export function ChannelCard({ channel, onToggle, onConfigure, onDisconnect }: ChannelCardProps) {
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl" data-icon>
            {channelIcons[channel.type]}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{channel.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{channel.type}</p>
          </div>
        </div>
        <Badge variant={channel.isActive ? 'default' : 'secondary'}>
          {channel.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {channel.lastMessageAt && (
        <div className="text-xs text-gray-500 mb-3">
          Last message: {formatTimestamp(channel.lastMessageAt)}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Enabled</span>
          <label className="relative inline-block w-11 h-6">
            <input
              type="checkbox"
              role="switch"
              checked={channel.isActive}
              onChange={(e) => onToggle(channel.id, e.target.checked)}
              className="sr-only peer"
              aria-label={`Toggle ${channel.name}`}
            />
            <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors peer-focus:ring-2 peer-focus:ring-blue-300">
              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigure(channel)}
            aria-label="Configure channel"
          >
            <Settings className="w-4 h-4" />
            Configure
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect(channel.id)}
            aria-label="Disconnect channel"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  )
}
