import apiClient from './api-client';
import type {
    TaskQueueResponse,
    TaskQueueFilters,
    Task,
    TaskHistoryResponse,
    ActiveLeasesResponse,
    TaskStats,
    TaskPriority,
} from '@/types/tasks';

export interface TaskCreateRequest {
    taskType: string;
    priority: TaskPriority;
    payload: Record<string, unknown>;
    requiredCapabilities: Record<string, unknown> | null;
    maxRetries: number;
}

export interface PeerNode {
    id: string;
    peerId: string;
    name: string;
    capabilities: Record<string, unknown>;
    isOnline: boolean;
    currentLoad: number;
}

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

    async createTask(data: TaskCreateRequest): Promise<Task> {
        return apiClient.post<Task>('/tasks', data);
    }

    async assignTask(taskId: string, peerId: string): Promise<Task> {
        return apiClient.post<Task>(`/tasks/${taskId}/assign`, { peerId });
    }

    async getAvailablePeers(): Promise<PeerNode[]> {
        return apiClient.get<PeerNode[]>('/tasks/peers');
    }
}

const taskService = new TaskService();
export default taskService;
