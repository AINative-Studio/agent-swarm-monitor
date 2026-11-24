'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import conversationService from '@/lib/conversation-service';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { formatRelativeTime } from '@/lib/openclaw-utils';
import { groupConversationsByAgent, type ConversationGroup } from '@/lib/conversation-grouping';
import { getErrorMessage } from '@/components/openclaw/ListErrorState';
import type { Conversation } from '@/types/conversation';

const PAGE_SIZE = 20;

interface ConversationListSidebarProps {
  /**
   * Scope the sidebar to a single agent's conversations. When omitted, the
   * sidebar shows conversations across all agents, grouped by agent.
   */
  agentId?: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export default function ConversationListSidebar({
  agentId,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch conversations (scoped to one agent, or all agents) and the agent
  // roster so each conversation can display its agent's name + avatar.
  // When the caller didn't lock the sidebar to a single agent via the
  // `agentId` prop, the agent-filter dropdown below can still narrow the
  // fetch/display down to one agent client-side.
  const effectiveAgentId = agentId ?? (agentFilter !== 'all' ? agentFilter : undefined);
  const { data, isLoading, isError, error, refetch } = useConversations(effectiveAgentId);

  // Issue #138's real root cause (confirmed by instrumenting live renders
  // against a genuinely failing backend, not just by reading the TanStack
  // source): `isError` itself is NOT monotonic across a sustained-failure
  // refetchInterval loop. When the next scheduled background fetch starts,
  // TanStack resets the query to `status: 'pending'` and `isError` flips
  // back to `false` (with `isLoading`/`isFetching` true again) BEFORE the
  // new attempt has failed -- it isn't merely that `isLoading` re-asserts
  // itself over a stable `isError`; `isError` is transiently cleared too.
  // So checking `isError` before `isLoading` (the "obvious" fix) still
  // loses the race: every poll tick briefly looks exactly like a fresh
  // first load again, and the skeleton flashes back in.
  //
  // The fix latches the most recent error across that reset instead of
  // trusting the instantaneous `isError` flag: `lastError` is set whenever
  // the query errors, and is only cleared once the query has data again
  // (a successful fetch). The render below treats "we have a latched
  // error and still have no data" as the stable error state, independent
  // of whatever `isLoading`/`isError` happen to read on this particular
  // render.
  const [lastError, setLastError] = useState<Error | null>(null);
  useEffect(() => {
    if (isError && error) {
      setLastError(error);
    } else if (data !== undefined) {
      // A successful fetch (even a background one after a prior failure)
      // clears the latched error -- the stale-data + inline-banner path
      // below takes over instead.
      setLastError(null);
    }
  }, [isError, error, data]);

  const hasLatchedErrorWithNoData = lastError !== null && data === undefined;
  const isInitialLoad = isLoading && !hasLatchedErrorWithNoData && data === undefined;
  const { data: agentListData } = useAgentList();
  const deleteConversation = useDeleteConversation();

  const agents = useMemo(() => agentListData?.agents ?? [], [agentListData?.agents]);

  // Message-content search: the conversation list-fetch response doesn't
  // include message bodies, so searching "inside" messages goes through
  // conversationService.searchMessages (keyword mode, no conversationId
  // filter -> searches across all conversations) to resolve which
  // conversation IDs contain a match. This is a separate, simpler feature
  // from the semantic-search UI (useSearchMessages/SemanticSearchUI), which
  // searches within a single already-open conversation.
  const trimmedQuery = searchQuery.trim();
  const { data: contentSearchData } = useQuery({
    queryKey: ['conversation-sidebar-content-search', trimmedQuery],
    queryFn: () => conversationService.searchMessages(trimmedQuery, undefined, { semantic: false }),
    enabled: trimmedQuery.length > 0,
    staleTime: 10000,
  });

  const matchingConversationIds = useMemo(() => {
    return new Set((contentSearchData?.results ?? []).map((r) => r.conversationId));
  }, [contentSearchData]);

  // Filter conversations based on search query — matches conversation
  // title, agent name, or message content (via the content-search lookup
  // above).
  const filteredConversations = useMemo(() => {
    const conversations = data?.conversations ?? [];
    if (!trimmedQuery) {
      return conversations;
    }

    const query = trimmedQuery.toLowerCase();
    const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

    return conversations.filter((conv) => {
      const titleMatch = conv.title?.toLowerCase().includes(query) ?? false;
      const agentName = agentsById.get(conv.agentId)?.name?.toLowerCase() ?? '';
      const agentMatch = agentName.includes(query);
      const contentMatch = matchingConversationIds.has(conv.id);
      return titleMatch || agentMatch || contentMatch;
    });
  }, [data?.conversations, trimmedQuery, agents, matchingConversationIds]);

  // Client-side pagination window ("load more on scroll"/button). The
  // underlying hook/service already supports limit+offset; we page through
  // the fetched (and filtered) results PAGE_SIZE at a time.
  const visibleConversations = useMemo(
    () => filteredConversations.slice(0, visibleCount),
    [filteredConversations, visibleCount]
  );
  const hasMoreToShow = visibleConversations.length < filteredConversations.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom && hasMoreToShow) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  const handleAgentFilterChange = (value: string) => {
    setAgentFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  // Group the currently-visible (paginated) conversations by agent,
  // most-recently-active group first, most-recently-active conversation
  // first within each group.
  const groups = useMemo<ConversationGroup[]>(
    () => groupConversationsByAgent(visibleConversations, agents),
    [visibleConversations, agents]
  );

  const handleDelete = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    deleteConversation.mutate({ conversationId: conversation.id, agentId: conversation.agentId });
  };

  const formatMessageCount = (count: number) => {
    if (count === 1) return '1 message';
    return `${count} messages`;
  };

  const lastMessagePreview = (conversation: Conversation) =>
    conversation.title || 'Untitled Conversation';

  // Loading state — a real skeleton placeholder list (shimmering rows that
  // approximate the eventual agent-group header + conversation rows),
  // rather than a bare spinner.
  if (isInitialLoad) {
    return (
      <div
        className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}
        data-testid="conversation-list-skeleton"
        aria-busy="true"
        aria-label="Loading conversations"
      >
        <span className="sr-only">Loading conversations...</span>
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse" />
          <div className="h-10 w-full rounded-md bg-gray-100 animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex} className="pb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
              </div>
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} className="px-4 py-3 border-b border-gray-100 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-1/4 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state -- shown whenever the query has a *latched* error (see
  // lastError above) and we have no cached data to fall back on, regardless
  // of what isLoading/isError happen to read on this particular render.
  // Using the latched error rather than the live isError flag is what
  // actually keeps this card stable: isError itself gets reset to false by
  // TanStack the moment the next refetchInterval-driven fetch starts (not
  // just overridden by isLoading), so a naive `isError && !data` check
  // still flickers back to the skeleton branch every ~10s during a
  // sustained failure (issue #138). When we DO have stale data from an
  // earlier successful fetch, we fall through to the normal list render
  // below and show a small inline error banner there instead, so a
  // transient background failure doesn't blank out a list the user can
  // still see and use.
  if (hasLatchedErrorWithNoData) {
    return (
      <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4" role="alert" aria-live="assertive">
            <MessageSquare className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Error Loading Conversations
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {getErrorMessage(lastError, 'Unable to load conversations. Please try again later.')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const conversations = data?.conversations ?? [];
  const hasConversations = conversations.length > 0;
  const hasFilteredResults = filteredConversations.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Inline error banner -- shown when a background refetch (e.g. the
          10s refetchInterval poll) has failed but we still have stale data
          from an earlier successful load to display underneath it. Uses the
          latched error (see lastError above) rather than the live isError
          flag for the same reason the full-page error card does: isError
          itself gets transiently reset on each new refetch attempt. */}
      {lastError && data && (
        <div
          className="flex items-center justify-between gap-2 px-4 py-2 bg-red-50 border-b border-red-100"
          role="alert"
          data-testid="conversation-list-inline-error"
        >
          <p className="text-xs text-red-700 truncate">
            {getErrorMessage(lastError, 'Unable to refresh conversations.')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs shrink-0"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header with New Conversation button */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
          size="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white"
            aria-label="Search conversations"
          />
        </div>

        {/* Agent filter dropdown — only shown when the sidebar isn't already
            locked to a single agent via the `agentId` prop. */}
        {!agentId && (
          <Select value={agentFilter} onValueChange={handleAgentFilterChange}>
            <SelectTrigger
              className="w-full h-10 bg-gray-50 border-gray-200 text-gray-900 text-sm focus:bg-white"
              aria-label="Filter by agent"
            >
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all" className="text-sm text-gray-900">
                All agents
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-sm text-gray-900">
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Conversation list, grouped by agent */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll} data-testid="conversation-list-scroll">
        {!hasConversations ? (
          // Empty state - no conversations at all
          <div className="flex items-center justify-center h-full px-6 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-green-100 mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                No Conversations Yet
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                Start a new conversation to begin chatting with your agent.
              </p>
            </div>
          </div>
        ) : !hasFilteredResults && isSearching ? (
          // No search results
          <div className="flex items-center justify-center h-full px-6 py-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No Matching Conversations
              </h3>
              <p className="text-xs text-gray-500">
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.agentId} role="group" aria-label={`${group.agentName} conversations`}>
              {/* Agent group header: avatar + agent name */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[10px] font-semibold shrink-0"
                  aria-hidden="true"
                  data-testid="agent-avatar"
                >
                  {group.agentInitials}
                </div>
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {group.agentName}
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {group.conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={cn(
                      'w-full border-b border-gray-100 group relative',
                      selectedConversationId === conversation.id &&
                        'bg-blue-50 border-l-4 border-l-blue-600'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 px-4 py-3">
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                        aria-label={`Select conversation ${conversation.title || 'Untitled'}`}
                      >
                        {/* Conversation title (last message preview) */}
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare
                            className={cn(
                              'h-4 w-4 shrink-0',
                              selectedConversationId === conversation.id
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            )}
                          />
                          <h4
                            className={cn(
                              'text-sm font-medium truncate',
                              selectedConversationId === conversation.id
                                ? 'text-blue-900'
                                : 'text-gray-900'
                            )}
                          >
                            {lastMessagePreview(conversation)}
                          </h4>
                        </div>

                        {/* Message count */}
                        <p className="text-xs text-gray-500 mb-1">
                          {formatMessageCount(conversation.messageCount)}
                        </p>

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt)}
                        </p>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, conversation)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 shrink-0"
                        aria-label="Delete conversation"
                        disabled={deleteConversation.isPending}
                      >
                        {deleteConversation.isPending &&
                        deleteConversation.variables?.conversationId === conversation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))
        )}

        {hasMoreToShow && (
          <div className="p-3">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              size="sm"
              className="w-full"
              aria-label="Load more conversations"
            >
              Load more conversations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
