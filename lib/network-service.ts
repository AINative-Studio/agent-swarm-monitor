import apiClient from './api-client';
import type {
    PeerListResponse,
    PeerQuality,
    QRCodeData,
    IPPoolStats,
    NetworkTopology,
} from '@/types/network';

class NetworkService {
    async getPeers(): Promise<PeerListResponse> {
        return apiClient.get<PeerListResponse>('/network/peers');
    }

    async getPeerQuality(peerId: string): Promise<PeerQuality> {
        return apiClient.get<PeerQuality>(`/network/peers/${peerId}/quality`);
    }

    async generateProvisionQR(peerId: string): Promise<QRCodeData> {
        return apiClient.post<QRCodeData>(`/network/peers/${peerId}/provision-qr`);
    }

    async getIPPoolStats(): Promise<IPPoolStats> {
        return apiClient.get<IPPoolStats>('/network/ip-pool');
    }

    async getNetworkTopology(): Promise<NetworkTopology> {
        return apiClient.get<NetworkTopology>('/network/topology');
    }
}

const networkService = new NetworkService();
export default networkService;
