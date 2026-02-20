import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import openClawService from '@/lib/openclaw-service';
import type { CreateAgentRequest, UpdateAgentSettingsRequest } from '@/types/openclaw';

export function useAgentList(status?: string) {
  return useQuery({
    queryKey: ['openclaw-agents', status],
    queryFn: () => openClawService.listAgents(status),
    refetchInterval: 10000,
  });
}

export function useAgent(agentId: string | undefined) {
  return useQuery({
    queryKey: ['openclaw-agent', agentId],
    queryFn: () => openClawService.getAgent(agentId!),
    enabled: !!agentId,
    refetchInterval: 5000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentRequest) => openClawService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agents'] });
    },
  });
}

export function usePauseAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => openClawService.pauseAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agents'] });
      queryClient.invalidateQueries({ queryKey: ['openclaw-agent', agentId] });
    },
  });
}

export function useResumeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => openClawService.resumeAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agents'] });
      queryClient.invalidateQueries({ queryKey: ['openclaw-agent', agentId] });
    },
  });
}

export function useUpdateAgentSettings(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAgentSettingsRequest) =>
      openClawService.updateSettings(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agents'] });
      queryClient.invalidateQueries({ queryKey: ['openclaw-agent', agentId] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => openClawService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agents'] });
    },
  });
}

export function useExecuteHeartbeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => openClawService.executeHeartbeat(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-agent', agentId] });
    },
  });
}
