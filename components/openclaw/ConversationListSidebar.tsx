'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { formatRelativeTime } from '@/lib/openclaw-utils';
import { groupConversationsByAgent, type ConversationGroup } from '@/lib/conversation-grouping';
import type { Conversation } from '@/types/conversation';

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

  // Fetch conversations (scoped to one agent, or all agents) and the agent
  // roster so each conversation can display its agent's name + avatar.
  const { data, isLoading, isError } = useConversations(agentId);
  const { data: agentListData } = useAgentList();
  const deleteConversation = useDeleteConversation();

  const agents = useMemo(() => agentListData?.agents ?? [], [agentListData?.agents]);

  // Filter conversations based on search query (agent name or title)
  const filteredConversations = useMemo(() => {
    const conversations = data?.conversations ?? [];
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase();
    const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

    return conversations.filter((conv) => {
      const titleMatch = conv.title?.toLowerCase().includes(query);
      const agentName = agentsById.get(conv.agentId)?.name?.toLowerCase() ?? '';
      const agentMatch = agentName.includes(query);
      return titleMatch || agentMatch;
    });
  }, [data?.conversations, searchQuery, agents]);

  // Group filtered conversations by agent, most-recently-active group first,
  // most-recently-active conversation first within each group.
  const groups = useMemo<ConversationGroup[]>(
    () => groupConversationsByAgent(filteredConversations, agents),
    [filteredConversations, agents]
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

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" data-testid="conversation-list-skeleton" />
            <p className="text-sm text-gray-500">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4">
            <MessageSquare className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Error Loading Conversations
            </h3>
            <p className="text-xs text-gray-500">
              Unable to load conversations. Please try again later.
            </p>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversation list, grouped by agent */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
