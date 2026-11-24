'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import conversationService from '@/lib/conversation-service';
import { openclawService } from '@/lib/openclaw-service';
import ListErrorState from '@/components/openclaw/ListErrorState';
import { ApiError } from '@/lib/api-client';
import type { OpenClawAgent } from '@/types/openclaw';

interface AgentChatTabProps {
  agent: OpenClawAgent;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AgentChatTab({ agent }: AgentChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const replyTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // First, get conversations for this agent. A failure here (including a
      // 404/empty result for a brand new agent with no history yet) is an
      // expected, already-handled condition -- not an unhandled exception --
      // so it's logged quietly rather than via console.error, which would
      // otherwise trip Next.js's dev-mode error overlay. See issue #125.
      const convData = await conversationService.listConversations(agent.id);

      if (convData.conversations && convData.conversations.length > 0) {
        const conversation = convData.conversations[0]; // Get most recent
        setConversationId(conversation.id);

        // Fetch messages for this conversation
        const msgData = await conversationService.listMessages(conversation.id, 100);

        if (msgData.messages) {
          // Transform messages to match our interface
          const transformedMessages = msgData.messages.map((msg, idx) => ({
            id: `msg-${msg.timestamp}-${idx}`,
            role: msg.role as ChatMessage['role'],
            content: msg.content,
            timestamp: msg.timestamp,
          }));

          setMessages(transformedMessages);
        }
      }
    } catch (error) {
      // A brand new agent with no conversation history yet can surface as a
      // 404 from the backend -- that's a normal empty state, not an error.
      const isNotFound = error instanceof ApiError && error.statusCode === 404;
      if (!isNotFound) {
        // Expected/handled failure path (auth hiccup, network blip, etc.) --
        // the UI already falls back to an inline error state below, so this
        // doesn't warrant a blocking console.error. See issue #125.
        console.warn('Could not load chat history for this agent:', error);
        setLoadError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [agent.id]);

  // Fetch existing conversation and messages
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // Send message to backend API (endpoint from agent_lifecycle.py), via
      // the shared apiClient-backed service so the request carries the
      // stored auth token like every other authenticated call in the app.
      const data = await openclawService.sendMessage({
        agentId: agent.id,
        conversationId: conversationId ?? undefined,
        message: trimmed,
      });

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: data.messageId || `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message in chat
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [input, agent.id, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-[600px] max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Chat with Agent</h3>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading conversation...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {Boolean(loadError) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Couldn&apos;t load earlier message history, but your current conversation is shown below.{' '}
                <button
                  type="button"
                  onClick={fetchMessages}
                  className="font-medium underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full px-8">
            <ListErrorState
              error={loadError}
              onRetry={fetchMessages}
              message="Couldn't load this conversation."
              className="w-full max-w-md"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              Send a message to start chatting with your agent.
              The agent will use its configured model and persona to respond.
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5',
              'text-sm text-gray-900 placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
              'min-h-[42px] max-h-[120px]'
            )}
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors shrink-0',
              input.trim() && !isSending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
