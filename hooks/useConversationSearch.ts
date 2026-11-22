/**
 * React Query hook for conversation semantic search
 */

import { useQuery } from '@tanstack/react-query';
import conversationService from '@/lib/conversation-service';
import type { SearchFilters, SearchMessagesOptions } from '@/types/conversation';

/**
 * Hook to search messages across conversations with filters
 * @param query - Search query string
 * @param filters - Optional filters (agent, date range, etc.)
 * @param enabled - Whether the query should run (default: true when query is not empty)
 * @param options - Search mode options (semantic vs keyword); defaults to semantic search
 * @returns React Query result with search results
 */
export function useSearchMessages(
  query: string,
  filters?: SearchFilters,
  enabled?: boolean,
  options?: SearchMessagesOptions
) {
  const shouldFetch = enabled !== undefined ? enabled : query.length >= 2;
  const semantic = options?.semantic ?? true;

  return useQuery({
    queryKey: ['conversation-search', query, filters, semantic] as const,
    queryFn: () => conversationService.searchMessages(query, filters, { semantic }),
    enabled: shouldFetch,
    staleTime: 60000, // 60 seconds
    refetchOnWindowFocus: false,
  });
}
