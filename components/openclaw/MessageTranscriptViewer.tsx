'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Loader2, User, Bot, AlertCircle, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamingMessage } from '@/components/aikit/StreamingMessage';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/openclaw';

interface MessageTranscriptViewerProps {
    agentId: string;
    conversationId: string;
    agentName?: string;
    className?: string;
    maxHeight?: string;
    enableVirtualScrolling?: boolean;
}

export default function MessageTranscriptViewer({
    agentId,
    conversationId,
    agentName = 'Assistant',
    className,
    maxHeight = '600px',
    enableVirtualScrolling = false,
}: MessageTranscriptViewerProps) {
    const [limit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Fetch messages with pagination
    const { data, isLoading, isError, error } = useMessages(
        agentId,
        conversationId,
        limit,
        offset
    );

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
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative group"
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
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
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
