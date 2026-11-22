import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openclawService } from '@/lib/openclaw-service';
import type {
    SendMessageRequest,
    SendMessageResponse,
    MessageListResponse,
} from '@/types/openclaw';

/**
 * Hook to fetch messages for a conversation
 */
export function useMessages(
    agentId: string,
    conversationId: string,
    limit: number = 50,
    offset: number = 0
) {
    return useQuery({
        queryKey: ['messages', agentId, conversationId, limit, offset],
        queryFn: () => openclawService.getMessages(agentId, conversationId, limit, offset),
        enabled: !!agentId && !!conversationId,
        staleTime: 10000, // 10 seconds
        refetchInterval: 10000, // Poll every 10 seconds for new messages
    });
}

/**
 * Hook to send a message to an agent
 */
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation<SendMessageResponse, Error, SendMessageRequest>({
        mutationFn: (request: SendMessageRequest) => openclawService.sendMessage(request),
        onSuccess: (data, variables) => {
            // Invalidate messages query to refetch with new message
            queryClient.invalidateQueries({
                queryKey: ['messages', variables.agentId, data.conversationId],
            });

            // Also invalidate conversations list
            queryClient.invalidateQueries({
                queryKey: ['conversations', variables.agentId],
            });
        },
    });
}
