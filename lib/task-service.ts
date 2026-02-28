import apiClient from './api-client';
import type {
    TaskQueueResponse,
    TaskQueueFilters,
    Task,
    TaskHistoryResponse,
    ActiveLeasesResponse,
    TaskStats,
} from '@/types/tasks';

class TaskService {
    async getTaskQueue(filters?: TaskQueueFilters): Promise<TaskQueueResponse> {
        const params: Record<string, string> = {};
        if (filters?.status) params.status = filters.status;
        if (filters?.priority) params.priority = filters.priority;
        if (filters?.taskType) params.task_type = filters.taskType;
        if (filters?.assignedPeerId) params.assigned_peer_id = filters.assignedPeerId;
        if (filters?.limit !== undefined) params.limit = String(filters.limit);
        if (filters?.offset !== undefined) params.offset = String(filters.offset);
        return apiClient.get<TaskQueueResponse>('/tasks/queue', params);
    }

    async getTaskDetails(taskId: string): Promise<Task> {
        return apiClient.get<Task>(`/tasks/${taskId}`);
    }

    async getTaskHistory(taskId: string): Promise<TaskHistoryResponse> {
        return apiClient.get<TaskHistoryResponse>(`/tasks/${taskId}/history`);
    }

    async getActiveLeases(): Promise<ActiveLeasesResponse> {
        return apiClient.get<ActiveLeasesResponse>('/tasks/active-leases');
    }

    async getTaskStats(): Promise<TaskStats> {
        return apiClient.get<TaskStats>('/tasks/stats');
    }
}

const taskService = new TaskService();
export default taskService;
