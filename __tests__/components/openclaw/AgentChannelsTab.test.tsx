import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgentChannelsTab from '@/components/openclaw/AgentChannelsTab';

// Issue #139: the agent detail page's Channels tab used to call a completely
// separate "global" OpenClaw channel API (getAvailableChannels/
// getConfiguredChannels) with its own channel catalog (no Slack/WhatsApp, had
// Signal), while the standalone /channels page read/wrote
// agent.configuration.channels via PATCH /agents/{id}/settings. The two
// surfaces never agreed on what was connected, and the global API hung
// indefinitely in live testing. The tab now shares useAgentChannels with
// /channels so both read/write the exact same per-agent data.

vi.mock('@/hooks/useAgentChannels', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useAgentChannels')>(
    '@/hooks/useAgentChannels'
  );
  return {
    ...actual,
    useAgentChannels: vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useAgentChannels, AVAILABLE_CHANNELS } from '@/hooks/useAgentChannels';

const mockUseAgentChannels = vi.mocked(useAgentChannels);

function buildChannels(connected: Partial<Record<string, boolean>>) {
  return AVAILABLE_CHANNELS.map((c) => ({
    ...c,
    connected: !!connected[c.id],
    connectionDetails: connected[c.id] ? { connectedAt: '2026-01-01T00:00:00Z' } : undefined,
  }));
}

describe('AgentChannelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the full shared channel catalog (including Slack and WhatsApp, same as /channels)', () => {
    mockUseAgentChannels.mockReturnValue({
      agent: undefined,
      channels: buildChannels({}),
      isError: false,
      error: null,
      refetch: vi.fn(),
      connectWhatsApp: vi.fn(),
      connectWithToken: vi.fn(),
      disconnect: vi.fn(),
      isMutating: false,
    } as any);

    render(<AgentChannelsTab agentId="agent-1" />);

    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('Discord')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Teams')).toBeInTheDocument();
    // No more "managed system-wide" claim -- that was false for anything
    // connected via the per-agent /channels flow.
    expect(screen.queryByText(/managed system-wide/i)).not.toBeInTheDocument();
  });

  it('shows a channel as Connected when agent.configuration.channels marks it enabled', () => {
    mockUseAgentChannels.mockReturnValue({
      agent: undefined,
      channels: buildChannels({ telegram: true }),
      isError: false,
      error: null,
      refetch: vi.fn(),
      connectWhatsApp: vi.fn(),
      connectWithToken: vi.fn(),
      disconnect: vi.fn(),
      isMutating: false,
    } as any);

    render(<AgentChannelsTab agentId="agent-1" />);

    const connectedLabels = screen.getAllByText('Connected');
    expect(connectedLabels).toHaveLength(1);
  });

  it('shows a retry affordance when the agent fails to load instead of hanging forever', () => {
    mockUseAgentChannels.mockReturnValue({
      agent: undefined,
      channels: [],
      isError: true,
      error: new Error('network error'),
      refetch: vi.fn(),
      connectWhatsApp: vi.fn(),
      connectWithToken: vi.fn(),
      disconnect: vi.fn(),
      isMutating: false,
    } as any);

    render(<AgentChannelsTab agentId="agent-1" />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
