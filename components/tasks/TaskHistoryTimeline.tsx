'use client';

import type { TaskHistoryEvent } from '@/types/tasks';

interface TaskHistoryTimelineProps {
    events: TaskHistoryEvent[];
    isLoading?: boolean;
}

const EVENT_COLORS: Record<string, string> = {
    TASK_CREATED: 'bg-blue-500',
    TASK_LEASED: 'bg-purple-500',
    TASK_STARTED: 'bg-yellow-500',
    TASK_COMPLETED: 'bg-green-500',
    TASK_FAILED: 'bg-red-500',
    LEASE_EXPIRED: 'bg-orange-500',
    TASK_REQUEUED: 'bg-indigo-500',
};

export default function TaskHistoryTimeline({ events, isLoading }: TaskHistoryTimelineProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-gray-200 mt-1" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 text-sm">No history events found</div>
        );
    }

    return (
        <div className="relative">
            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-6">
                {events.map((event) => (
                    <div key={event.id} className="relative flex gap-4">
                        <div className={`relative z-10 w-3 h-3 rounded-full mt-1.5 ${EVENT_COLORS[event.eventType] || 'bg-gray-500'}`} />
                        <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {event.eventType.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            {event.peerId && (
                                <div className="mt-2 text-xs text-gray-600">
                                    <span className="font-medium">Peer:</span>{' '}
                                    <span className="font-mono">{event.peerId.slice(0, 16)}...</span>
                                </div>
                            )}
                            {event.details && Object.keys(event.details).length > 0 && (
                                <div className="mt-3 rounded-md bg-gray-50 border border-gray-200 p-3">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Details</div>
                                    <div className="space-y-1">
                                        {Object.entries(event.details).map(([key, value]) => (
                                            <div key={key} className="text-xs text-gray-600">
                                                <span className="font-medium">{key}:</span>{' '}
                                                <span className="font-mono">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
