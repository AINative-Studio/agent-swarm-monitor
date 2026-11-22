/**
 * React Query hooks for conversation and chat history management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import conversationService, {
  type CreateConversationRequest,
  type SendMessageRequest,
} from '@/lib/conversation-service';
import type { SemanticSearchRequest } from '@/types/conversation';

/**
 * Query key factory for conversation queries
 */
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (agentId: string) => [...conversationKeys.lists(), agentId] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (conversationId: string) =>
    [...conversationKeys.details(), conversationId] as const,
  messages: (conversationId: string) =>
    [...conversationKeys.all, 'messages', conversationId] as const,
  search: (conversationId: string, query: string) =>
    [...conversationKeys.all, 'search', conversationId, query] as const,
};

/**
 * Hook to fetch conversations for an agent
 */
export function useConversations(
  agentId: string | undefined,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: conversationKeys.list(agentId || 'null'),
    queryFn: () => {
      if (!agentId) throw new Error('No agent ID provided');
      return conversationService.listConversations(
        agentId,
        options?.limit,
        options?.offset
      );
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!agentId,
  });
}

/**
 * Hook to fetch a single conversation
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId || 'null'),
    queryFn: () => {
      if (!conversationId) throw new Error('No conversation ID provided');
      return conversationService.getConversation(conversationId);
    },
    enabled: !!conversationId,
  });
}

/**
 * Hook to fetch messages in a conversation (legacy name for backward compatibility)
 */
export function useConversationMessages(
  conversationId: string | undefined,
  options?: { limit?: number; offset?: number }
) {
  return useMessages(conversationId || null, options);
}

/**
 * Hook to fetch messages in a conversation
 */
export function useMessages(
  conversationId: string | null,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId || 'null'),
    queryFn: () => {
      if (!conversationId) throw new Error('No conversation ID provided');
      return conversationService.listMessages(
        conversationId,
        options?.limit,
        options?.offset
      );
    },
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    enabled: !!conversationId,
  });
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      conversationService.createConversation(request),
    onSuccess: (data) => {
      // Invalidate conversation list for this agent
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(data.agentId),
      });
      // Set the new conversation in the cache
      queryClient.setQueryData(conversationKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { conversationId: string; agentId: string }) =>
      conversationService.deleteConversation(params.conversationId),
    onSuccess: (_, variables) => {
      // Invalidate conversation list for this agent
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(variables.agentId),
      });
      // Remove the deleted conversation from cache
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(variables.conversationId),
      });
      // Remove messages from cache
      queryClient.removeQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
    },
  });
}

/**
 * Hook to send a message to a conversation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: {
      conversationId: string;
      data: SendMessageRequest
    }) => conversationService.sendMessage(conversationId, data),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
      // Invalidate conversation detail (to update message count)
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(variables.conversationId),
      });
      // Invalidate conversation list (to update updatedAt)
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

/**
 * Hook to search messages using semantic search
 */
export function useSearchMessages(request: SemanticSearchRequest | null) {
  return useQuery({
    queryKey: request
      ? conversationKeys.search(request.conversationId, request.query)
      : ['search', 'null'],
    queryFn: () => {
      if (!request) throw new Error('No search request provided');
      return conversationService.searchMessages(request.query, {
        conversationId: request.conversationId,
      });
    },
    enabled: !!request && !!request.query && request.query.length > 0,
    staleTime: 30000, // Cache search results for 30 seconds
  });
}
