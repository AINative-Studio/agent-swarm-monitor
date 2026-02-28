'use client';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PrometheusMetricsSnapshot } from '@/types/monitoring';

interface MetricsChartProps {
    metrics: PrometheusMetricsSnapshot;
    type?: 'line' | 'bar';
    height?: number;
}

export default function MetricsChart({ metrics, height = 300 }: MetricsChartProps) {
    const chartData = useMemo(() => [
        { name: 'Task Ops', Assignments: metrics.taskAssignmentTotal, Rejected: metrics.taskAssignmentRejectedTotal, Submitted: metrics.taskResultSubmittedTotal, Requeued: metrics.taskRequeuedTotal },
        { name: 'Lease Ops', Issued: metrics.leaseIssuedTotal, Expired: metrics.leaseExpiredTotal, Revoked: metrics.leaseRevokedTotal, Active: metrics.activeLeasesCount },
        { name: 'Results', Submitted: metrics.taskResultSubmittedTotal, Duplicates: metrics.taskResultDuplicateTotal, Invalid: metrics.taskResultInvalidTotal },
        { name: 'System', Crashes: metrics.nodeCrashDetectedTotal, Partitions: metrics.partitionDetectedTotal, Recoveries: metrics.recoveryTriggeredTotal },
    ], [metrics]);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Counter Metrics</h3>
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Assignments" fill="#3b82f6" />
                        <Bar dataKey="Rejected" fill="#ef4444" />
                        <Bar dataKey="Issued" fill="#10b981" />
                        <Bar dataKey="Expired" fill="#f59e0b" />
                        <Bar dataKey="Submitted" fill="#8b5cf6" />
                        <Bar dataKey="Requeued" fill="#ec4899" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Task Assignments" value={metrics.taskAssignmentTotal} color="blue" />
                <MetricCard label="Active Leases" value={metrics.activeLeasesCount} color="green" />
                <MetricCard label="Buffer%" value={Math.round(metrics.bufferUtilizationPercent)} color={metrics.bufferUtilizationPercent > 80 ? 'red' : 'green'} />
                <MetricCard label="Node Crashes" value={metrics.nodeCrashDetectedTotal} color={metrics.nodeCrashDetectedTotal > 0 ? 'red' : 'gray'} />
            </div>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
        <div className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.gray}`}>
            <div className="text-xs font-medium opacity-75">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
    );
}
