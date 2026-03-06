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

    async sendMessage(agentId: string, data: { message: string }): Promise<any> {
        return apiClient.post(`${this.basePath}/${agentId}/message`, data);
    }

    async getSkills(): Promise<any> {
        return apiClient.get('/skills');
    }

    async configureSkill(
        agentId: string,
        skillName: string,
        data: { api_key: string; enabled: boolean }
    ): Promise<any> {
        return apiClient.post(`${this.basePath}/${agentId}/skills/${skillName}/configure`, data);
    }

    async installSkill(skillName: string): Promise<any> {
        return apiClient.post(`/skills/${skillName}/install`);
    }

    async getSkillInstallationStatus(skillName: string): Promise<any> {
        return apiClient.get(`/skills/${skillName}/installation-status`);
    }

    // Channel Management
    async getAvailableChannels(): Promise<any> {
        // Use longer timeout - this command can take 15-20 seconds
        return apiClient.get('/openclaw/channels/available', undefined, 45000);
    }

    async getConfiguredChannels(): Promise<any> {
        return apiClient.get('/openclaw/channels/configured');
    }

    async getAgentChannels(agentId: string): Promise<any> {
        return apiClient.get(`/openclaw/channels/agents/${agentId}/channels`);
    }

    async getChannelStatus(channel: string, accountId: string = 'default'): Promise<any> {
        return apiClient.get(`/openclaw/channels/${channel}/status`, { account_id: accountId });
    }

    async getChannelAuthInstructions(channel: string): Promise<any> {
        return apiClient.get(`/openclaw/channels/${channel}/auth-instructions`);
    }

    async addChannelBotToken(data: {
        channel: string;
        token: string;
        account_id?: string;
        name?: string;
    }): Promise<any> {
        return apiClient.post('/openclaw/channels/add/bot-token', data);
    }

    async addChannelSlack(data: {
        bot_token: string;
        app_token: string;
        account_id?: string;
        name?: string;
    }): Promise<any> {
        return apiClient.post('/openclaw/channels/add/slack', data);
    }

    async loginChannel(data: {
        channel: string;
        account_id?: string;
        verbose?: boolean;
    }): Promise<any> {
        // Use longer timeout for login (QR code generation, etc.)
        return apiClient.post('/openclaw/channels/login', data, 60000);
    }

    async logoutChannel(channel: string, accountId: string = 'default'): Promise<any> {
        return apiClient.post('/openclaw/channels/logout', null, { channel, account_id: accountId });
    }

    async removeChannel(channel: string, accountId: string = 'default'): Promise<any> {
        return apiClient.delete('/openclaw/channels/remove', { channel, account_id: accountId });
    }
}

const openClawService = new OpenClawService();
export default openClawService;
