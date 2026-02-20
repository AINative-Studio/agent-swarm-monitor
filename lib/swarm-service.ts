import type {
    AgentSwarm,
    AgentSwarmListResponse,
    CreateSwarmRequest,
    UpdateSwarmRequest,
} from '@/types/openclaw';
import apiClient from './api-client';

class SwarmService {
    private basePath = '/swarms';

    async listSwarms(
        status?: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<AgentSwarmListResponse> {
        const params: Record<string, string> = {
            limit: String(limit),
            offset: String(offset),
        };
        if (status) params.status = status;
        return apiClient.get<AgentSwarmListResponse>(this.basePath, params);
    }

    async getSwarm(swarmId: string): Promise<AgentSwarm> {
        return apiClient.get<AgentSwarm>(`${this.basePath}/${swarmId}`);
    }

    async createSwarm(data: CreateSwarmRequest): Promise<AgentSwarm> {
        return apiClient.post<AgentSwarm>(this.basePath, data);
    }

    async updateSwarm(swarmId: string, data: UpdateSwarmRequest): Promise<AgentSwarm> {
        return apiClient.patch<AgentSwarm>(`${this.basePath}/${swarmId}`, data);
    }

    async addAgents(swarmId: string, agentIds: string[]): Promise<AgentSwarm> {
        return apiClient.post<AgentSwarm>(
            `${this.basePath}/${swarmId}/agents`,
            { agentIds }
        );
    }

    async removeAgents(swarmId: string, agentIds: string[]): Promise<AgentSwarm> {
        const response = await fetch(`/api/v1${this.basePath}/${swarmId}/agents`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_ids: agentIds }),
        });
        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const body = await response.json();
                detail = body.detail || detail;
            } catch { /* use default */ }
            throw new Error(detail);
        }
        const data = await response.json();
        const { snakeToCamelKeys } = await import('./api-client');
        return snakeToCamelKeys<AgentSwarm>(data);
    }

    async startSwarm(swarmId: string): Promise<AgentSwarm> {
        return apiClient.post<AgentSwarm>(`${this.basePath}/${swarmId}/start`);
    }

    async pauseSwarm(swarmId: string): Promise<AgentSwarm> {
        return apiClient.post<AgentSwarm>(`${this.basePath}/${swarmId}/pause`);
    }

    async resumeSwarm(swarmId: string): Promise<AgentSwarm> {
        return apiClient.post<AgentSwarm>(`${this.basePath}/${swarmId}/resume`);
    }

    async stopSwarm(swarmId: string): Promise<void> {
        return apiClient.delete(`${this.basePath}/${swarmId}`);
    }
}

const swarmService = new SwarmService();
export default swarmService;
