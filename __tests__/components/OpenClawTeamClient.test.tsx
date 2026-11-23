import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Issue #107: the Team page's "Members" section must show a visible error
// instead of silently rendering "Members (0)" when the fetch fails (e.g. a
// 401). Issue #108: Add Member must not silently clear the typed email when
// the invite mutation fails -- it should keep the input and show an error.

vi.mock('@/lib/team-service', () => ({
  default: {
    listMembers: vi.fn(),
    inviteMember: vi.fn(),
  },
}));

import teamService from '@/lib/team-service';
import { ApiError } from '@/lib/api-client';
import OpenClawTeamClient from '@/app/team/OpenClawTeamClient';

const mockListMembers = vi.mocked(teamService.listMembers);
const mockInviteMember = vi.mocked(teamService.inviteMember);

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OpenClawTeamClient />
    </QueryClientProvider>
  );
}

describe('OpenClawTeamClient', () => {
  it('shows a visible error instead of "Members (0)" when the fetch fails', async () => {
    mockListMembers.mockRejectedValue(new ApiError(401, 'Not authenticated'));

    renderWithQueryClient();

    expect(await screen.findByText(/not authenticated/i)).toBeInTheDocument();
    expect(screen.queryByText('Members (0)')).not.toBeInTheDocument();
  });

  it('keeps the typed email and shows an error banner when Add Member fails', async () => {
    const user = userEvent.setup();
    mockListMembers.mockResolvedValue({ members: [], total: 0, limit: 50, offset: 0 });
    mockInviteMember.mockRejectedValue(new ApiError(401, 'Not authenticated'));

    renderWithQueryClient();

    await waitFor(() => expect(screen.getByText('Members (0)')).toBeInTheDocument());

    const emailInput = screen.getByPlaceholderText('Email address');
    await user.type(emailInput, 'new.hire@example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(/not authenticated/i)).toBeInTheDocument();
    expect(emailInput).toHaveValue('new.hire@example.com');
  });
});
