import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import monitoringService from '@/lib/monitoring-service';
import type { TimelineFilters, AlertThresholdUpdate } from '@/types/monitoring';

export function useSwarmHealth() {
    return useQuery({
        queryKey: ['swarm-health'],
        queryFn: () => monitoringService.getSwarmHealth(),
        refetchInterval: 10000,
    });
}

export function useTimeline(filters?: TimelineFilters) {
    return useQuery({
        queryKey: ['swarm-timeline', filters],
        queryFn: () => monitoringService.getTimeline(filters),
        refetchInterval: 10000,
    });
}

export function useAlertThresholds() {
    return useQuery({
        queryKey: ['alert-thresholds'],
        queryFn: () => monitoringService.getAlertThresholds(),
    });
}

export function useUpdateAlertThresholds() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AlertThresholdUpdate) =>
            monitoringService.updateAlertThresholds(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
        },
    });
}

export function useMonitoringStatus() {
    return useQuery({
        queryKey: ['monitoring-status'],
        queryFn: () => monitoringService.getMonitoringStatus(),
        refetchInterval: 30000,
    });
}
