'use client';

/**
 * E2E test harness for the Chat History feature (issue #37).
 *
 * ConversationListSidebar, MessageTranscriptViewer, and SemanticSearchUI are
 * not yet wired into any product route — there is no page in this app today
 * that assembles them into the "load conversations -> select -> view
 * messages -> search" flow a real user would follow. Building that product
 * page is out of scope here (it's feature work owned by the agents building
 * the chat-history UI itself).
 *
 * This route exists solely so Playwright has somewhere real to drive those
 * three components together, end-to-end, through the browser, hitting their
 * actual network calls (mocked at the HTTP layer via page.route in the e2e
 * spec rather than a live backend). When the real product page lands, the
 * e2e specs should be repointed at it and this harness route deleted.
 */

import { useState } from 'react';
import QueryProvider from '@/components/providers/query-provider';
import ConversationListSidebar from '@/components/openclaw/ConversationListSidebar';
import MessageTranscriptViewer from '@/components/openclaw/MessageTranscriptViewer';
import SemanticSearchUI from '@/components/openclaw/SemanticSearchUI';

function ChatHistoryHarness() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-e2e-1');
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      data-testid="chat-history-harness"
      style={{ display: 'flex', height: '100vh', width: '100vw' }}
    >
      <ConversationListSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={(conversationId) => {
          setSelectedConversationId(conversationId);
        }}
        onNewConversation={() => {
          // No-op in the harness: conversation creation is covered by its
          // own unit/integration tests (useCreateConversation).
        }}
        className="w-[320px] shrink-0"
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
        <button
          type="button"
          data-testid="open-semantic-search"
          onClick={() => setSearchOpen(true)}
          style={{ alignSelf: 'flex-start', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8 }}
        >
          Search conversations
        </button>

        {selectedConversationId ? (
          <MessageTranscriptViewer
            agentId={selectedAgentId}
            conversationId={selectedConversationId}
            maxHeight="calc(100vh - 100px)"
          />
        ) : (
          <div data-testid="no-conversation-selected" style={{ color: '#888' }}>
            Select a conversation to view its messages.
          </div>
        )}
      </div>

      <SemanticSearchUI
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onResultClick={(conversationId) => {
          setSelectedConversationId(conversationId);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}

export default function E2EChatHistoryHarnessPage() {
  return (
    <QueryProvider>
      <ChatHistoryHarness />
    </QueryProvider>
  );
}
