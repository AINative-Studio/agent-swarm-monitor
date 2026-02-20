import type {
    OpenClawTemplate,
    TemplateListResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest,
} from '@/types/openclaw';
import apiClient from './api-client';

class TemplateService {
    private basePath = '/templates';

    async listTemplates(
        category?: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<TemplateListResponse> {
        const params: Record<string, string> = {
            limit: String(limit),
            offset: String(offset),
        };
        if (category) params.category = category;
        return apiClient.get<TemplateListResponse>(this.basePath, params);
    }

    async getTemplate(templateId: string): Promise<OpenClawTemplate> {
        return apiClient.get<OpenClawTemplate>(`${this.basePath}/${templateId}`);
    }

    async createTemplate(data: CreateTemplateRequest): Promise<OpenClawTemplate> {
        return apiClient.post<OpenClawTemplate>(this.basePath, data);
    }

    async updateTemplate(
        templateId: string,
        data: UpdateTemplateRequest
    ): Promise<OpenClawTemplate> {
        return apiClient.patch<OpenClawTemplate>(
            `${this.basePath}/${templateId}`,
            data
        );
    }

    async deleteTemplate(templateId: string): Promise<void> {
        return apiClient.delete(`${this.basePath}/${templateId}`);
    }

    async seedTemplates(): Promise<TemplateListResponse> {
        return apiClient.post<TemplateListResponse>(`${this.basePath}/seed`);
    }
}

const templateService = new TemplateService();
export default templateService;
