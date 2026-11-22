/**
 * Network type definitions
 *
 * Types matching the backend network management endpoints:
 * - GET /api/v1/network/peers
 * - GET /api/v1/network/peers/{id}/quality
 * - POST /api/v1/network/peers/{id}/provision-qr
 * - GET /api/v1/network/ip-pool
 * - GET /api/v1/network/topology
 */

export interface PeerInfo {
    id: string;
    nodeId: string;
    ipAddress: string;
    publicKey: string;
    wireguardPublicKey: string;
    status: 'online' | 'offline' | 'degraded';
    lastSeen: string;
    capabilities: NodeCapabilities;
    version: string;
    endpoint?: string;
}

export interface NodeCapabilities {
    gpu: boolean;
    cpu: number;
    memory: number;
    storage?: number;
}

export interface PeerQuality {
    peerId: string;
    latency: number;
    packetLoss: number;
    jitter: number;
    bandwidth: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    lastUpdated: string;
}

export interface QRCodeData {
    peerId: string;
    qrCodeData: string;
    wireguardConfig: string;
    expiresAt: string;
}

export interface IPPoolStats {
    totalIps: number;
    allocatedIps: number;
    availableIps: number;
    utilizationPercent: number;
    poolRange: string;
    allocations: IPAllocation[];
}

export interface IPAllocation {
    ipAddress: string;
    peerId: string;
    allocatedAt: string;
}

export interface NetworkTopology {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    hubNode: NetworkNode;
}

export interface NetworkNode {
    id: string;
    label: string;
    type: 'hub' | 'peer';
    status: 'online' | 'offline' | 'degraded';
    capabilities?: NodeCapabilities;
    ipAddress?: string;
}

export interface NetworkEdge {
    source: string;
    target: string;
    latency: number;
    status: 'healthy' | 'degraded' | 'offline';
    bandwidth?: number;
}

export interface PeerListResponse {
    peers: PeerInfo[];
    totalCount: number;
}
