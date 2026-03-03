'use client';

import { useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { MessageItem } from '@/components/conversations/MessageItem';
import { Message } from '@/lib/conversation-types';

interface MessageTranscriptProps {
  conversationId: string;
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  error?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export function MessageTranscript({
  conversationId,
  messages,
  isLoading = false,
  isLoadingMore = false,
  error,
  hasMore = false,
  onLoadMore,
  onRetry,
}: MessageTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const isInitialRenderRef = useRef(true);

  // Auto-scroll to bottom on new messages (but not when loading more historical messages)
  useEffect(() => {
    const isNewMessage =
      messages.length > previousMessageCountRef.current &&
      !isLoadingMore;

    if ((isInitialRenderRef.current || isNewMessage) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: isInitialRenderRef.current ? 'auto' : 'smooth' });
      isInitialRenderRef.current = false;
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, isLoadingMore]);

  // Loading state
  if (isLoading) {
    return (
      <div
        data-testid="message-transcript"
        className="flex items-center justify-center min-h-[400px] p-4 md:p-6"
      >
        <div role="status" aria-live="polite" aria-label="Loading messages" className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="message-transcript"
        className="flex items-center justify-center min-h-[400px] p-4 md:p-6"
      >
        <div
          role="alert"
          className="flex flex-col items-center gap-4 max-w-md text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Messages
            </h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div
        data-testid="message-transcript"
        className="flex items-center justify-center min-h-[400px] p-4 md:p-6"
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            No messages yet. Start a conversation!
          </p>
        </div>
      </div>
    );
  }

  // Messages list
  return (
    <div
      data-testid="message-transcript"
      role="log"
      aria-label="Message transcript"
      className="flex flex-col p-4 md:p-6 space-y-0"
    >
      {/* Load More button (top) */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
