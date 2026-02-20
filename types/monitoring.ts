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
