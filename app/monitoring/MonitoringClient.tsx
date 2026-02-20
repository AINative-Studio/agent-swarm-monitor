'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/openclaw-utils';
import {
    useSwarmHealth,
    useTimeline,
    useAlertThresholds,
    useUpdateAlertThresholds,
} from '@/hooks/useMonitoring';
import SwarmHealthPanel from '@/components/openclaw/SwarmHealthPanel';
import TimelineTable from '@/components/openclaw/TimelineTable';
import AlertThresholdEditor from '@/components/openclaw/AlertThresholdEditor';
import type { TimelineFilters } from '@/types/monitoring';

const STATUS_STYLES = {
    healthy: 'bg-green-50 text-green-700 border-green-200',
    degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    unhealthy: 'bg-red-50 text-red-700 border-red-200',
} as const;

export default function MonitoringClient() {
    const [timelineFilters, setTimelineFilters] = useState<TimelineFilters>({
        limit: 50,
        offset: 0,
    });

    const { data: health, isLoading: healthLoading } = useSwarmHealth();
    const { data: timeline, isLoading: timelineLoading } = useTimeline(timelineFilters);
    const { data: thresholds, isLoading: thresholdsLoading } = useAlertThresholds();
    const updateThresholds = useUpdateAlertThresholds();

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Real-time swarm health, timeline events, and alert configuration
                </p>
            </motion.div>

            {/* Health Banner */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                {healthLoading ? (
                    <div className="h-16 rounded-lg bg-gray-50 animate-pulse" />
                ) : health ? (
                    <div
                        className={`flex items-center justify-between rounded-lg border px-5 py-3.5 ${
                            STATUS_STYLES[health.status] || STATUS_STYLES.unhealthy
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold uppercase tracking-wider">
                                {health.status}
                            </span>
                            <span className="text-sm opacity-75">
                                {health.subsystemsAvailable}/{health.subsystemsTotal} subsystems available
                            </span>
                        </div>
                        <span className="text-xs opacity-60">
                            {new Date(health.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ) : (
                    <div className="rounded-lg border border-[#E8E6E1] px-5 py-3.5 text-sm text-gray-400">
                        Unable to load health status
                    </div>
                )}
            </motion.div>

            {/* Subsystem Health Cards */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Subsystem Health</h2>
                {healthLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-28 rounded-lg bg-gray-50 animate-pulse" />
                        ))}
                    </div>
                ) : health ? (
                    <SwarmHealthPanel health={health} />
                ) : null}
            </motion.div>

            {/* Timeline */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Event Timeline</h2>
                {timelineLoading ? (
                    <div className="h-48 rounded-lg bg-gray-50 animate-pulse" />
                ) : (
                    <TimelineTable
                        events={timeline?.events ?? []}
                        totalCount={timeline?.totalCount ?? 0}
                        filters={timelineFilters}
                        onFiltersChange={setTimelineFilters}
                    />
                )}
            </motion.div>

            {/* Alert Thresholds */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                {thresholdsLoading ? (
                    <div className="h-40 rounded-lg bg-gray-50 animate-pulse" />
                ) : thresholds ? (
                    <AlertThresholdEditor
                        thresholds={thresholds}
                        onSave={(data) => updateThresholds.mutate(data)}
                        isSaving={updateThresholds.isPending}
                    />
                ) : null}
            </motion.div>
        </div>
    );
}
