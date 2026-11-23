'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    TrendingUp,
    TrendingDown,
    Clock,
    Cpu,
    MemoryStick,
    Filter,
    ArrowUpDown,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import { useAgentMonitoring } from '@/hooks/useMonitoring';
import { Badge } from '@/components/ui/badge';
import { fadeUp } from '@/lib/openclaw-utils';
import type { AgentHealthStatus, AgentMetrics, AgentAlert, AgentRecentTask, AgentErrorLogEntry } from '@/types/monitoring';

const STATUS_COLORS: Record<AgentHealthStatus, string> = {
    healthy: 'bg-green-50 text-green-700 border-green-200',
    degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    unhealthy: 'bg-red-50 text-red-700 border-red-200',
    offline: 'bg-gray-50 text-gray-700 border-gray-200',
};

const SEVERITY_COLORS = {
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function formatUptime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
}

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
}

export default function AgentMonitoringDashboard() {
    const { data, isLoading, error } = useAgentMonitoring();
    const [statusFilter, setStatusFilter] = useState<AgentHealthStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'successRate' | 'uptime' | 'tasks'>('name');

    const filteredAndSortedAgents = useMemo(() => {
        if (!data?.agents) return [];

        let filtered = [...data.agents];

        if (statusFilter !== 'all') {
            filtered = filtered.filter((agent) => agent.status === statusFilter);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'successRate':
                    return b.performance.successRate - a.performance.successRate;
                case 'uptime':
                    return b.uptimePercent - a.uptimePercent;
                case 'tasks':
                    return b.tasks.total - a.tasks.total;
                case 'name':
                default:
                    return a.agentName.localeCompare(b.agentName);
            }
        });

        return filtered;
    }, [data?.agents, statusFilter, sortBy]);

    const performanceChartData = useMemo(() => {
        if (!data?.agents) return [];
        return data.agents.map((agent: AgentMetrics) => ({
            name: agent.agentName.split(' ')[0],
            successRate: agent.performance.successRate,
            errorRate: agent.performance.errorRate,
            tasksPerHour: agent.performance.tasksPerHour,
            avgResponseTime: agent.performance.avgResponseTimeMs / 1000,
        }));
    }, [data?.agents]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-lg bg-gray-50 animate-pulse" />
                    ))}
                </div>
                <div className="h-96 rounded-lg bg-gray-50 animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring</h1>
                <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    <p className="font-semibold mb-1">Failed to load agent monitoring data</p>
                    <p className="text-xs">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data || data.totalAgents === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring</h1>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-12 text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">No agents found</p>
                    <p className="text-xs text-gray-500 mt-1">Create agents to start monitoring</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Real-time agent metrics and performance
                        </p>
                    </div>
                    <div className="text-xs text-gray-500">
                        Last updated: {formatTimestamp(data.timestamp)}
                    </div>
                </div>
            </motion.div>

            <motion.section
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                aria-label="Summary"
                role="region"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Agents</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalAgents}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700">Healthy</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{data.healthyAgents}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-700">Degraded</p>
                            <p className="text-2xl font-bold text-yellow-900 mt-1">
                                {data.degradedAgents}
                            </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700">Unhealthy</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">
                                {data.unhealthyAgents + data.offlineAgents}
                            </p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>
            </motion.section>

            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Success Rate</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={performanceChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="successRate" fill="#10b981" aria-label="Success rate chart" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Error Rate</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={performanceChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="errorRate" fill="#ef4444" aria-label="Error rate chart" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Tasks per Hour</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={performanceChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="tasksPerHour"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    aria-label="Tasks per hour chart"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">
                            Response Time (seconds)
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={performanceChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="avgResponseTime"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    aria-label="Response time chart"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                aria-label="Filter by status"
                                role="combobox"
                            >
                                <option value="all">All Status</option>
                                <option value="healthy">Healthy</option>
                                <option value="degraded">Degraded</option>
                                <option value="unhealthy">Unhealthy</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            <select
                                className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                aria-label="Sort agents"
                                role="combobox"
                            >
                                <option value="name">Name</option>
                                <option value="successRate">Success Rate</option>
                                <option value="uptime">Uptime</option>
                                <option value="tasks">Tasks</option>
                            </select>
                        </div>
                    </div>
                </div>

                <section
                    aria-label="Agents list"
                    role="region"
                    className="flex flex-col md:grid md:grid-cols-1 gap-4"
                >
                    {filteredAndSortedAgents.map((agent: AgentMetrics) => (
                        <AgentCard key={agent.agentId} agent={agent} />
                    ))}
                </section>
            </motion.div>
        </div>
    );
}

function AgentCard({ agent }: { agent: AgentMetrics }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{agent.agentName}</h3>
                        <Badge className={STATUS_COLORS[agent.status]}>{agent.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Uptime: {agent.uptimePercent.toFixed(1)}%</span>
                        <span>Tasks: {agent.tasks.total}</span>
                        <span>Last seen: {formatTimestamp(agent.lastSeenAt)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Success Rate</span>
                        {agent.performance.successRate > 95 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                        {agent.performance.successRate.toFixed(2)}%
                    </p>
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Error Rate</span>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                        {agent.performance.errorRate.toFixed(2)}%
                    </p>
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Tasks/Hour</span>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                        {agent.performance.tasksPerHour.toFixed(1)}
                    </p>
                </div>
            </div>

            {agent.resources && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {agent.resources.cpuPercent !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                            <Cpu className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">CPU:</span>
                            <span className="font-medium text-gray-900">
                                {agent.resources.cpuPercent.toFixed(1)}%
                            </span>
                        </div>
                    )}
                    {agent.resources.memoryMb !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                            <MemoryStick className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Memory:</span>
                            <span className="font-medium text-gray-900">
                                {agent.resources.memoryMb} MB
                            </span>
                        </div>
                    )}
                </div>
            )}

            {agent.alerts.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Alerts</h4>
                    <div className="space-y-2">
                        {agent.alerts.slice(0, 3).map((alert: AgentAlert) => (
                            <div
                                key={alert.id}
                                className={`rounded-md px-3 py-2 text-sm ${SEVERITY_COLORS[alert.severity]}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{alert.severity}</span>
                                    <span className="text-xs">
                                        {formatTimestamp(alert.timestamp)}
                                    </span>
                                </div>
                                <p className="mt-1">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {agent.recentTasks.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Tasks</h4>
                    <div className="space-y-2">
                        {agent.recentTasks.slice(0, 3).map((task: AgentRecentTask) => (
                            <div
                                key={task.taskId}
                                className="flex items-center justify-between text-sm border-l-2 pl-3 py-1"
                                style={{
                                    borderLeftColor:
                                        task.status === 'success'
                                            ? '#10b981'
                                            : task.status === 'error'
                                            ? '#ef4444'
                                            : '#6b7280',
                                }}
                            >
                                <div className="flex-1">
                                    <p className="text-gray-900 font-medium">
                                        {task.description || task.taskId}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span>{formatTimestamp(task.timestamp)}</span>
                                        <span>{formatDuration(task.durationMs)}</span>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        task.status === 'success'
                                            ? 'bg-green-100 text-green-800'
                                            : task.status === 'error'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }
                                >
                                    {task.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {agent.errorLog.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Error Log</h4>
                    <div className="space-y-1">
                        {agent.errorLog.slice(0, 2).map((error: AgentErrorLogEntry, idx: number) => (
                            <div
                                key={idx}
                                className="text-xs text-red-600 bg-red-50 rounded px-2 py-1"
                            >
                                <span className="font-medium">
                                    {formatTimestamp(error.timestamp)}:
                                </span>{' '}
                                {error.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
