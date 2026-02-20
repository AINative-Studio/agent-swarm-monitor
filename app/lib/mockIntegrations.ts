export type IntegrationType = 'slack' | 'discord' | 'whatsapp' | 'teams' | 'telegram';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  icon: string;
  description: string;
  isConnected: boolean;
  config?: {
    workspaceUrl?: string;
    botToken?: string;
    signingSecret?: string;
    serverId?: string;
    phoneNumber?: string;
    apiKey?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  };
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}

export const availableIntegrations: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    type: 'slack',
    icon: '/integrations/slack.svg',
    description: 'Connect agents to your Slack workspace channels',
    isConnected: true,
    config: {
      workspaceUrl: 'ainative.slack.com',
      botToken: 'xoxb-***-***',
      signingSecret: '***'
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    type: 'discord',
    icon: '/integrations/discord.svg',
    description: 'Deploy agents to Discord servers',
    isConnected: false
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    type: 'whatsapp',
    icon: '/integrations/whatsapp.svg',
    description: 'Enable agents on WhatsApp Business',
    isConnected: false
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    type: 'teams',
    icon: '/integrations/teams.svg',
    description: 'Integrate agents with Microsoft Teams',
    isConnected: true,
    config: {
      tenantId: 'tenant-***',
      clientId: 'client-***',
      clientSecret: '***'
    }
  },
  {
    id: 'telegram',
    name: 'Telegram',
    type: 'telegram',
    icon: '/integrations/telegram.svg',
    description: 'Deploy agents as Telegram bots',
    isConnected: false
  }
];

export const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production Key',
    key: 'ak_prod_1234567890abcdef',
    createdAt: new Date('2025-02-01'),
    lastUsedAt: new Date('2025-02-17T09:00:00'),
    expiresAt: null
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'ak_dev_9876543210fedcba',
    createdAt: new Date('2025-01-15'),
    lastUsedAt: new Date('2025-02-16T15:30:00'),
    expiresAt: new Date('2025-03-15')
  },
  {
    id: '3',
    name: 'Testing Key',
    key: 'ak_test_abcdef1234567890',
    createdAt: new Date('2025-02-10'),
    lastUsedAt: null,
    expiresAt: new Date('2025-02-28')
  }
];

// Utility function to mask API keys
export function maskAPIKey(key: string): string {
  if (key.length <= 10) return key;
  const prefix = key.substring(0, 3);
  const suffix = key.substring(key.length - 6);
  return `${prefix}...${suffix}`;
}

// Utility function to generate API key
export function generateAPIKey(): string {
  const prefix = 'ak_prod_';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
