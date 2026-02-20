'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Channel } from './ChannelsTab'

interface AddChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (channel: any) => void
  editingChannel?: Channel | null
}

export function AddChannelModal({ isOpen, onClose, onSave, editingChannel }: AddChannelModalProps) {
  const [channelType, setChannelType] = useState<Channel['type']>('slack')
  const [channelName, setChannelName] = useState('')
  const [config, setConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingChannel) {
      setChannelType(editingChannel.type)
      setChannelName(editingChannel.name)
      setConfig(editingChannel.config)
    } else {
      setChannelType('slack')
      setChannelName('')
      setConfig({})
    }
  }, [editingChannel, isOpen])

  const getConfigFields = () => {
    switch (channelType) {
      case 'slack':
        return [
          { key: 'workspaceUrl', label: 'Workspace URL', placeholder: 'yourworkspace.slack.com' },
          { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...' },
          { key: 'channelId', label: 'Channel ID', placeholder: 'C1234567890' }
        ]
      case 'discord':
        return [
          { key: 'serverId', label: 'Server ID', placeholder: 'Server ID' },
          { key: 'botToken', label: 'Bot Token', placeholder: 'Your bot token' },
          { key: 'channelId', label: 'Channel ID', placeholder: 'Channel ID' }
        ]
      case 'whatsapp':
        return [
          { key: 'phoneNumber', label: 'Phone Number', placeholder: '+1234567890' },
          { key: 'apiKey', label: 'API Key', placeholder: 'Your API key' }
        ]
      case 'teams':
        return [
          { key: 'tenantId', label: 'Tenant ID', placeholder: 'Tenant ID' },
          { key: 'appId', label: 'App ID', placeholder: 'Application ID' },
          { key: 'appSecret', label: 'App Secret', placeholder: 'Application secret' },
          { key: 'channelId', label: 'Channel ID', placeholder: 'Channel ID' }
        ]
      case 'telegram':
        return [
          { key: 'botToken', label: 'Bot Token', placeholder: 'Your bot token' },
          { key: 'chatId', label: 'Chat ID', placeholder: 'Chat/Group ID' }
        ]
      default:
        return []
    }
  }

  const isFormValid = () => {
    if (!channelName.trim()) return false
    const fields = getConfigFields()
    return fields.every(field => config[field.key]?.trim())
  }

  const handleSave = () => {
    const channelData = {
      type: channelType,
      name: channelName,
      config
    }

    if (editingChannel) {
      onSave({ ...editingChannel, ...channelData })
    } else {
      onSave(channelData)
    }
  }

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingChannel ? 'Configure Channel' : 'Add Channel'}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="channel-type">Channel Type</Label>
          <select
            id="channel-type"
            value={channelType}
            onChange={(e) => setChannelType(e.target.value as Channel['type'])}
            disabled={!!editingChannel}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="teams">Microsoft Teams</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>

        <div>
          <Label htmlFor="channel-name">Channel Name</Label>
          <Input
            id="channel-name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="e.g., Engineering Team"
          />
        </div>

        {getConfigFields().map(field => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={config[field.key] || ''}
              onChange={(e) => handleConfigChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              type={field.label.toLowerCase().includes('token') || field.label.toLowerCase().includes('secret') ? 'password' : 'text'}
            />
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
