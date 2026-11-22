import apiClient from './api-client';
import type {
    SwarmHealthResponse,
    TimelineResponse,
    TimelineFilters,
    AlertThresholds,
    AlertThresholdUpdate,
    MonitoringStatus,
    PrometheusMetricsSnapshot,
} from '@/types/monitoring';
import { parsePrometheusMetrics, getMetricValue } from './prometheus-parser';

class MonitoringService {
    async getSwarmHealth(): Promise<SwarmHealthResponse> {
        return apiClient.get<SwarmHealthResponse>('/swarm/health');
    }

    async getTimeline(filters?: TimelineFilters): Promise<TimelineResponse> {
        const params: Record<string, string> = {};
        if (filters?.taskId) params.task_id = filters.taskId;
        if (filters?.peerId) params.peer_id = filters.peerId;
        if (filters?.eventType) params.event_type = filters.eventType;
        if (filters?.since) params.since = filters.since;
        if (filters?.until) params.until = filters.until;
        if (filters?.limit !== undefined) params.limit = String(filters.limit);
        if (filters?.offset !== undefined) params.offset = String(filters.offset);
        return apiClient.get<TimelineResponse>('/swarm/timeline', params);
    }

    async getAlertThresholds(): Promise<AlertThresholds> {
        return apiClient.get<AlertThresholds>('/swarm/alerts/thresholds');
    }

    async updateAlertThresholds(data: AlertThresholdUpdate): Promise<AlertThresholds> {
        return apiClient.put<AlertThresholds>('/swarm/alerts/thresholds', data);
    }

    async getMonitoringStatus(): Promise<MonitoringStatus> {
        return apiClient.get<MonitoringStatus>('/swarm/monitoring/status');
    }

    async getPrometheusMetrics(): Promise<PrometheusMetricsSnapshot> {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/../metrics`;
        const response = await fetch(url.replace('/api/v1/../', '/'));
        const text = await response.text();
        const parsed = parsePrometheusMetrics(text);
        const m = parsed.metrics;
        const v = (name: string) => getMetricValue(m, name) ?? 0;
        return {
            taskAssignmentTotal: v('openclaw_task_assignment'),
            taskAssignmentRejectedTotal: v('openclaw_task_assignment_rejected'),
            taskResultSubmittedTotal: v('openclaw_task_result_submitted'),
            taskResultDuplicateTotal: v('openclaw_task_result_duplicate'),
            taskResultInvalidTotal: v('openclaw_task_result_invalid'),
            taskRequeuedTotal: v('openclaw_task_requeued'),
            leaseIssuedTotal: v('openclaw_lease_issued'),
            leaseExpiredTotal: v('openclaw_lease_expired'),
            leaseRevokedTotal: v('openclaw_lease_revoked'),
            activeLeasesCount: v('openclaw_active_leases'),
            nodeCrashDetectedTotal: v('openclaw_node_crash_detected'),
            partitionDetectedTotal: v('openclaw_partition_detected'),
            recoveryTriggeredTotal: v('openclaw_recovery_triggered'),
            bufferSize: v('openclaw_buffer_size'),
            bufferUtilizationPercent: v('openclaw_buffer_utilization_percent'),
            partitionDegraded: v('openclaw_partition_degraded'),
            recoveryDurationSeconds: v('openclaw_recovery_duration_seconds'),
            buildInfo: m['openclaw_build_info'] ? { version: m['openclaw_build_info'].values[0]?.labels?.version ?? '', commit: m['openclaw_build_info'].values[0]?.labels?.commit ?? '' } : null,
        };
    }
}

const monitoringService = new MonitoringService();
export default monitoringService;
