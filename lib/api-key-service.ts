/**
 * API Key Management Service
 *
 * Handles all API key operations against the backend
 */

import apiClient from './api-client';
import type {
  ApiKeyListResponse,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  VerifyApiKeyResponse,
  ServiceName,
} from '@/types/api-keys';

class ApiKeyService {
  private basePath = '/api-keys';

  async listKeys(): Promise<ApiKeyListResponse> {
    return apiClient.get<ApiKeyListResponse>(this.basePath);
  }

  async createKey(data: CreateApiKeyRequest): Promise<void> {
    return apiClient.post<void>(this.basePath, data);
  }

  async updateKey(serviceName: ServiceName, data: UpdateApiKeyRequest): Promise<void> {
    return apiClient.put<void>(`${this.basePath}/${serviceName}`, data);
  }

  async deleteKey(serviceName: ServiceName): Promise<void> {
    return apiClient.delete(`${this.basePath}/${serviceName}`);
  }

  async verifyKey(serviceName: ServiceName): Promise<VerifyApiKeyResponse> {
    return apiClient.get<VerifyApiKeyResponse>(`${this.basePath}/${serviceName}/verify`);
  }
}

const apiKeyService = new ApiKeyService();
export default apiKeyService;
