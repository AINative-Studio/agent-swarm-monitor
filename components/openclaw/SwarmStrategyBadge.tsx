'use client';

import { GitBranch, ArrowRight, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoordinationStrategy } from '@/types/openclaw';

interface SwarmStrategyBadgeProps {
    strategy: CoordinationStrategy;
    className?: string;
}

const strategyConfig: Record<CoordinationStrategy, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    textClass: string;
}> = {
    parallel: {
        label: 'Parallel',
        icon: GitBranch,
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-700',
    },
    sequential: {
        label: 'Sequential',
        icon: ArrowRight,
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
    },
    hierarchical: {
        label: 'Hierarchical',
        icon: Network,
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
    },
};

export default function SwarmStrategyBadge({ strategy, className }: SwarmStrategyBadgeProps) {
    const config = strategyConfig[strategy];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                config.bgClass,
                config.textClass,
                className
            )}
        >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {config.label}
        </span>
    );
}
