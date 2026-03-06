import { useQuery } from '@tanstack/react-query';
import channelService from '@/lib/channel-service';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.listChannels(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
