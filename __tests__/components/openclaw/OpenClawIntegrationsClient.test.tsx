import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Issue #116: Gmail/LinkedIn "Connect" buttons on /integrations were wired
// to a literal no-op (`onConnect={() => {}}`). Neither has a real backend
// connect flow yet (see lib/openclaw-service.ts), so the fix opens the same
// honest "Coming Soon" modal used for Microsoft Teams on /channels, for both
// integrations, instead of doing nothing.

vi.mock('@/hooks/useOpenClawAgents', () => ({
  useAgentList: vi.fn(),
}));

import { useAgentList } from '@/hooks/useOpenClawAgents';
import OpenClawIntegrationsClient from '@/app/integrations/OpenClawIntegrationsClient';

const mockUseAgentList = vi.mocked(useAgentList);

describe('OpenClawIntegrationsClient', () => {
  beforeEach(() => {
    mockUseAgentList.mockReturnValue({
      data: { agents: [] },
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it('opens a "Coming Soon" dialog for Gmail instead of doing nothing', async () => {
    const user = userEvent.setup();
    render(<OpenClawIntegrationsClient />);

    expect(screen.queryByText(/Gmail - Coming Soon/)).not.toBeInTheDocument();

    // Gmail is the first row in MOCK_INTEGRATIONS (lib/openclaw-mock-data.ts)
    const connectButtons = screen.getAllByRole('button', { name: 'Connect' });
    await user.click(connectButtons[0]);

    expect(screen.getByText('Gmail - Coming Soon')).toBeInTheDocument();
  });

  it('opens a "Coming Soon" dialog for LinkedIn instead of doing nothing', async () => {
    const user = userEvent.setup();
    render(<OpenClawIntegrationsClient />);

    expect(screen.queryByText(/LinkedIn - Coming Soon/)).not.toBeInTheDocument();

    const connectButtons = screen.getAllByRole('button', { name: 'Connect' });
    // Gmail and LinkedIn are both "Not connected" in mock data, LinkedIn is second
    await user.click(connectButtons[1]);

    expect(screen.getByText('LinkedIn - Coming Soon')).toBeInTheDocument();
  });

  // Issue #133: Gmail and LinkedIn are equally non-functional (both open the
  // same "Coming Soon" modal above), so both rows must carry the same
  // "Coming soon" badge -- otherwise Gmail looks actionable when it isn't.
  it('shows a "Coming soon" badge on both the Gmail and LinkedIn rows', () => {
    render(<OpenClawIntegrationsClient />);

    const badges = screen.getAllByText('Coming soon');
    expect(badges).toHaveLength(2);
  });
});
