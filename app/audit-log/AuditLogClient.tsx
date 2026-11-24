'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useAuditEvents } from '@/hooks/useAuditLog';
import { fadeUp } from '@/lib/openclaw-utils';
import { MOCK_AUDIT_EVENT_AGENTS } from '@/lib/audit-log-mock-data';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditEventSeverity, AuditEventType } from '@/types/openclaw';
import { AUDIT_EVENT_TYPES } from '@/types/openclaw';

const severityStyles: Record<AuditEventSeverity, string> = {
  info: 'border-transparent bg-blue-50 text-blue-700',
  warning: 'border-transparent bg-amber-50 text-amber-700',
  critical: 'border-transparent bg-red-50 text-red-700',
};

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Debounce how often filter changes are pushed into the URL -- each
// router.replace() triggers a Next.js App Router RSC round trip, so syncing
// on every change event (e.g. each digit typed into a date field) produced
// far more network requests than necessary. See issue #134.
const FILTER_URL_SYNC_DEBOUNCE_MS = 300;

export default function AuditLogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state lives in the URL query string (?eventType=&agentId=&startDate=&endDate=)
  // rather than plain useState, so it survives browser Back/Forward navigation
  // and filtered views are shareable/bookmarkable. See issue #127. Local state
  // mirrors the URL for instant UI feedback; writes to the URL are debounced
  // (see updateFilters below) so a burst of changes (e.g. typing a date)
  // doesn't fire one router.replace() per keystroke.
  const urlEventType = (searchParams.get('eventType') as AuditEventType | 'all') ?? 'all';
  const urlAgentId = searchParams.get('agentId') ?? 'all';
  const urlStartDate = searchParams.get('startDate') ?? '';
  const urlEndDate = searchParams.get('endDate') ?? '';

  const [eventType, setEventTypeState] = useState(urlEventType);
  const [agentId, setAgentIdState] = useState(urlAgentId);
  const [startDate, setStartDateState] = useState(urlStartDate);
  const [endDate, setEndDateState] = useState(urlEndDate);

  // Re-sync local state from the URL when it changes from outside this
  // component's own debounced writes -- e.g. Back/Forward navigation.
  useEffect(() => {
    setEventTypeState(urlEventType);
    setAgentIdState(urlAgentId);
    setStartDateState(urlStartDate);
    setEndDateState(urlEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-syncs from the URL
  }, [urlEventType, urlAgentId, urlStartDate, urlEndDate]);

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
          if (!value || value === 'all') {
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

  const setEventType = (value: AuditEventType | 'all') => {
    setEventTypeState(value);
    updateFilters({ eventType: value });
  };
  const setAgentId = (value: string) => {
    setAgentIdState(value);
    updateFilters({ agentId: value });
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
      eventType,
      agentId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [eventType, agentId, startDate, endDate]
  );

  const { data, isLoading, isError } = useAuditEvents(filters);
  const events = data?.events ?? [];

  const hasActiveFilters =
    eventType !== 'all' || agentId !== 'all' || !!startDate || !!endDate;

  const clearFilters = () => {
    clearTimeout(debounceTimerRef.current);
    setEventTypeState('all');
    setAgentIdState('all');
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
          Security and activity events across your agents and workspace
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
          <Select value={eventType} onValueChange={(v) => setEventType(v as AuditEventType | 'all')}>
            <SelectTrigger id="audit-event-type" className="w-[200px] bg-white border-gray-200 text-sm" aria-label="Filter by event type">
              <SelectValue placeholder="All event types" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">All event types</SelectItem>
              {AUDIT_EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-agent" className="text-xs font-medium text-gray-500">
            Agent
          </label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger id="audit-agent" className="w-[200px] bg-white border-gray-200 text-sm" aria-label="Filter by agent">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">All agents</SelectItem>
              {MOCK_AUDIT_EVENT_AGENTS.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const typeLabel =
                    AUDIT_EVENT_TYPES.find((t) => t.value === event.eventType)?.label ??
                    event.eventType;
                  return (
                    <tr key={event.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {typeLabel}
                      </td>
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                        {event.agentName ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{event.actor}</td>
                      <td className="px-5 py-3 text-gray-600 min-w-[240px]">{event.description}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge className={severityStyles[event.severity]}>{event.severity}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
