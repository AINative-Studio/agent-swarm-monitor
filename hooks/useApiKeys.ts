/**
 * API Key Management React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiKeyService from '@/lib/api-key-service';
import type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ServiceName,
} from '@/types/api-keys';

export function useApiKeyList() {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => apiKeyService.listKeys(),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => apiKeyService.createKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceName, data }: { serviceName: ServiceName; data: UpdateApiKeyRequest }) =>
      apiKeyService.updateKey(serviceName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceName: ServiceName) => apiKeyService.deleteKey(serviceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}

export function useVerifyApiKey() {
  return useMutation({
    mutationFn: (serviceName: ServiceName) => apiKeyService.verifyKey(serviceName),
  });
}
