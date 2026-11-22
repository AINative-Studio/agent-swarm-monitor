import type { Channel } from '@/types/openclaw';
import apiClient from './api-client';

export interface ChannelListResponse {
  channels: Array<{
    id: string;
    name: string;
    enabled: boolean;
    available: boolean;
    config: Record<string, unknown>;
  }>;
}

class ChannelService {
  private basePath = '/channels';

  async listChannels(): Promise<Channel[]> {
    const response = await apiClient.get<ChannelListResponse>(this.basePath);

    // Transform backend response to match frontend Channel type
    return response.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      icon: channel.id, // Use channel ID as icon identifier
      description: this.getChannelDescription(channel.id),
      connected: channel.enabled,
      connectionDetails: channel.enabled ? this.getConnectionDetails(channel.config) : undefined,
    }));
  }

  private getChannelDescription(channelId: string): string {
    const descriptions: Record<string, string> = {
      whatsapp: 'Connect to WhatsApp by scanning a QR code.',
      telegram: 'Connect a Telegram bot. Fastest to set up — just a bot token from @BotFather.',
      discord: 'Connect a Discord bot to servers, channels, and DMs.',
      slack: 'Connect to Slack workspaces via Socket Mode or HTTP Events API.',
      email: 'Connect email accounts via SMTP/IMAP for agent communication.',
      sms: 'Connect SMS gateway (Twilio, Vonage) for text message interactions.',
      teams: 'Connect to Microsoft Teams via the Bot Framework (plugin-based channel).',
    };
    return descriptions[channelId] || 'Connect this channel to communicate with your agents.';
  }

  private getConnectionDetails(config: Record<string, unknown>): {
    workspace?: string;
    username?: string;
    phoneNumber?: string;
    connectedAt?: string;
  } | undefined {
    if (!config || Object.keys(config).length === 0) return undefined;

    return {
      workspace: config.workspace as string | undefined,
      username: config.username as string | undefined,
      phoneNumber: config.phoneNumber as string | undefined,
      connectedAt: config.connectedAt as string | undefined,
    };
  }
}

const channelService = new ChannelService();
export default channelService;
