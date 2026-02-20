import type {
  OpenClawAgent,
  OpenClawAgentListResponse,
  CreateAgentRequest,
  UpdateAgentSettingsRequest,
} from '@/types/openclaw';
import apiClient from './api-client';

class OpenClawService {
    private basePath = '/agents';

    async listAgents(
        status?: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<OpenClawAgentListResponse> {
        const params: Record<string, string> = {
            limit: String(limit),
            offset: String(offset),
        };
        if (status) params.status = status;
        return apiClient.get<OpenClawAgentListResponse>(this.basePath, params);
    }

    async getAgent(agentId: string): Promise<OpenClawAgent> {
        return apiClient.get<OpenClawAgent>(`${this.basePath}/${agentId}`);
    }

    async createAgent(data: CreateAgentRequest): Promise<OpenClawAgent> {
        return apiClient.post<OpenClawAgent>(this.basePath, data);
    }

    async provisionAgent(agentId: string): Promise<OpenClawAgent> {
        return apiClient.post<OpenClawAgent>(`${this.basePath}/${agentId}/provision`);
    }

    async pauseAgent(agentId: string): Promise<OpenClawAgent> {
        return apiClient.post<OpenClawAgent>(`${this.basePath}/${agentId}/pause`);
    }

    async resumeAgent(agentId: string): Promise<OpenClawAgent> {
        return apiClient.post<OpenClawAgent>(`${this.basePath}/${agentId}/resume`);
    }

    async updateSettings(agentId: string, data: UpdateAgentSettingsRequest): Promise<OpenClawAgent> {
        return apiClient.patch<OpenClawAgent>(`${this.basePath}/${agentId}/settings`, data);
    }

    async deleteAgent(agentId: string): Promise<void> {
        return apiClient.delete(`${this.basePath}/${agentId}`);
    }

    async executeHeartbeat(agentId: string): Promise<{ status: string; message: string }> {
        return apiClient.post<{ status: string; message: string }>(
            `${this.basePath}/${agentId}/heartbeat`
        );
    }
}

const openClawService = new OpenClawService();
export default openClawService;
