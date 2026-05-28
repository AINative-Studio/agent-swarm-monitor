'use client';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { TaskStats } from '@/types/tasks';

interface TaskStatsChartProps {
    stats: TaskStats | null;
    isLoading?: boolean;
}

const PRIORITY_COLORS = {
    LOW: '#9CA3AF',
    NORMAL: '#3B82F6',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
};

const STATUS_COLORS = [
    '#3B82F6',
    '#A855F7',
    '#F59E0B',
    '#10B981',
    '#EF4444',
    '#F97316',
    '#6B7280',
];

export default function TaskStatsChart({ stats, isLoading }: TaskStatsChartProps) {
    if (isLoading || !stats) {
        return (
            <div className="space-y-6">
                <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
                    <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
                </div>
            </div>
        );
    }

    const statusData = Object.entries(stats?.tasksByStatus ?? {}).map(([status, count]) => ({
        name: status,
        value: count,
    }));

    const timeSeriesData = (stats?.queueDepthTimeSeries ?? []).map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
        count: point.count,
    }));

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-[#E8E6E1] p-5 bg-white">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Queue Depth Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E8E6E1',
                                borderRadius: '6px',
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            name="Tasks in Queue"
                            dot={{ fill: '#3B82F6', r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#E8E6E1] p-5 bg-white">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    name + ' (' + ((percent || 0) * 100).toFixed(0) + '%)'
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={'cell-' + index}
                                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-lg border border-[#E8E6E1] p-5 bg-white">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.tasksByPriority ?? []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
                            <XAxis dataKey="priority" tick={{ fontSize: 12 }} stroke="#6B7280" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #E8E6E1',
                                    borderRadius: '6px',
                                }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {(stats.tasksByPriority ?? []).map((entry) => (
                                    <Cell
                                        key={entry.priority}
                                        fill={PRIORITY_COLORS[entry.priority]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {(stats.tasksByType ?? []).length > 0 && (
                    <div className="rounded-lg border border-[#E8E6E1] p-5 bg-white md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Type</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.tasksByType ?? []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
                                <XAxis dataKey="taskType" tick={{ fontSize: 12 }} stroke="#6B7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E8E6E1',
                                        borderRadius: '6px',
                                    }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                        Total Tasks
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalTasks ?? 0}</div>
                </div>
                <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                        Success Rate
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.successRate != null ? (stats.successRate * 100).toFixed(1) + '%' : '-'}
                    </div>
                </div>
                <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                        Avg Execution Time
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.averageExecutionTimeSeconds != null
                            ? stats.averageExecutionTimeSeconds.toFixed(1) + 's'
                            : '-'}
                    </div>
                </div>
                <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                        Avg Retry Count
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.averageRetryCount != null ? stats.averageRetryCount.toFixed(2) : '-'}
                    </div>
                </div>
            </div>
        </div>
    );
}
