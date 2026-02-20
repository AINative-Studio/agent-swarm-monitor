export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'Operations'
export type Model = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus'
export type AgentAvatar = 'Atlas' | 'Lyra' | 'Sage' | 'Vega' | 'Nova'

export interface BasicInfo {
  name: string
  description: string
  department: Department
  avatar?: AgentAvatar
}

export interface Configuration {
  model: Model
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export interface ChannelSelection {
  slack: boolean
  discord: boolean
  whatsapp: boolean
  teams: boolean
  telegram: boolean
}

export interface AgentFormData {
  basicInfo: BasicInfo
  configuration: Configuration
  channels: ChannelSelection
}

export interface CreatedAgent extends BasicInfo, Configuration {
  id: string
  channels: ChannelSelection
  createdAt: Date
}

export interface WizardStepProps {
  onNext?: () => void
  onBack?: () => void
}
