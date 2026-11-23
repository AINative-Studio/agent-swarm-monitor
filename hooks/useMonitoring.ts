import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import monitoringService from '@/lib/monitoring-service';
import type {
    TimelineFilters,
    AlertThresholdUpdate,
    AgentMonitoringResponse,
} from '@/types/monitoring';

// TODO: Replace with real API call to GET /swarm/agents/monitoring (or equivalent)
const MOCK_AGENT_MONITORING_DATA: AgentMonitoringResponse = {
    timestamp: new Date().toISOString(),
    totalAgents: 3,
    healthyAgents: 2,
    degradedAgents: 1,
    unhealthyAgents: 0,
    offlineAgents: 0,
    agents: [
        {
            agentId: 'agent-1',
            agentName: 'Customer Support Agent',
            status: 'healthy',
            uptime: 86400000,
            uptimePercent: 99.8,
            lastSeenAt: new Date().toISOString(),
            tasks: {
                total: 1500,
                successful: 1480,
                failed: 15,
                pending: 5,
                avgDurationMs: 2500,
            },
            performance: {
                successRate: 98.67,
                errorRate: 1.0,
                tasksPerHour: 62.5,
                avgResponseTimeMs: 2500,
            },
            resources: {
                cpuPercent: 35.5,
                memoryMb: 512,
                memoryPercent: 25.6,
            },
            recentTasks: [
                {
                    taskId: 'task-1',
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    durationMs: 2300,
                    description: 'Handle customer inquiry',
                },
            ],
            alerts: [],
            errorLog: [],
        },
        {
            agentId: 'agent-2',
            agentName: 'Sales Outreach Agent',
            status: 'degraded',
            uptime: 82800000,
            uptimePercent: 95.5,
            lastSeenAt: new Date().toISOString(),
            tasks: {
                total: 500,
                successful: 450,
                failed: 40,
                pending: 10,
                avgDurationMs: 3500,
            },
            performance: {
                successRate: 90.0,
                errorRate: 8.0,
                tasksPerHour: 20.8,
                avgResponseTimeMs: 3500,
            },
            resources: {
                cpuPercent: 65.2,
                memoryMb: 768,
                memoryPercent: 38.4,
            },
            recentTasks: [
                {
                    taskId: 'task-3',
                    timestamp: new Date().toISOString(),
                    status: 'error',
                    durationMs: 5000,
                    description: 'Send outreach email',
                },
            ],
            alerts: [
                {
                    id: 'alert-2',
                    severity: 'error',
                    message: 'Error rate above threshold',
                    timestamp: new Date().toISOString(),
                    resolved: false,
                },
            ],
            errorLog: [
                {
                    timestamp: new Date().toISOString(),
                    message: 'API rate limit exceeded',
                    taskId: 'task-3',
                },
            ],
        },
        {
            agentId: 'agent-3',
            agentName: 'DevOps Agent',
            status: 'healthy',
            uptime: 90000000,
            uptimePercent: 100.0,
            lastSeenAt: new Date().toISOString(),
            tasks: {
                total: 800,
                successful: 795,
                failed: 5,
                pending: 0,
                avgDurationMs: 1500,
            },
            performance: {
                successRate: 99.38,
                errorRate: 0.63,
                tasksPerHour: 33.3,
                avgResponseTimeMs: 1500,
            },
            resources: {
                cpuPercent: 12.5,
                memoryMb: 256,
                memoryPercent: 12.8,
            },
            recentTasks: [
                {
                    taskId: 'task-4',
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    durationMs: 1400,
                    description: 'Deploy to staging',
                },
            ],
            alerts: [],
            errorLog: [],
        },
    ],
};

export function useSwarmHealth() {
    return useQuery({
        queryKey: ['swarm-health'],
        queryFn: () => monitoringService.getSwarmHealth(),
        refetchInterval: 10000,
    });
}

export function useTimeline(filters?: TimelineFilters) {
    return useQuery({
        queryKey: ['swarm-timeline', filters],
        queryFn: () => monitoringService.getTimeline(filters),
        refetchInterval: 10000,
    });
}

export function useAlertThresholds() {
    return useQuery({
        queryKey: ['alert-thresholds'],
        queryFn: () => monitoringService.getAlertThresholds(),
    });
}

export function useUpdateAlertThresholds() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AlertThresholdUpdate) =>
            monitoringService.updateAlertThresholds(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
        },
    });
}

export function useMonitoringStatus() {
    return useQuery({
        queryKey: ['monitoring-status'],
        queryFn: () => monitoringService.getMonitoringStatus(),
        refetchInterval: 30000,
    });
}

export function usePrometheusMetrics() {
    return useQuery({
        queryKey: ['prometheus-metrics'],
        queryFn: () => monitoringService.getPrometheusMetrics(),
        refetchInterval: 15000,
    });
}

export function useAgentMonitoring() {
    return useQuery({
        queryKey: ['agent-monitoring'],
        // TODO: Replace with real API call, e.g. monitoringService.getAgentMonitoring()
        queryFn: () => Promise.resolve(MOCK_AGENT_MONITORING_DATA),
        refetchInterval: 10000,
    });
}
