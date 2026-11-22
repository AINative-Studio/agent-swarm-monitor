/**
 * API Key Management Types
 */

export type ServiceName = 'anthropic' | 'openai' | 'cohere' | 'huggingface';

export interface ApiKey {
  serviceName: ServiceName;
  keyValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyListResponse {
  keys: Array<{
    serviceName: ServiceName;
    maskedKey: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface CreateApiKeyRequest {
  serviceName: ServiceName;
  keyValue: string;
}

export interface UpdateApiKeyRequest {
  keyValue: string;
}

export interface VerifyApiKeyResponse {
  valid: boolean;
  message?: string;
}

export interface ApiKeyError {
  detail: string;
}
