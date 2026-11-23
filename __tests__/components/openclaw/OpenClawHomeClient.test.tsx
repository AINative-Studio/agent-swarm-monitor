import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OpenClawHomeClient from '@/app/OpenClawHomeClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useOpenClawAgents', () => ({
  useAgentList: vi.fn(),
}));

vi.mock('@/hooks/useMonitoring', () => ({
  useSwarmHealth: vi.fn(),
  useTimeline: vi.fn(),
}));

vi.mock('@/hooks/useTemplates', () => ({
  useTemplateList: vi.fn(),
}));

import { useAgentList } from '@/hooks/useOpenClawAgents';
import { useSwarmHealth, useTimeline } from '@/hooks/useMonitoring';
import { useTemplateList } from '@/hooks/useTemplates';

const mockUseAgentList = vi.mocked(useAgentList);
const mockUseSwarmHealth = vi.mocked(useSwarmHealth);
const mockUseTimeline = vi.mocked(useTimeline);
const mockUseTemplateList = vi.mocked(useTemplateList);

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('OpenClawHomeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSwarmHealth.mockReturnValue({ data: { status: 'healthy' } } as any);
    mockUseTimeline.mockReturnValue({ data: { totalCount: 0 } } as any);
    mockUseTemplateList.mockReturnValue({ data: { templates: [] } } as any);
  });

  it('shows a confident Swarm Health value when the agent list loads successfully', () => {
    mockUseAgentList.mockReturnValue({
      data: { agents: [], total: 0, limit: 50, offset: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithQueryClient(<OpenClawHomeClient />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.queryByText(/partial data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  it('caveats Swarm Health and the agent-derived stats when the agent list fails to load', () => {
    mockUseAgentList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network error'),
      refetch: vi.fn(),
    } as any);

    renderWithQueryClient(<OpenClawHomeClient />);

    // Swarm Health still reports what its own endpoint said, but is marked as
    // reduced-confidence since it's shown next to a failed agent roster.
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText(/partial data/i)).toBeInTheDocument();

    // Total Agents / Running shouldn't assert a bare "0" as if that were a
    // confirmed empty roster rather than an unknown one.
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThanOrEqual(2);

    // The existing error banner for the agent list should still be present.
    expect(screen.getByText('Failed to load your AI team.')).toBeInTheDocument();
  });
});
