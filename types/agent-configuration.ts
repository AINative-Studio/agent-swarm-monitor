// Integration types
export interface GmailIntegration {
  enabled: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
}

export interface LinkedInIntegration {
  enabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
}

// API Key types
export interface ApiKeyConfig {
  key: string;
  masked: string;
  addedAt?: string;
}

// Channel types
export interface SlackChannel {
  enabled: boolean;
  botToken?: string;
  workspaceId?: string;
  workspaceName?: string;
  socketMode?: boolean;
}

export interface TelegramChannel {
  enabled: boolean;
  botToken?: string;
  username?: string;
}

export interface WhatsAppChannel {
  enabled: boolean;
  sessionData?: string; // QR code session
  phoneNumber?: string;
}

export interface DiscordChannel {
  enabled: boolean;
  botToken?: string;
  guildIds?: string[];
}

export interface MicrosoftTeamsChannel {
  enabled: boolean;
  appId?: string;
  appPassword?: string;
  tenantId?: string;
}

// Active Hours types
export interface TimeRange {
  start: string; // HH:mm format
  end: string;
}

export interface ActiveHoursSchedule {
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

export interface ActiveHours {
  enabled: boolean;
  timezone: string;
  schedule: ActiveHoursSchedule;
}

// Fix Prompt types
export interface FixPrompt {
  timestamp: string;
  prompt: string;
  resolved: boolean;
  resolvedAt?: string;
}

// Main Configuration Interface
export interface AgentConfiguration {
  integrations?: {
    gmail?: GmailIntegration;
    linkedin?: LinkedInIntegration;
  };

  apiKeys?: {
    anthropic?: ApiKeyConfig;
    googleAi?: ApiKeyConfig;
    mistral?: ApiKeyConfig;
    veniceAi?: ApiKeyConfig;
    minimax?: ApiKeyConfig;
    openai?: ApiKeyConfig;
    openrouter?: ApiKeyConfig;
    groq?: ApiKeyConfig;
    moonshotAi?: ApiKeyConfig;
    twoAi?: ApiKeyConfig;
    cerebras?: ApiKeyConfig;
  };

  channels?: {
    slack?: SlackChannel;
    telegram?: TelegramChannel;
    whatsapp?: WhatsAppChannel;
    discord?: DiscordChannel;
    microsoftTeams?: MicrosoftTeamsChannel;
  };

  activeHours?: ActiveHours;

  fixPrompts?: FixPrompt[];
}

// Utility type for partial updates
export type AgentConfigurationUpdate = Partial<AgentConfiguration>;

// Helper functions
export function getDefaultConfiguration(): AgentConfiguration {
  return {};
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 7) return '***';
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}
