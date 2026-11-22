'use client';

import { cn } from '@/lib/utils';
import type { TddCycleStatus, TddCyclePhase } from '@/types/monitoring';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
    FileEdit,
    XCircle,
    CheckCircle2,
    Wrench,
    Circle,
} from 'lucide-react';

interface TddCycleStatusIndicatorProps {
    status: TddCycleStatus;
    compact?: boolean;
    className?: string;
}

interface PhaseConfig {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    animated: boolean;
}

const phaseConfig: Record<TddCyclePhase, PhaseConfig> = {
    idle: {
        icon: Circle,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        animated: false,
    },
    writing_tests: {
        icon: FileEdit,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        animated: true,
    },
    red: {
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        animated: true,
    },
    green: {
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        animated: true,
    },
    refactoring: {
        icon: Wrench,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        animated: true,
    },
};

const COVERAGE_TARGET = 80;
const ANIMATION_DURATION = 2;
const ENTRANCE_ANIMATION_DURATION = 0.3;
const PROGRESS_BAR_DURATION = 0.5;

function getTestBadgeColor(testsPassing: number, testsTotal: number): string {
    if (testsPassing === testsTotal && testsTotal > 0) {
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    if (testsPassing === 0) {
        return 'bg-red-100 text-red-700 border-red-300';
    }
    return 'bg-amber-100 text-amber-700 border-amber-300';
}

function getProgressBarColor(testsPassing: number, testsTotal: number): string {
    if (testsPassing === testsTotal) {
        return 'bg-emerald-500';
    }
    if (testsPassing === 0) {
        return 'bg-red-500';
    }
    return 'bg-amber-500';
}

export default function TddCycleStatusIndicator({
    status,
    compact = false,
    className,
}: TddCycleStatusIndicatorProps) {
    const config = phaseConfig[status.phase];
    const Icon = config.icon;
    const isCoverageWarning = status.coveragePercent < COVERAGE_TARGET;
    const testBadgeColor = getTestBadgeColor(status.testsPassing, status.testsTotal);
    const progressBarColor = getProgressBarColor(status.testsPassing, status.testsTotal);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ENTRANCE_ANIMATION_DURATION }}
            className={cn(
                'flex flex-col gap-3 p-4 rounded-lg border-2 transition-all duration-300',
                config.bgColor,
                config.borderColor,
                className
            )}
            data-phase={status.phase}
            data-animated={config.animated ? 'true' : undefined}
            role="status"
            aria-label={`TDD cycle status: ${status.label}`}
        >
            {/* Header Section */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={config.animated ? { scale: [1, 1.1, 1] } : {}}
                        transition={{
                            duration: ANIMATION_DURATION,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
                    </motion.div>
                    <div>
                        <h3 className={cn('text-sm font-semibold', config.textColor)}>
                            {status.label}
                        </h3>
                        {!compact && (
                            <p className={cn('text-xs mt-0.5', config.textColor, 'opacity-80')}>
                                {status.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Test Pass/Fail Badge */}
                {status.testsTotal >= 0 && (
                    <Badge
                        variant="outline"
                        className={cn('text-xs font-mono', testBadgeColor)}
                    >
                        {status.testsPassing}/{status.testsTotal} passing
                    </Badge>
                )}
            </div>

            {/* Metrics Section - Only show if not compact */}
            {!compact && (
                <div className="flex items-center gap-4 text-xs">
                    {/* Coverage Percentage */}
                    <div
                        className="flex items-center gap-1.5"
                        data-warning={isCoverageWarning ? 'true' : undefined}
                    >
                        <span className={cn('font-medium', config.textColor, 'opacity-70')}>
                            Coverage:
                        </span>
                        <span
                            className={cn(
                                'font-mono font-semibold',
                                isCoverageWarning ? 'text-amber-600' : config.textColor
                            )}
                        >
                            {status.coveragePercent}%
                        </span>
                        {isCoverageWarning && (
                            <span className="text-amber-600 text-[10px]" role="alert">
                                (target: {COVERAGE_TARGET}%)
                            </span>
                        )}
                    </div>

                    {/* Test Breakdown */}
                    {status.testsTotal > 0 && (
                        <>
                            {status.testsPassing > 0 && (
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    <span className="text-emerald-600 font-medium">
                                        {status.testsPassing}
                                    </span>
                                </div>
                            )}
                            {status.testsFailing > 0 && (
                                <div className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    <span className="text-red-600 font-medium">
                                        {status.testsFailing}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            {!compact && status.testsTotal > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(status.testsPassing / status.testsTotal) * 100}%`,
                        }}
                        transition={{ duration: PROGRESS_BAR_DURATION, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', progressBarColor)}
                    />
                </div>
            )}
        </motion.div>
    );
}
