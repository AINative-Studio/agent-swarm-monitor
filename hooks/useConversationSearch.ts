/**
 * React Query hook for conversation semantic search
 */

import { useQuery } from '@tanstack/react-query';
import conversationService from '@/lib/conversation-service';
import type { SearchFilters, SearchMessagesOptions } from '@/types/conversation';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook to search messages across conversations with filters
 * @param query - Search query string
 * @param filters - Optional filters (agent, date range, etc.)
 * @param enabled - Whether the query should run (default: true when query is not empty)
 * @param options - Search mode options (semantic vs keyword, pagination); defaults to
 *   semantic search, page size 10, offset 0
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
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
  const offset = options?.offset ?? 0;

  return useQuery({
    queryKey: ['conversation-search', query, filters, semantic, limit, offset] as const,
    queryFn: () =>
      conversationService.searchMessages(query, filters, { semantic, limit, offset }),
    enabled: shouldFetch,
    staleTime: 60000, // 60 seconds
    refetchOnWindowFocus: false,
  });
}
