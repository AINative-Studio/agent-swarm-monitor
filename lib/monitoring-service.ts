import apiClient from './api-client';
import type {
    SwarmHealthResponse,
    TimelineResponse,
    TimelineFilters,
    AlertThresholds,
    AlertThresholdUpdate,
    MonitoringStatus,
} from '@/types/monitoring';

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
}

const monitoringService = new MonitoringService();
export default monitoringService;
