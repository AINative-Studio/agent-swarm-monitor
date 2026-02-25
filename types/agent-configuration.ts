/**
 * Agent Configuration Types
 *
 * These types define the structure of agent.configuration field
 * which stores various settings including integrations, active hours, etc.
 */

export interface GmailIntegration {
  enabled: boolean;
  email?: string;
  lastSyncedAt?: string;
}

export interface LinkedInIntegration {
  enabled: boolean;
  username?: string;
  lastSyncedAt?: string;
}

export interface WhatsAppChannel {
  enabled: boolean;
  phoneNumber?: string;
  connectedAt?: string;
}

export interface TelegramChannel {
  enabled: boolean;
  botToken?: string;
  botUsername?: string;
  connectedAt?: string;
}

export interface SlackChannel {
  enabled: boolean;
  botToken?: string;
  workspace?: string;
  connectedAt?: string;
}

export interface DiscordChannel {
  enabled: boolean;
  botToken?: string;
  botUsername?: string;
  connectedAt?: string;
}

export interface MicrosoftTeamsChannel {
  enabled: boolean;
  appId?: string;
  connectedAt?: string;
}

export interface AgentChannels {
  whatsapp?: WhatsAppChannel;
  telegram?: TelegramChannel;
  slack?: SlackChannel;
  discord?: DiscordChannel;
  'microsoft-teams'?: MicrosoftTeamsChannel;
}

export interface AgentIntegrations {
  gmail?: GmailIntegration;
  linkedin?: LinkedInIntegration;
}

export interface DaySchedule {
  enabled: boolean;
  startTime: string; // HH:mm format (24-hour)
  endTime: string;   // HH:mm format (24-hour)
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ActiveHours {
  enabled: boolean;
  schedule: Partial<Record<DayOfWeek, DaySchedule>>;
  timezone: string;
}

// Helper constants
export const DEFAULT_ACTIVE_HOURS: ActiveHours = {
  enabled: false,
  timezone: 'America/New_York',
  schedule: {},
};

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export interface ApiKeyConfig {
  key: string;
  masked: string;
  addedAt: string;
}

export interface ApiKeyProviderConfig {
  [provider: string]: ApiKeyConfig;
}

export interface AgentConfiguration {
  integrations?: AgentIntegrations;
  channels?: AgentChannels;
  activeHours?: ActiveHours;
  apiKeys?: ApiKeyProviderConfig;
  [key: string]: unknown; // Allow other configuration fields
}

/**
 * List of supported API key providers
 */
export const API_KEY_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google-ai', name: 'Google AI' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'venice-ai', name: 'Venice AI' },
  { id: 'minimax', name: 'MiniMax' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'groq', name: 'Groq' },
  { id: 'moonshot-ai', name: 'Moonshot AI' },
  { id: '2-ai', name: '2.AI' },
  { id: 'cerebras', name: 'Cerebras' },
] as const;

export type ApiKeyProviderId = typeof API_KEY_PROVIDERS[number]['id'];
