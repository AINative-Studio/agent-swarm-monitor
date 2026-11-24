import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditLogClient from '@/app/audit-log/AuditLogClient';
import type { RealAuditEvent, RealAuditLogResponse } from '@/types/openclaw';

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

// Shaped like the real GET /api/v1/security/audit-logs response (issue #140):
// no id/severity/agentName -- a generic peerId/action/resource/result/reason record.
const mockEvents: RealAuditEvent[] = [
  {
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    eventType: 'agent_paused',
    peerId: 'agent-001',
    action: 'pause',
    resource: 'agent-001',
    result: 'success',
    reason: 'Agent paused manually.',
    metadata: {},
  },
  {
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    eventType: 'heartbeat_failed',
    peerId: 'agent-002',
    action: 'heartbeat',
    resource: 'agent-002',
    result: 'denied',
    reason: 'Heartbeat failed due to timeout.',
    metadata: {},
  },
];

function buildEventsResponse(events: RealAuditEvent[]): RealAuditLogResponse {
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

  it('falls back to a neutral badge style for an unrecognized result value, instead of crashing', () => {
    mockUseAuditEvents.mockReturnValue({
      data: buildEventsResponse([
        {
          timestamp: new Date().toISOString(),
          eventType: 'settings_changed',
          peerId: 'agent-003',
          action: 'update',
          resource: 'agent-003',
          result: 'partial',
          reason: 'Some unrecognized result value.',
          metadata: {},
        },
      ]),
      isLoading: false,
      isError: false,
    } as any);
    renderWithQueryClient(<AuditLogClient />);
    expect(screen.getByText('partial')).toBeInTheDocument();
  });

  it('re-queries with the event type filter typed into the Event type field', async () => {
    renderWithQueryClient(<AuditLogClient />);

    const input = screen.getByLabelText(/filter by event type/i);
    fireEvent.change(input, { target: { value: 'heartbeat_failed' } });

    await waitFor(() => {
      const lastCallArgs = mockUseAuditEvents.mock.calls.at(-1)?.[0];
      expect(lastCallArgs).toMatchObject({ eventType: 'heartbeat_failed' });
    });
  });

  it('re-queries with the peer ID filter typed into the Peer ID field', async () => {
    renderWithQueryClient(<AuditLogClient />);

    const input = screen.getByLabelText(/filter by peer id/i);
    fireEvent.change(input, { target: { value: 'agent-002' } });

    await waitFor(() => {
      const lastCallArgs = mockUseAuditEvents.mock.calls.at(-1)?.[0];
      expect(lastCallArgs).toMatchObject({ peerId: 'agent-002' });
    });
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
