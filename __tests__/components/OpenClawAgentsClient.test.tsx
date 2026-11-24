import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Issue #107: /agents must show a visible error (not a false "No agents yet"
// empty state) when the agent list query fails, e.g. on a 401. Issue #108:
// Create Agent must not close/reset silently on a failed submit.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const refetch = vi.fn();
const mutate = vi.fn();

vi.mock('@/hooks/useOpenClawAgents', () => ({
  useAgentList: vi.fn(),
  useCreateAgent: () => ({ mutate, isPending: false }),
}));

import { useAgentList } from '@/hooks/useOpenClawAgents';
import OpenClawAgentsClient from '@/app/agents/OpenClawAgentsClient';

const mockUseAgentList = vi.mocked(useAgentList);

describe('OpenClawAgentsClient', () => {
  it('shows a visible error state with a retry affordance instead of the empty state on a failed fetch', async () => {
    const user = userEvent.setup();
    mockUseAgentList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Not authenticated'),
      refetch,
    } as any);

    render(<OpenClawAgentsClient />);

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load agents/i);
    expect(screen.queryByText('No agents yet. Create your first agent to get started.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the real empty state (not an error) when the fetch succeeds with zero agents', () => {
    mockUseAgentList.mockReturnValue({
      data: { agents: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    } as any);

    render(<OpenClawAgentsClient />);

    expect(screen.getByText('No agents yet. Create your first agent to get started.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
