'use client';
import { useMemo } from 'react';
import type { TimelineEvent } from '@/types/monitoring';

interface TimelineViewProps {
    events: TimelineEvent[];
    maxEvents?: number;
}

export default function TimelineView({ events, maxEvents = 20 }: TimelineViewProps) {
    const displayEvents = useMemo(() => events.slice(0, maxEvents), [events, maxEvents]);
    if (displayEvents.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">No timeline events available</div>;

    return (
        <div className="space-y-3">
            {displayEvents.map((event, index) => <TimelineEventCard key={`${event.timestamp}-${index}`} event={event} />)}
        </div>
    );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
    const config = getEventTypeConfig(event.eventType);
    const timestamp = new Date(event.timestamp);

    return (
        <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgClass}`}>
                    <span className={`text-xs font-bold ${config.textClass}`}>{config.icon}</span>
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{formatEventType(event.eventType)}</h4>
                    <time className="text-xs text-gray-500 flex-shrink-0" dateTime={event.timestamp}>{timestamp.toLocaleTimeString()}</time>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                    {event.taskId && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Task: {truncate(event.taskId, 8)}</span>}
                    {event.peerId && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">Peer: {truncate(event.peerId, 8)}</span>}
                </div>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Metadata ({Object.keys(event.metadata).length} fields)</summary>
                        <div className="mt-2 bg-gray-50 rounded p-2 border border-gray-200">
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}

function getEventTypeConfig(eventType: string) {
    const type = eventType.toUpperCase();
    if (type.includes('CREATED') || type.includes('STARTED')) return { bgClass: 'bg-blue-100', textClass: 'text-blue-700', icon: '+' };
    if (type.includes('COMPLETED') || type.includes('SUCCESS')) return { bgClass: 'bg-green-100', textClass: 'text-green-700', icon: '✓' };
    if (type.includes('FAILED') || type.includes('ERROR') || type.includes('CRASH')) return { bgClass: 'bg-red-100', textClass: 'text-red-700', icon: '✕' };
    if (type.includes('EXPIRED') || type.includes('REVOKED')) return { bgClass: 'bg-orange-100', textClass: 'text-orange-700', icon: '⏱' };
    if (type.includes('ASSIGNED') || type.includes('LEASED')) return { bgClass: 'bg-purple-100', textClass: 'text-purple-700', icon: '→' };
    return { bgClass: 'bg-gray-100', textClass: 'text-gray-700', icon: '•' };
}

function formatEventType(eventType: string): string {
    return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function truncate(str: string, maxLen: number): string {
    return str.length <= maxLen ? str : `${str.slice(0, maxLen)}...`;
}
