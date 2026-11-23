/**
 * Monitoring type definitions
 *
 * Types matching the 5 backend monitoring endpoints:
 * - GET /swarm/health
 * - GET /swarm/timeline
 * - GET /swarm/alerts/thresholds
 * - PUT /swarm/alerts/thresholds
 * - GET /swarm/monitoring/status
 */

export interface SubsystemStats {
    available: boolean;
    error?: string;
    [key: string]: unknown;
}

export interface SwarmHealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    subsystemsAvailable: number;
    subsystemsTotal: number;
    leaseExpiration: SubsystemStats | null;
    resultBuffer: SubsystemStats | null;
    partitionDetection: SubsystemStats | null;
    nodeCrashDetection: SubsystemStats | null;
    leaseRevocation: SubsystemStats | null;
    duplicatePrevention: SubsystemStats | null;
    ipPool: SubsystemStats | null;
    messageVerification: SubsystemStats | null;
}

export interface TimelineEvent {
    eventType: string;
    taskId: string | null;
    peerId: string | null;
    timestamp: string;
    metadata: Record<string, unknown>;
}

export interface TimelineResponse {
    events: TimelineEvent[];
    totalCount: number;
    limit: number;
    offset: number;
}

export interface TimelineFilters {
    taskId?: string;
    peerId?: string;
    eventType?: string;
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
}

export interface AlertThresholds {
    bufferUtilization: number;
    crashCount: number;
    revocationRate: number;
    ipPoolUtilization: number;
    updatedAt: string;
}

export interface AlertThresholdUpdate {
    bufferUtilization?: number;
    crashCount?: number;
    revocationRate?: number;
    ipPoolUtilization?: number;
}

export interface SubsystemAvailability {
    available: boolean;
}

export interface MonitoringStatus {
    status: string;
    timestamp: string;
    subsystems: Record<string, SubsystemAvailability>;
    registeredHealthSubsystems: number;
    timelineEventCount: number;
    bootstrapped: boolean;
}

export interface PrometheusMetricsSnapshot {
    taskAssignmentTotal: number;
    taskAssignmentRejectedTotal: number;
    taskResultSubmittedTotal: number;
    taskResultDuplicateTotal: number;
    taskResultInvalidTotal: number;
    taskRequeuedTotal: number;
    leaseIssuedTotal: number;
    leaseExpiredTotal: number;
    leaseRevokedTotal: number;
    activeLeasesCount: number;
    nodeCrashDetectedTotal: number;
    partitionDetectedTotal: number;
    recoveryTriggeredTotal: number;
    bufferSize: number;
    bufferUtilizationPercent: number;
    partitionDegraded: number;
    recoveryDurationSeconds: number;
    buildInfo: { version: string; commit: string } | null;
}

/**
 * Agent monitoring dashboard types
 *
 * Backing types for components/monitoring/AgentMonitoringDashboard.tsx
 * and the useAgentMonitoring hook.
 */

export type AgentHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

export interface AgentTaskStats {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    avgDurationMs: number;
}

export interface AgentPerformanceStats {
    successRate: number;
    errorRate: number;
    tasksPerHour: number;
    avgResponseTimeMs: number;
}

export interface AgentResourceStats {
    cpuPercent?: number;
    memoryMb?: number;
    memoryPercent?: number;
}

export interface AgentRecentTask {
    taskId: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    durationMs: number;
    description?: string;
}

export interface AgentAlert {
    id: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
}

export interface AgentErrorLogEntry {
    timestamp: string;
    message: string;
    taskId?: string;
}

export interface AgentMetrics {
    agentId: string;
    agentName: string;
    status: AgentHealthStatus;
    uptime: number;
    uptimePercent: number;
    lastSeenAt: string;
    tasks: AgentTaskStats;
    performance: AgentPerformanceStats;
    resources?: AgentResourceStats;
    recentTasks: AgentRecentTask[];
    alerts: AgentAlert[];
    errorLog: AgentErrorLogEntry[];
}

export interface AgentMonitoringResponse {
    timestamp: string;
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    offlineAgents: number;
    agents: AgentMetrics[];
}

/**
 * Task dependency graph types
 *
 * Backing types for components/monitoring/TaskDependencyGraph.tsx
 */

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed';

export interface Task {
    id: string;
    name: string;
    status: TaskStatus;
    dependencies: string[];
    dependents: string[];
    createdAt: string;
}

export interface TaskGraphNode {
    id: string;
    name: string;
    status: TaskStatus;
    val: number;
    color: string;
}

export interface TaskGraphLink {
    source: string;
    target: string;
    color: string;
}

export interface TaskGraphData {
    nodes: TaskGraphNode[];
    links: TaskGraphLink[];
}

/**
 * TDD cycle status indicator types
 *
 * Backing types for components/monitoring/TddCycleStatusIndicator.tsx
 */

export type TddCyclePhase = 'idle' | 'writing_tests' | 'red' | 'green' | 'refactoring';

export interface TddCycleStatus {
    phase: TddCyclePhase;
    label: string;
    description: string;
    testsPassing: number;
    testsFailing: number;
    testsTotal: number;
    coveragePercent: number;
    timestamp: string;
}
