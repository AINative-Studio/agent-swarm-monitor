import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import openClawService from '@/lib/openclaw-service';
import type { OpenClawAgent } from '@/types/openclaw';

// Issue #139: /channels and the agent detail Channels tab used to be two
// unsynced systems -- connecting a channel on one surface was invisible on
// the other. Both surfaces now share this one hook, which reads/writes
// agent.configuration.channels via the real PATCH /agents/{id}/settings
// endpoint (the mechanism confirmed, via live testing, to actually persist
// across reload -- the separate "global" OpenClaw channel API hung
// indefinitely in the same live test).

vi.mock('@/lib/openclaw-service', () => ({
  default: {
    getAgent: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useAgentChannels } from '@/hooks/useAgentChannels';

const mockGetAgent = vi.mocked(openClawService.getAgent);
const mockUpdateSettings = vi.mocked(openClawService.updateSettings);

function baseAgent(overrides: Partial<OpenClawAgent> = {}): OpenClawAgent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    persona: null,
    model: 'claude-opus-4.5',
    userId: 'user-1',
    status: 'running',
    openclawSessionKey: null,
    openclawAgentId: null,
    heartbeatEnabled: false,
    heartbeatInterval: null,
    heartbeatChecklist: null,
    lastHeartbeatAt: null,
    nextHeartbeatAt: null,
    configuration: {},
    errorMessage: null,
    errorCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    provisionedAt: null,
    pausedAt: null,
    stoppedAt: null,
    ...overrides,
  } as OpenClawAgent;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useAgentChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives connected status from agent.configuration.channels, not a separate global API', async () => {
    mockGetAgent.mockResolvedValue(
      baseAgent({
        configuration: {
          channels: {
            telegram: { enabled: true, botToken: 'x', connectedAt: '2026-01-01T00:00:00Z' },
          },
        } as any,
      })
    );

    const { result } = renderHook(() => useAgentChannels('agent-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.channels.length).toBeGreaterThan(0));

    const telegram = result.current.channels.find((c) => c.id === 'telegram');
    const slack = result.current.channels.find((c) => c.id === 'slack');
    expect(telegram?.connected).toBe(true);
    expect(slack?.connected).toBe(false);
  });

  it('connectWithToken PATCHes agent settings (the same write path /channels uses) and marks the channel connected', async () => {
    mockGetAgent.mockResolvedValue(baseAgent({ configuration: {} }));
    mockUpdateSettings.mockResolvedValue(
      baseAgent({
        configuration: {
          channels: { slack: { enabled: true, botToken: 'xoxb-test', workspace: 'acme' } },
        } as any,
      })
    );

    const { result } = renderHook(() => useAgentChannels('agent-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.agent).toBeDefined());

    await act(async () => {
      await result.current.connectWithToken('slack', { botToken: 'xoxb-test', botUsername: 'acme' });
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        configuration: expect.objectContaining({
          channels: expect.objectContaining({
            slack: expect.objectContaining({ enabled: true, botToken: 'xoxb-test' }),
          }),
        }),
      })
    );
  });

  it('disconnect PATCHes the channel to enabled:false', async () => {
    mockGetAgent.mockResolvedValue(
      baseAgent({
        configuration: { channels: { telegram: { enabled: true } } } as any,
      })
    );
    mockUpdateSettings.mockResolvedValue(baseAgent({ configuration: { channels: {} } as any }));

    const { result } = renderHook(() => useAgentChannels('agent-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.agent).toBeDefined());

    await act(async () => {
      await result.current.disconnect('telegram', 'Telegram');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        configuration: expect.objectContaining({
          channels: expect.objectContaining({
            telegram: { enabled: false },
          }),
        }),
      })
    );
  });
});
