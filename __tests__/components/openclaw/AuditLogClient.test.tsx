import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditLogClient from '@/app/audit-log/AuditLogClient';
import type { AuditEvent, AuditEventListResponse } from '@/types/openclaw';

// A minimal stateful fake of the Next.js router/searchParams pair: router.replace
// pushes a new query string into an external store, and useSearchParams subscribes
// to it via useSyncExternalStore -- so that, like the real App Router, calling
// router.replace('/audit-log?eventType=x') actually changes what useSearchParams()
// returns on the next render. A plain static mock would make it impossible to
// verify that filter state round-trips through the URL (issue #127).
let currentSearch = '';
let cachedParams = new URLSearchParams(currentSearch);
const subscribers = new Set<() => void>();

const mockReplace = vi.fn((url: string) => {
  const queryIndex = url.indexOf('?');
  const nextSearch = queryIndex === -1 ? '' : url.slice(queryIndex + 1);
  if (nextSearch === currentSearch) return;
  currentSearch = nextSearch;
  cachedParams = new URLSearchParams(currentSearch);
  subscribers.forEach((fn) => fn());
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => {
    const React = require('react');
    return React.useSyncExternalStore(
      (onStoreChange: () => void) => {
        subscribers.add(onStoreChange);
        return () => subscribers.delete(onStoreChange);
      },
      () => cachedParams
    );
  },
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditEvents: vi.fn(),
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
}));

import { useAuditEvents } from '@/hooks/useAuditLog';

const mockUseAuditEvents = vi.mocked(useAuditEvents);

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    eventType: 'agent_paused',
    agentId: 'agent-001',
    agentName: 'Linear Ticket Solver',
    actor: 'toby@ainative.studio',
    description: 'Agent paused manually.',
    severity: 'warning',
  },
  {
    id: 'audit-2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    eventType: 'heartbeat_failed',
    agentId: 'agent-002',
    agentName: 'Team Slack Engineer',
    actor: 'system',
    description: 'Heartbeat failed due to timeout.',
    severity: 'critical',
  },
];

function buildEventsResponse(events: AuditEvent[]): AuditEventListResponse {
  return { events, total: events.length, limit: 50, offset: 0 };
}

describe('AuditLogClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplace.mockClear();
    currentSearch = '';
    cachedParams = new URLSearchParams(currentSearch);
    mockUseAuditEvents.mockReturnValue({
      data: buildEventsResponse(mockEvents),
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the page heading', () => {
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument();
  });

  it('renders a row for each audit event', () => {
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByText('Agent paused manually.')).toBeInTheDocument();
    expect(screen.getByText('Heartbeat failed due to timeout.')).toBeInTheDocument();
  });

  it('shows a loading state while events are loading', () => {
    mockUseAuditEvents.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByText(/loading audit events/i)).toBeInTheDocument();
  });

  it('shows an empty state when no events match filters', () => {
    mockUseAuditEvents.mockReturnValue({
      data: buildEventsResponse([]),
      isLoading: false,
      isError: false,
    } as any);
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByText(/no audit events match/i)).toBeInTheDocument();
  });

  it('shows an error state when the query fails', () => {
    mockUseAuditEvents.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByText(/failed to load audit events/i)).toBeInTheDocument();
  });

  it('re-queries with the selected event type filter', async () => {
    renderWithQueryClient(<AuditLogClient />);

    const trigger = screen.getByLabelText(/filter by event type/i);
    // Radix UI Select opens on Enter and selects the focused option on Enter;
    // keyboard interaction avoids jsdom's lack of real pointer-drag semantics.
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const listbox = await screen.findByRole('listbox');
    const option = await within(listbox).findByText('Heartbeat Failed');
    fireEvent.keyDown(option.closest('[role="option"]') as HTMLElement, { key: 'Enter' });

    await waitFor(() => {
      const lastCallArgs = mockUseAuditEvents.mock.calls.at(-1)?.[0];
      expect(lastCallArgs).toMatchObject({ eventType: 'heartbeat_failed' });
    });
  });

  it('populates the Agent filter from the audit events mock data, not a live agent list', async () => {
    renderWithQueryClient(<AuditLogClient />);

    const trigger = screen.getByLabelText(/filter by agent/i);
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const listbox = await screen.findByRole('listbox');

    // These are the agent names baked into MOCK_AUDIT_EVENTS (lib/audit-log-mock-data.ts),
    // i.e. the same source that populates the Events table — not an unrelated agents API.
    expect(within(listbox).getByText('Linear Ticket Solver')).toBeInTheDocument();
    expect(within(listbox).getByText('Team Slack Engineer')).toBeInTheDocument();
    expect(within(listbox).getByText('Atlas')).toBeInTheDocument();
    expect(within(listbox).getByText('Debo')).toBeInTheDocument();
  });

  it('shows a clear filters action once a filter is applied and resets on click', async () => {
    renderWithQueryClient(<AuditLogClient />);

    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();

    const startDateInput = screen.getByLabelText(/filter start date/i);
    fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });

    const clearButton = await screen.findByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  // Issue #134: syncing every filter change to the URL immediately produced
  // one router.replace() (and therefore one Next.js RSC round trip) per
  // keystroke/change event. Filter writes to the URL should now be debounced.
  it('debounces rapid filter changes into a single router.replace call, while updating the UI instantly', async () => {
    vi.useFakeTimers();
    try {
      renderWithQueryClient(<AuditLogClient />);
      mockReplace.mockClear();

      const startDateInput = screen.getByLabelText(/filter start date/i);
      // Simulate a burst of rapid changes (e.g. typing a date digit by digit).
      fireEvent.change(startDateInput, { target: { value: '2026-01-0' } });
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      fireEvent.change(startDateInput, { target: { value: '2026-01-15' } });

      // The input itself reflects the latest value instantly, with zero debounce lag.
      expect(startDateInput).toHaveValue('2026-01-15');
      // But no router.replace has fired yet -- it's still debouncing.
      expect(mockReplace).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Exactly one replace call for the whole burst, with the final value.
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2026-01-15'),
        expect.anything()
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
