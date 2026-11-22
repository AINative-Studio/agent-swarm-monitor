import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import taskService, { type TaskCreateRequest } from '@/lib/task-service';
import type { TaskQueueFilters } from '@/types/tasks';

export function useTaskQueue(filters?: TaskQueueFilters) {
    return useQuery({
        queryKey: ['task-queue', filters],
        queryFn: () => taskService.getTaskQueue(filters),
        refetchInterval: 10000,
    });
}

export function useTaskDetails(taskId: string | null) {
    return useQuery({
        queryKey: ['task-details', taskId],
        queryFn: () => taskService.getTaskDetails(taskId!),
        enabled: !!taskId,
        refetchInterval: 10000,
    });
}

export function useTaskHistory(taskId: string | null) {
    return useQuery({
        queryKey: ['task-history', taskId],
        queryFn: () => taskService.getTaskHistory(taskId!),
        enabled: !!taskId,
        refetchInterval: 10000,
    });
}

export function useActiveLeases() {
    return useQuery({
        queryKey: ['active-leases'],
        queryFn: () => taskService.getActiveLeases(),
        refetchInterval: 10000,
    });
}

export function useTaskStats() {
    return useQuery({
        queryKey: ['task-stats'],
        queryFn: () => taskService.getTaskStats(),
        refetchInterval: 10000,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TaskCreateRequest) => taskService.createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-queue'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats'] });
        },
    });
}

export function useAssignTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, peerId }: { taskId: string; peerId: string }) =>
            taskService.assignTask(taskId, peerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-queue'] });
            queryClient.invalidateQueries({ queryKey: ['task-details'] });
            queryClient.invalidateQueries({ queryKey: ['active-leases'] });
        },
    });
}

export function useAvailablePeers() {
    return useQuery({
        queryKey: ['available-peers'],
        queryFn: () => taskService.getAvailablePeers(),
        refetchInterval: 30000,
    });
}
