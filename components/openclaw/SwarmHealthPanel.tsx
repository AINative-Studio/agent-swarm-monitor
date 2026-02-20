'use client';

import type { SwarmHealthResponse, SubsystemStats } from '@/types/monitoring';

const SUBSYSTEM_LABELS: Record<string, string> = {
    leaseExpiration: 'Lease Expiration',
    resultBuffer: 'Result Buffer',
    partitionDetection: 'Partition Detection',
    nodeCrashDetection: 'Node Crash Detection',
    leaseRevocation: 'Lease Revocation',
    duplicatePrevention: 'Duplicate Prevention',
    ipPool: 'IP Pool',
    messageVerification: 'Message Verification',
};

const SUBSYSTEM_KEYS = Object.keys(SUBSYSTEM_LABELS) as Array<keyof typeof SUBSYSTEM_LABELS>;

function getMetricEntries(stats: SubsystemStats): Array<[string, string | number | boolean]> {
    const skip = new Set(['available', 'error']);
    return Object.entries(stats)
        .filter(([key]) => !skip.has(key))
        .slice(0, 3)
        .map(([key, value]) => {
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (s) => s.toUpperCase())
                .trim();
            return [label, value as string | number | boolean];
        });
}

interface SubsystemCardProps {
    name: string;
    stats: SubsystemStats | null;
}

function SubsystemCard({ name, stats }: SubsystemCardProps) {
    const isAvailable = stats?.available ?? false;

    return (
        <div className="rounded-lg border border-[#E8E6E1] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isAvailable
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    />
                    {isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </div>
            {stats && isAvailable ? (
                <div className="space-y-1">
                    {getMetricEntries(stats).map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-gray-900">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : stats?.error ? (
                <p className="text-xs text-red-600">{stats.error}</p>
            ) : (
                <p className="text-xs text-gray-400">No data</p>
            )}
        </div>
    );
}

interface SwarmHealthPanelProps {
    health: SwarmHealthResponse;
}

export default function SwarmHealthPanel({ health }: SwarmHealthPanelProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSYSTEM_KEYS.map((key) => (
                <SubsystemCard
                    key={key}
                    name={SUBSYSTEM_LABELS[key]}
                    stats={health[key as keyof SwarmHealthResponse] as SubsystemStats | null}
                />
            ))}
        </div>
    );
}
