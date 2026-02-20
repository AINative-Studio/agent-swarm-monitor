'use client';

import { useState } from 'react';
import type { TimelineEvent, TimelineFilters } from '@/types/monitoring';

const EVENT_TYPE_COLORS: Record<string, string> = {
    TASK_CREATED: 'bg-blue-50 text-blue-700',
    TASK_QUEUED: 'bg-blue-50 text-blue-600',
    TASK_LEASED: 'bg-indigo-50 text-indigo-700',
    TASK_STARTED: 'bg-green-50 text-green-700',
    TASK_COMPLETED: 'bg-green-50 text-green-800',
    TASK_FAILED: 'bg-red-50 text-red-700',
    TASK_EXPIRED: 'bg-orange-50 text-orange-700',
    TASK_REQUEUED: 'bg-yellow-50 text-yellow-700',
    LEASE_ISSUED: 'bg-indigo-50 text-indigo-600',
    LEASE_EXPIRED: 'bg-orange-50 text-orange-600',
    LEASE_REVOKED: 'bg-red-50 text-red-600',
    NODE_CRASHED: 'bg-red-100 text-red-800',
};

function formatTimestamp(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

interface TimelineTableProps {
    events: TimelineEvent[];
    totalCount: number;
    filters: TimelineFilters;
    onFiltersChange: (filters: TimelineFilters) => void;
}

export default function TimelineTable({
    events,
    totalCount,
    filters,
    onFiltersChange,
}: TimelineTableProps) {
    const [localEventType, setLocalEventType] = useState(filters.eventType || '');
    const [localTaskId, setLocalTaskId] = useState(filters.taskId || '');
    const [localPeerId, setLocalPeerId] = useState(filters.peerId || '');

    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
    const totalPages = Math.ceil(totalCount / (filters.limit || 50));

    function applyFilters() {
        onFiltersChange({
            ...filters,
            eventType: localEventType || undefined,
            taskId: localTaskId || undefined,
            peerId: localPeerId || undefined,
            offset: 0,
        });
    }

    function goToPage(page: number) {
        onFiltersChange({
            ...filters,
            offset: (page - 1) * (filters.limit || 50),
        });
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={localEventType}
                    onChange={(e) => setLocalEventType(e.target.value)}
                    className="rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-gray-700"
                    aria-label="Filter by event type"
                >
                    <option value="">All event types</option>
                    {Object.keys(EVENT_TYPE_COLORS).map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Task ID"
                    value={localTaskId}
                    onChange={(e) => setLocalTaskId(e.target.value)}
                    className="rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-gray-700 w-36"
                    aria-label="Filter by task ID"
                />
                <input
                    type="text"
                    placeholder="Peer ID"
                    value={localPeerId}
                    onChange={(e) => setLocalPeerId(e.target.value)}
                    className="rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-gray-700 w-36"
                    aria-label="Filter by peer ID"
                />
                <button
                    onClick={applyFilters}
                    className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                    Filter
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-[#E8E6E1]">
                <table className="w-full text-sm">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1]">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Type</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Task ID</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Peer ID</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEECEA]">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    No timeline events found
                                </td>
                            </tr>
                        ) : (
                            events.map((event, i) => (
                                <tr key={`${event.timestamp}-${i}`} className="hover:bg-[#FAFAF8]">
                                    <td className="px-4 py-2.5">
                                        <span
                                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {event.eventType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                                        {event.taskId || '--'}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                                        {event.peerId || '--'}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {formatTimestamp(event.timestamp)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                        Showing {(filters.offset || 0) + 1}-{Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} of {totalCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="rounded-md border border-[#E8E6E1] px-3 py-1 hover:bg-[#FAF9F6] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="rounded-md border border-[#E8E6E1] px-3 py-1 hover:bg-[#FAF9F6] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
