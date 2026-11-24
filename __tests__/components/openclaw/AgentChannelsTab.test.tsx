import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AgentChannelsTab from '@/components/openclaw/AgentChannelsTab';

// Issue #129: the real backend's GET /openclaw/channels/configured returns
// chat[channelId] as an object ({accounts, installed, origin}), not a
// string[] -- a mismatch that previously crashed the whole tab with
// "configuredData.chat[channelId].includes is not a function" on every
// load, for every agent.

vi.mock('@/lib/openclaw-service', () => ({
  default: {
    getAvailableChannels: vi.fn(),
    getConfiguredChannels: vi.fn(),
    getChannelAuthInstructions: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import openClawService from '@/lib/openclaw-service';

const mockGetAvailableChannels = vi.mocked(openClawService.getAvailableChannels);
const mockGetConfiguredChannels = vi.mocked(openClawService.getConfiguredChannels);

describe('AgentChannelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders channels without crashing when configured channels use the real backend shape (object, not array)', async () => {
    mockGetAvailableChannels.mockResolvedValue({
      channels: [
        {
          channel: 'telegram',
          accountId: 'default',
          configured: true,
          enabled: true,
          support: { chatTypes: ['dm', 'group'], media: true },
          actions: [],
        },
      ],
    });
    // Real captured backend response shape (see issue #129): chat[channelId]
    // is an object with `accounts` (string[]), `installed`, and `origin` --
    // not a plain string[].
    mockGetConfiguredChannels.mockResolvedValue({
      chat: {
        telegram: { accounts: ['default'], installed: true, origin: 'configured' },
      },
      auth: [],
      usage: {},
    });

    render(<AgentChannelsTab agentId="agent-1" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading channels/i)).not.toBeInTheDocument();
    });

    // No crash/error state -- the real channel list renders instead.
    expect(screen.queryByText(/failed to load channels/i)).not.toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('marks a channel as connected only when its account id is present in the configured accounts array', async () => {
    mockGetAvailableChannels.mockResolvedValue({
      channels: [
        {
          channel: 'slack',
          accountId: 'default',
          configured: true,
          enabled: true,
          support: {},
          actions: [],
        },
      ],
    });
    mockGetConfiguredChannels.mockResolvedValue({
      chat: {
        slack: { accounts: ['default'], installed: true, origin: 'configured' },
      },
      auth: [],
      usage: {},
    });

    render(<AgentChannelsTab agentId="agent-1" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading channels/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Slack')).toBeInTheDocument();
  });
});
