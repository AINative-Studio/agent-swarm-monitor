'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenClawAgent } from '@/types/openclaw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

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
  const replyTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch existing conversation and messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);

        // First, get conversations for this agent
        const convResponse = await fetch(
          `${API_URL}/conversations?agent_id=${agent.id}`
        );

        if (!convResponse.ok) {
          console.error('Failed to fetch conversations');
          return;
        }

        const convData = await convResponse.json();

        if (convData.conversations && convData.conversations.length > 0) {
          const conversation = convData.conversations[0]; // Get most recent
          setConversationId(conversation.id);

          // Fetch messages for this conversation
          const msgResponse = await fetch(
            `${API_URL}/conversations/${conversation.id}/messages?limit=100`
          );

          if (!msgResponse.ok) {
            console.error('Failed to fetch messages');
            return;
          }

          const msgData = await msgResponse.json();

          if (msgData.messages) {
            // Transform messages to match our interface
            const transformedMessages = msgData.messages.map((msg: any, idx: number) => ({
              id: `msg-${msg.timestamp}-${idx}`,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            }));

            setMessages(transformedMessages);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [agent.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
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

    // Simulate agent response after a short delay
    replyTimeoutRef.current = setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: `This is a simulated response from ${agent.name}. In production, this would connect to the OpenClaw agent API.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  }, [input, agent.name]);

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
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              Send a message to start chatting with your agent.
              The agent will use its configured model and persona to respond.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
            disabled={!input.trim()}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors shrink-0',
              input.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
