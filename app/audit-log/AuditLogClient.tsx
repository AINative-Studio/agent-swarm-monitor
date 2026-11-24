'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useAuditEvents } from '@/hooks/useAuditLog';
import { fadeUp } from '@/lib/openclaw-utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// The real backend's `result` field is a free-form string (confirmed live:
// "success"/"denied" seen so far) rather than a fixed enum, so this maps the
// values we've observed to a badge style and falls back to a neutral style
// for anything else instead of crashing on an unrecognized value.
function resultBadgeClass(result: string | null | undefined): string {
  const normalized = (result ?? '').toLowerCase();
  if (normalized === 'success' || normalized === 'allowed' || normalized === 'granted') {
    return 'border-transparent bg-emerald-50 text-emerald-700';
  }
  if (normalized === 'denied' || normalized === 'failed' || normalized === 'error') {
    return 'border-transparent bg-red-50 text-red-700';
  }
  return 'border-transparent bg-gray-100 text-gray-700';
}

// Debounce how often filter changes are pushed into the URL -- each
// router.replace() triggers a Next.js App Router RSC round trip, so syncing
// on every change event (e.g. each keystroke into a text field) produced far
// more network requests than necessary. See issue #134.
const FILTER_URL_SYNC_DEBOUNCE_MS = 300;

export default function AuditLogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state lives in the URL query string rather than plain useState,
  // so it survives browser Back/Forward navigation and filtered views are
  // shareable/bookmarkable. See issue #127. Local state mirrors the URL for
  // instant UI feedback; writes to the URL are debounced (see updateFilters
  // below) so a burst of changes doesn't fire one router.replace() per
  // keystroke.
  //
  // Issue #140: these now map directly to the real backend's filter params
  // (peer_id/event_type/start_time/end_time) instead of the old mock
  // agentId/eventType/startDate/endDate, since the real audit log has no
  // concept of "agent" -- just a generic peer_id.
  const urlPeerId = searchParams.get('peerId') ?? '';
  const urlEventType = searchParams.get('eventType') ?? '';
  const urlStartDate = searchParams.get('startDate') ?? '';
  const urlEndDate = searchParams.get('endDate') ?? '';

  const [peerId, setPeerIdState] = useState(urlPeerId);
  const [eventType, setEventTypeState] = useState(urlEventType);
  const [startDate, setStartDateState] = useState(urlStartDate);
  const [endDate, setEndDateState] = useState(urlEndDate);

  // Re-sync local state from the URL when it changes from outside this
  // component's own debounced writes -- e.g. Back/Forward navigation.
  useEffect(() => {
    setPeerIdState(urlPeerId);
    setEventTypeState(urlEventType);
    setStartDateState(urlStartDate);
    setEndDateState(urlEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-syncs from the URL
  }, [urlPeerId, urlEventType, urlStartDate, urlEndDate]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current);
  }, []);

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
          if (!value) {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });
        const query = params.toString();
        router.replace(query ? `/audit-log?${query}` : '/audit-log', { scroll: false });
      }, FILTER_URL_SYNC_DEBOUNCE_MS);
    },
    [router]
  );

  const setPeerId = (value: string) => {
    setPeerIdState(value);
    updateFilters({ peerId: value });
  };
  const setEventType = (value: string) => {
    setEventTypeState(value);
    updateFilters({ eventType: value });
  };
  const setStartDate = (value: string) => {
    setStartDateState(value);
    updateFilters({ startDate: value });
  };
  const setEndDate = (value: string) => {
    setEndDateState(value);
    updateFilters({ endDate: value });
  };

  const filters = useMemo(
    () => ({
      peerId: peerId || undefined,
      eventType: eventType || undefined,
      // Backend wants full ISO 8601 timestamps; the <input type="date">
      // fields only give a bare date, so expand to day boundaries the same
      // way the old mock filtering did.
      startTime: startDate ? new Date(startDate).toISOString() : undefined,
      endTime: endDate ? new Date(new Date(endDate).getTime() + 86400000).toISOString() : undefined,
    }),
    [peerId, eventType, startDate, endDate]
  );

  const { data, isLoading, isError } = useAuditEvents(filters);
  const events = data?.events ?? [];

  const hasActiveFilters = !!peerId || !!eventType || !!startDate || !!endDate;

  const clearFilters = () => {
    clearTimeout(debounceTimerRef.current);
    setPeerIdState('');
    setEventTypeState('');
    setStartDateState('');
    setEndDateState('');
    router.replace('/audit-log', { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Security events recorded by the OpenClaw backend
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-event-type" className="text-xs font-medium text-gray-500">
            Event type
          </label>
          <Input
            id="audit-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g. token_issued"
            className="h-10 w-[200px] bg-white border-gray-200 text-sm"
            aria-label="Filter by event type"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-peer-id" className="text-xs font-medium text-gray-500">
            Peer ID
          </label>
          <Input
            id="audit-peer-id"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            placeholder="Filter by peer ID"
            className="h-10 w-[200px] bg-white border-gray-200 text-sm"
            aria-label="Filter by peer ID"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-start-date" className="text-xs font-medium text-gray-500">
            From
          </label>
          <input
            id="audit-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-[160px] rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Filter start date"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-end-date" className="text-xs font-medium text-gray-500">
            To
          </label>
          <input
            id="audit-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 w-[160px] rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Filter end date"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 px-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Events table */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Events</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total} event${data.total === 1 ? '' : 's'}` : 'Loading events'}
          </p>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-gray-500">Loading audit events&hellip;</div>
        )}

        {isError && (
          <div className="px-5 py-10 text-center text-sm text-red-600">
            Failed to load audit events. Please try again.
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No audit events match the selected filters.
          </div>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Peer</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={`${event.timestamp}-${index}`} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {event.eventType}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{event.peerId}</td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{event.action}</td>
                    <td className="px-5 py-3 text-gray-600 min-w-[160px]">{event.resource ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 min-w-[200px]">{event.reason}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge className={resultBadgeClass(event.result)}>{event.result}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
