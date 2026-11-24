import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Issue #107: /agents must show a visible error (not a false "No agents yet"
// empty state) when the agent list query fails, e.g. on a 401. Issue #108:
// Create Agent must not close/reset silently on a failed submit.

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
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

  // Issue #134: syncing the search box to the URL on every keystroke fired one
  // router.replace() (and therefore one Next.js RSC round trip) per character
  // typed. Writes to the URL should now be debounced while the input itself
  // (and the filtered list) still update instantly.
  it('debounces URL sync while typing, updating the input instantly', () => {
    vi.useFakeTimers();
    try {
      mockUseAgentList.mockReturnValue({
        data: { agents: [{ id: 'a1', name: 'Linear Ticket Solver', status: 'running' }], total: 1 },
        isLoading: false,
        isError: false,
        error: null,
        refetch,
      } as any);

      render(<OpenClawAgentsClient />);
      mockReplace.mockClear();

      const searchInput = screen.getByLabelText('Search agents');
      fireEvent.change(searchInput, { target: { value: 'L' } });
      fireEvent.change(searchInput, { target: { value: 'Li' } });
      fireEvent.change(searchInput, { target: { value: 'Lin' } });

      // Instant visual feedback, zero debounce lag on the input itself.
      expect(searchInput).toHaveValue('Lin');
      // But no router.replace yet -- still debouncing.
      expect(mockReplace).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/agents?search=Lin', { scroll: false });
    } finally {
      vi.useRealTimers();
    }
  });

  // Issue #147: rows must render in a stable order (newest createdAt first,
  // with id as a deterministic tiebreaker) independent of whatever order the
  // query returns them in on a given render -- a row's position should never
  // appear to shift under the user's cursor between polls/refetches.
  it('renders agent rows sorted by createdAt descending regardless of the order the query returns', () => {
    mockUseAgentList.mockReturnValue({
      data: {
        agents: [
          { id: 'a-older', name: 'Older Agent', status: 'running', createdAt: '2026-01-01T00:00:00Z' },
          { id: 'a-newest', name: 'Newest Agent', status: 'running', createdAt: '2026-03-01T00:00:00Z' },
          { id: 'a-middle', name: 'Middle Agent', status: 'running', createdAt: '2026-02-01T00:00:00Z' },
        ],
        total: 3,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    } as any);

    render(<OpenClawAgentsClient />);

    const rowNames = screen.getAllByRole('link').map((link) => link.textContent);
    const newestIdx = rowNames.findIndex((t) => t?.includes('Newest Agent'));
    const middleIdx = rowNames.findIndex((t) => t?.includes('Middle Agent'));
    const olderIdx = rowNames.findIndex((t) => t?.includes('Older Agent'));

    expect(newestIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(olderIdx);
  });

  it('breaks ties on identical createdAt deterministically by id, not by query result order', () => {
    const tiedTime = '2026-01-01T00:00:00Z';
    mockUseAgentList.mockReturnValue({
      data: {
        agents: [
          { id: 'b-second', name: 'Agent B', status: 'running', createdAt: tiedTime },
          { id: 'a-first', name: 'Agent A', status: 'running', createdAt: tiedTime },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    } as any);

    const { unmount } = render(<OpenClawAgentsClient />);
    const firstRenderOrder = screen.getAllByRole('link').map((l) => l.textContent);
    unmount();

    // Re-render with the query returning the exact same two agents in the
    // opposite array order -- the rendered order must not change.
    mockUseAgentList.mockReturnValue({
      data: {
        agents: [
          { id: 'a-first', name: 'Agent A', status: 'running', createdAt: tiedTime },
          { id: 'b-second', name: 'Agent B', status: 'running', createdAt: tiedTime },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    } as any);

    render(<OpenClawAgentsClient />);
    const secondRenderOrder = screen.getAllByRole('link').map((l) => l.textContent);

    expect(secondRenderOrder).toEqual(firstRenderOrder);
  });
});
