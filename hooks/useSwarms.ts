import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import swarmService from '@/lib/swarm-service';
import type { CreateSwarmRequest, UpdateSwarmRequest } from '@/types/openclaw';

export function useSwarmList(status?: string) {
    return useQuery({
        queryKey: ['swarms', status],
        queryFn: () => swarmService.listSwarms(status),
        refetchInterval: 10000,
    });
}

export function useSwarm(swarmId: string | undefined) {
    return useQuery({
        queryKey: ['swarm', swarmId],
        queryFn: () => swarmService.getSwarm(swarmId!),
        enabled: !!swarmId,
        refetchInterval: 5000,
    });
}

export function useCreateSwarm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSwarmRequest) => swarmService.createSwarm(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
        },
    });
}

export function useUpdateSwarm(swarmId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateSwarmRequest) => swarmService.updateSwarm(swarmId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function useAddAgentsToSwarm(swarmId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agentIds: string[]) => swarmService.addAgents(swarmId, agentIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function useRemoveAgentsFromSwarm(swarmId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agentIds: string[]) => swarmService.removeAgents(swarmId, agentIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function useStartSwarm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swarmId: string) => swarmService.startSwarm(swarmId),
        onSuccess: (_, swarmId) => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function usePauseSwarm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swarmId: string) => swarmService.pauseSwarm(swarmId),
        onSuccess: (_, swarmId) => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function useResumeSwarm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swarmId: string) => swarmService.resumeSwarm(swarmId),
        onSuccess: (_, swarmId) => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
            queryClient.invalidateQueries({ queryKey: ['swarm', swarmId] });
        },
    });
}

export function useStopSwarm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (swarmId: string) => swarmService.stopSwarm(swarmId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swarms'] });
        },
    });
}
