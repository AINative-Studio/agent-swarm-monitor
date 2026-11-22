import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import networkService from '@/lib/network-service';

export function usePeerList() {
    return useQuery({
        queryKey: ['network-peers'],
        queryFn: () => networkService.getPeers(),
        refetchInterval: 10000,
    });
}

export function usePeerQuality(peerId: string | null) {
    return useQuery({
        queryKey: ['peer-quality', peerId],
        queryFn: () => networkService.getPeerQuality(peerId!),
        enabled: !!peerId,
        refetchInterval: 5000,
    });
}

export function useProvisionQR() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (peerId: string) => networkService.generateProvisionQR(peerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['network-peers'] });
        },
    });
}

export function useIPPool() {
    return useQuery({
        queryKey: ['ip-pool-stats'],
        queryFn: () => networkService.getIPPoolStats(),
        refetchInterval: 15000,
    });
}

export function useNetworkTopology() {
    return useQuery({
        queryKey: ['network-topology'],
        queryFn: () => networkService.getNetworkTopology(),
        refetchInterval: 10000,
    });
}
