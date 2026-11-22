'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Loader2, User, Bot, AlertCircle, ChevronUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamingMessage } from '@/components/aikit/StreamingMessage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useMessageStream } from '@/hooks/useMessageStream';
import { useConversationSync } from '@/hooks/useConversationSync';
import { StopGenerationButton } from '@/components/openclaw/StopGenerationButton';
import { ConnectionStatusBadge } from '@/components/openclaw/ConnectionStatusBadge';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/openclaw';

interface MessageTranscriptViewerProps {
    agentId: string;
    conversationId: string;
    agentName?: string;
    className?: string;
    maxHeight?: string;
    enableVirtualScrolling?: boolean;
    /**
     * When set (e.g. from a semantic search result's "jump to message" click), the
     * viewer scrolls that message into view and briefly highlights it once it's loaded.
     */
    scrollToMessageId?: string | null;
    /** Enable the live WebSocket message stream (typing indicator, token-by-token render, stop button). Defaults to true. */
    enableLiveStream?: boolean;
}

export default function MessageTranscriptViewer({
    agentId,
    conversationId,
    agentName = 'Assistant',
    className,
    maxHeight = '600px',
    enableVirtualScrolling = false,
    scrollToMessageId = null,
    enableLiveStream = true,
}: MessageTranscriptViewerProps) {
    const [limit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [composerValue, setComposerValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Fetch messages with pagination
    const { data, isLoading, isError, error } = useMessages(
        agentId,
        conversationId,
        limit,
        offset
    );

    const queryClient = useQueryClient();

    // Cross-tab sync (issue #36): when another tab sends/receives a message for this
    // same conversation, re-fetch so this tab's transcript picks it up without a manual
    // refresh. `broadcast` (used below, in handleSendMessage and the stream-complete
    // effect) tells every *other* tab with this conversation open to do the same.
    const { broadcast } = useConversationSync({
        conversationId,
        onEvent: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', agentId, conversationId] });
        },
    });

    // Message composer: sends via useSendMessage and optimistically appends
    // both the user's message and (once the mutation resolves) the agent's
    // reply to the local transcript, rolling the optimistic entry back on error.
    const sendMessage = useSendMessage();

    const handleSendMessage = useCallback(() => {
        const trimmed = composerValue.trim();
        if (!trimmed || sendMessage.isPending) {
            return;
        }

        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            conversationId,
            agentId,
            role: 'user',
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        setAllMessages((prev) => [...prev, optimisticMessage]);
        setComposerValue('');

        sendMessage.mutate(
            { agentId, conversationId, message: trimmed },
            {
                onSuccess: (response) => {
                    const replyMessage: Message = {
                        id: response.messageId,
                        conversationId: response.conversationId,
                        agentId,
                        role: 'assistant',
                        content: response.response,
                        timestamp: new Date().toISOString(),
                        model: response.model,
                        tokensUsed: response.tokensUsed,
                    };
                    setAllMessages((prev) => [...prev, replyMessage]);
                    // Let other tabs with this conversation open know a new message
                    // landed, so they refetch instead of showing a stale transcript.
                    broadcast({ type: 'message_added', conversationId, messageId: replyMessage.id });
                },
                onError: () => {
                    // Roll back the optimistic user message on failure.
                    setAllMessages((prev) => prev.filter((m) => m.id !== optimisticId));
                },
            }
        );
    }, [composerValue, sendMessage, agentId, conversationId, broadcast]);

    const handleComposerKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    // Real-time assistant streaming (issue #36): typing indicator, token-by-token
    // content, stop-generation, and connection status. Disabled entirely via
    // `enableLiveStream={false}` for callers that only want the static transcript.
    const {
        connectionStatus,
        streamingMessage,
        isStreaming,
        stopGeneration,
    } = useMessageStream({
        conversationId,
        agentId,
        autoConnect: enableLiveStream,
    });

    // Update all messages when new data arrives
    useEffect(() => {
        if (data?.messages) {
            if (offset === 0) {
                // First load or refresh
                setAllMessages(data.messages);
            } else {
                // Loading more (older messages)
                setAllMessages((prev) => [...data.messages, ...prev]);
            }
        }
    }, [data, offset]);

    // Auto-scroll to bottom on initial load and new messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!isLoading && allMessages.length > 0 && offset === 0) {
            scrollToBottom();
        }
    }, [allMessages, isLoading, offset, scrollToBottom]);

    // Smooth auto-scroll as new streaming tokens arrive, so the viewer tracks the
    // assistant's response as it's being typed rather than requiring a manual scroll.
    useEffect(() => {
        if (streamingMessage && !streamingMessage.isComplete) {
            scrollToBottom();
        }
    }, [streamingMessage, scrollToBottom]);

    // When a streamed assistant response finishes, refetch so the completed message
    // is persisted into the transcript, and let other tabs with this conversation
    // open know to refetch too (cross-tab sync, issue #36).
    useEffect(() => {
        if (streamingMessage?.isComplete) {
            queryClient.invalidateQueries({ queryKey: ['messages', agentId, conversationId] });
            broadcast({
                type: 'message_added',
                conversationId,
                messageId: streamingMessage.messageId,
            });
        }
    }, [streamingMessage, queryClient, agentId, conversationId, broadcast]);

    // Jump to a specific message (e.g. from a semantic search "jump to conversation"
    // result click) once it's present in the loaded transcript, and briefly highlight it.
    useEffect(() => {
        if (!scrollToMessageId) {
            return;
        }
        const target = messageRefs.current.get(scrollToMessageId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(scrollToMessageId);
            const timeout = setTimeout(() => setHighlightedMessageId(null), 2500);
            return () => clearTimeout(timeout);
        }
    }, [scrollToMessageId, allMessages]);

    // Handle copy message
    const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Failed to copy message:', err);
        }
    }, []);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        setOffset((prev) => prev + limit);
    }, [limit]);

    // Message entrance animation variants
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    // Loading state
    if (isLoading && allMessages.length === 0) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg',
                    className
                )}
                style={{ maxHeight }}
            >
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg',
                    className
                )}
                style={{ maxHeight }}
            >
                <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
                <p className="text-sm font-medium text-red-900">Error loading messages</p>
                <p className="text-xs text-red-600 mt-1">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }

    // Empty state
    if (allMessages.length === 0) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg',
                    className
                )}
                style={{ maxHeight }}
            >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">No messages yet</h4>
                <p className="text-sm text-gray-500 text-center max-w-md">
                    Start a conversation with {agentName} to see messages here.
                </p>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col bg-white rounded-lg border border-gray-200', className)}>
            {/* Live connection status (only meaningful once streaming is enabled) */}
            {enableLiveStream && (
                <div className="flex items-center justify-end px-3 pt-2">
                    <ConnectionStatusBadge status={connectionStatus} showLabel={false} />
                </div>
            )}

            {/* Load more button at top */}
            {data?.hasMore && (
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <Button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Load older messages
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Messages container */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ maxHeight }}
                role="list"
                aria-label="Message transcript"
            >
                <AnimatePresence initial={false}>
                    {allMessages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            ref={(el) => {
                                if (el) {
                                    messageRefs.current.set(message.id, el);
                                } else {
                                    messageRefs.current.delete(message.id);
                                }
                            }}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={cn(
                                // Real left/right alignment by role: user messages are
                                // pushed to the right edge, assistant/system messages to
                                // the left, each capped at 80% width so they read as
                                // chat bubbles rather than full-width rows.
                                'relative group flex',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'relative w-full max-w-[80%] rounded-lg transition-colors duration-500',
                                    message.role === 'user' ? 'ml-auto' : 'mr-auto',
                                    highlightedMessageId === message.id && 'ring-2 ring-blue-400 bg-blue-50/60'
                                )}
                            >
                                {/* Copy button overlay */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => handleCopyMessage(message.id, message.content)}
                                        aria-label="Copy message"
                                        className={cn(
                                            'p-2 rounded-lg transition-all',
                                            copiedMessageId === message.id
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                                        )}
                                        title={copiedMessageId === message.id ? 'Copied!' : 'Copy message'}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Message content */}
                                <StreamingMessage
                                    role={message.role}
                                    content={message.content}
                                    streamingState="complete"
                                    displayName={message.role === 'user' ? 'You' : agentName}
                                    showTimestamp={true}
                                    metadata={{
                                        timestamp: new Date(message.timestamp).getTime(),
                                        model: message.model,
                                        tokensUsed: message.tokensUsed,
                                    }}
                                    enableMarkdown={true}
                                    codeTheme="dark"
                                    enableCodeCopy={true}
                                    animationType="none"
                                    showStreamingIndicator={false}
                                    roleColors={{
                                        user: '#3b82f6',
                                        assistant: '#10b981',
                                        system: '#f59e0b',
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Live streaming assistant message (token-by-token) */}
                {enableLiveStream && streamingMessage && !streamingMessage.isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        data-testid="streaming-message-wrapper"
                        className="relative"
                    >
                        <StreamingMessage
                            testId="live-streaming-message"
                            role="assistant"
                            content={streamingMessage.content}
                            streamingState="streaming"
                            displayName={agentName}
                            showTimestamp={false}
                            enableMarkdown={true}
                            codeTheme="dark"
                            enableCodeCopy={false}
                            animationType="none"
                            showStreamingIndicator={true}
                            roleColors={{
                                user: '#3b82f6',
                                assistant: '#10b981',
                                system: '#f59e0b',
                            }}
                        />
                    </motion.div>
                )}

                {/* Typing indicator: shown while the assistant is composing but no
                    content has streamed in yet (e.g. waiting on the first token). */}
                {enableLiveStream && isStreaming && !streamingMessage?.content && (
                    <TypingIndicator agentName={agentName} />
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Stop-generation control, shown only while the assistant is streaming */}
            {enableLiveStream && isStreaming && (
                <div className="flex items-center justify-center px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <StopGenerationButton isStreaming={isStreaming} onStop={stopGeneration} />
                </div>
            )}

            {/* Message composer */}
            <div className="p-3 border-t border-gray-200 bg-white flex items-end gap-2">
                <Textarea
                    value={composerValue}
                    onChange={(e) => setComposerValue(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Message ${agentName}... (Enter to send, Shift+Enter for newline)`}
                    aria-label="Message input"
                    disabled={sendMessage.isPending}
                    className="flex-1 min-h-[44px] max-h-40 resize-none"
                    rows={1}
                />
                <Button
                    onClick={handleSendMessage}
                    disabled={!composerValue.trim() || sendMessage.isPending}
                    aria-label="Send message"
                    size="default"
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Message count footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                    Showing {allMessages.length} of {data?.total || allMessages.length} messages
                </p>
            </div>
        </div>
    );
}

// Typing indicator component (exported for use in chat interfaces)
export function TypingIndicator({ agentName }: { agentName?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-6 py-4"
        >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200">
                <Bot className="h-4 w-4 text-green-700" />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{agentName || 'Agent'} is typing</span>
                <div className="flex gap-1">
                    <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
