'use client';

/**
 * Conversations — the real product page that composes conversation history
 * browsing (issues #33/#34), semantic/keyword search (#35), and real-time
 * message streaming (#36) into one working flow:
 *
 *   browse conversations -> select one -> view/stream its messages
 *   -> search across all conversations -> click a result -> jump straight
 *      to that conversation, scrolled to the matched message
 *
 * Previously these three components (ConversationListSidebar,
 * MessageTranscriptViewer, SemanticSearchUI) only came together in a
 * Playwright test harness (`app/e2e-chat-history`). This page is the real
 * route a user would actually land on.
 */

import { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ConversationListSidebar from '@/components/openclaw/ConversationListSidebar';
import MessageTranscriptViewer from '@/components/openclaw/MessageTranscriptViewer';
import SemanticSearchUI from '@/components/openclaw/SemanticSearchUI';
import { useConversations, useCreateConversation } from '@/hooks/useConversations';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { fadeUp } from '@/lib/openclaw-utils';
import type { AgentOption } from '@/types/conversation';

export default function OpenClawConversationsClient() {
  // Selection state lives here, at the level that owns all three
  // components, so a search result click can drive both "which
  // conversation is open" and "which message to scroll to" at once.
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: conversationsData } = useConversations(undefined);
  const { data: agentListData } = useAgentList();
  const createConversation = useCreateConversation();

  const conversations = conversationsData?.conversations ?? [];
  const agents = useMemo(() => agentListData?.agents ?? [], [agentListData?.agents]);
  const availableAgents: AgentOption[] = useMemo(
    () => agents.map((agent) => ({ id: agent.id, name: agent.name })),
    [agents]
  );

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const selectedAgent = agents.find((a) => a.id === selectedConversation?.agentId);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    // A manual sidebar click isn't "jump to message" — clear any pending scroll target.
    setScrollToMessageId(null);
  }, []);

  const handleNewConversation = useCallback(() => {
    const firstAgent = agents[0];
    if (!firstAgent) return;
    createConversation.mutate(
      { agentId: firstAgent.id },
      {
        onSuccess: (conversation) => {
          setSelectedConversationId(conversation.id);
          setScrollToMessageId(null);
        },
      }
    );
  }, [agents, createConversation]);

  // Wired to SemanticSearchUI's onResultClick(conversationId, messageId): jump to the
  // conversation the result belongs to and scroll the transcript to that exact message.
  const handleSearchResultClick = useCallback((conversationId: string, messageId: string) => {
    setSelectedConversationId(conversationId);
    setScrollToMessageId(messageId);
    setSearchOpen(false);
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex h-[calc(100vh-4rem)] overflow-hidden"
    >
      <ConversationListSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        className="w-[320px] shrink-0"
      />

      <div className="flex-1 flex flex-col gap-3 p-4 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            {selectedConversation
              ? selectedConversation.title || 'Untitled Conversation'
              : 'Conversations'}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Search conversations
          </Button>
        </div>

        {selectedConversationId && selectedAgent ? (
          <MessageTranscriptViewer
            agentId={selectedAgent.id}
            conversationId={selectedConversationId}
            agentName={selectedAgent.name}
            scrollToMessageId={scrollToMessageId}
            maxHeight="calc(100vh - 10rem)"
            className="flex-1"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            Select a conversation, or search to jump straight to a message.
          </div>
        )}
      </div>

      <SemanticSearchUI
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onResultClick={handleSearchResultClick}
        availableAgents={availableAgents}
      />
    </motion.div>
  );
}
