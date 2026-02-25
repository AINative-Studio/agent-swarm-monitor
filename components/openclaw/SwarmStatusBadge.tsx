'use client';

import { cn } from '@/lib/utils';
import type { SwarmStatus } from '@/types/openclaw';

interface SwarmStatusBadgeProps {
    status: SwarmStatus;
    className?: string;
}

const statusConfig: Record<SwarmStatus, { label: string; dotClass: string; textClass: string }> = {
    idle: {
        label: 'Idle',
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-500',
    },
    running: {
        label: 'Running',
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
    },
    paused: {
        label: 'Paused',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-600',
    },
    stopped: {
        label: 'Stopped',
        dotClass: 'bg-red-500',
        textClass: 'text-red-600',
    },
    failed: {
        label: 'Failed',
        dotClass: 'bg-red-500',
        textClass: 'text-red-600',
    },
};

export default function SwarmStatusBadge({ status, className }: SwarmStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn('inline-flex items-center gap-1.5 text-sm font-medium', className)}
            role="status"
            aria-label={`Swarm status: ${config.label}`}
        >
            <span className={cn('h-2 w-2 rounded-full shrink-0', config.dotClass)} aria-hidden="true" />
            <span className={config.textClass}>{config.label}</span>
        </span>
    );
}
