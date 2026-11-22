export type TaskStatus =
    | 'QUEUED'
    | 'LEASED'
    | 'RUNNING'
    | 'COMPLETED'
    | 'FAILED'
    | 'EXPIRED'
    | 'PERMANENTLY_FAILED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type TaskType = string;

export interface Task {
    id: string;
    taskId: string;
    taskType: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    payload: Record<string, unknown>;
    requiredCapabilities: Record<string, unknown> | null;
    assignedPeerId: string | null;
    result: Record<string, unknown> | null;
    errorMessage: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}

export interface TaskQueueFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    taskType?: TaskType;
    assignedPeerId?: string;
    limit?: number;
    offset?: number;
}

export interface TaskQueueResponse {
    tasks: Task[];
    totalCount: number;
    limit: number;
    offset: number;
}

export interface TaskHistoryEvent {
    id: string;
    taskId: string;
    eventType: string;
    timestamp: string;
    peerId: string | null;
    details: Record<string, unknown>;
}

export interface TaskHistoryResponse {
    events: TaskHistoryEvent[];
    totalCount: number;
}

export interface ActiveLease {
    id: string;
    taskId: string;
    peerId: string;
    leaseToken: string;
    expiresAt: string;
    isExpired: boolean;
    isRevoked: boolean;
    isActive: boolean;
    heartbeatCount: number;
    lastHeartbeatAt: string | null;
    taskComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    updatedAt: string;
}

export interface ActiveLeasesResponse {
    leases: ActiveLease[];
    totalCount: number;
}

export interface TaskTypeStats {
    taskType: TaskType;
    count: number;
}

export interface PriorityStats {
    priority: TaskPriority;
    count: number;
}

export interface QueueDepthDataPoint {
    timestamp: string;
    count: number;
}

export interface TaskStats {
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    tasksByPriority: PriorityStats[];
    tasksByType: TaskTypeStats[];
    queueDepthTimeSeries: QueueDepthDataPoint[];
    averageExecutionTimeSeconds: number | null;
    averageRetryCount: number | null;
    successRate: number | null;
}
