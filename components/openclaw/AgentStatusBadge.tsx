'use client';

import { cn } from '@/lib/utils';
import type { AgentStatus } from '@/types/openclaw';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

const statusConfig: Record<AgentStatus, { label: string; dotClass: string; textClass: string }> = {
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
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-500',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-red-500',
    textClass: 'text-red-600',
  },
  provisioning: {
    label: 'Provisioning',
    dotClass: 'bg-blue-500 animate-pulse',
    textClass: 'text-blue-600',
  },
};

export default function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-sm font-medium', className)}
      role="status"
      aria-label={`Agent status: ${config.label}`}
    >
      <span className={cn('h-2 w-2 rounded-full shrink-0', config.dotClass)} aria-hidden="true" />
      <span className={config.textClass}>{config.label}</span>
    </span>
  );
}
