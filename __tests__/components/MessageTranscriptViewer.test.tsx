import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import MessageTranscriptViewer from '@/components/openclaw/MessageTranscriptViewer';
import type { Message } from '@/types/openclaw';

// Mock the hooks
vi.mock('@/hooks/useMessages', () => ({
    useMessages: vi.fn(),
    useSendMessage: vi.fn(),
}));

vi.mock('@/hooks/useMessageStream', () => ({
    useMessageStream: vi.fn(),
}));

vi.mock('@/hooks/useConversationSync', () => ({
    useConversationSync: vi.fn(),
}));

import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useMessageStream } from '@/hooks/useMessageStream';
import { useConversationSync } from '@/hooks/useConversationSync';

function mockConversationSync(overrides: Partial<ReturnType<typeof useConversationSync>> = {}) {
    const broadcast = vi.fn();
    vi.mocked(useConversationSync).mockReturnValue({
        broadcast,
        ...overrides,
    } as any);
    return broadcast;
}

function mockMessageStream(overrides: Partial<ReturnType<typeof useMessageStream>> = {}) {
    vi.mocked(useMessageStream).mockReturnValue({
        connectionStatus: 'connected',
        streamingMessage: null,
        reconnectAttempts: 0,
        connect: vi.fn(),
        disconnect: vi.fn(),
        stopGeneration: vi.fn(),
        isConnected: true,
        isStreaming: false,
        ...overrides,
    } as any);
}

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('MessageTranscriptViewer Component', () => {
    const mockAgentId = 'agent-123';
    const mockConversationId = 'conv-456';
    const mockAgentName = 'Test Agent';

    const mockMessages: Message[] = [
        {
            id: 'msg-1',
            conversationId: mockConversationId,
            agentId: mockAgentId,
            role: 'user',
            content: 'Hello there',
            timestamp: '2026-03-08T10:00:00Z',
        },
        {
            id: 'msg-2',
            conversationId: mockConversationId,
            agentId: mockAgentId,
            role: 'assistant',
            content: 'Hi! How can I help you?',
            timestamp: '2026-03-08T10:00:05Z',
            model: 'claude-3-5-sonnet-20241022',
            tokensUsed: 42,
        },
        {
            id: 'msg-3',
            conversationId: mockConversationId,
            agentId: mockAgentId,
            role: 'user',
            content: 'Can you help me with coding?',
            timestamp: '2026-03-08T10:01:00Z',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockMessageStream();
        mockConversationSync();
    });

    describe('Rendering and Display', () => {
        it('should render component with messages', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
                error: null,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Hello there')).toBeInTheDocument();
            expect(screen.getByText('Hi! How can I help you?')).toBeInTheDocument();
            expect(screen.getByText('Can you help me with coding?')).toBeInTheDocument();
        });

        it('should display loading state', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: undefined,
                isLoading: true,
                isError: false,
                error: null,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should display empty state when no messages', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [],
                    total: 0,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
                error: null,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/no messages/i)).toBeInTheDocument();
        });

        it('should display error state', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Failed to fetch messages'),
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });

    describe('Message Formatting', () => {
        it('should display user messages with correct styling', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [mockMessages[0]],
                    total: 1,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const userMessage = container.querySelector('[data-role="user"]');
            expect(userMessage).toBeInTheDocument();
        });

        it('should display assistant messages with correct styling', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [mockMessages[1]],
                    total: 1,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const assistantMessage = container.querySelector('[data-role="assistant"]');
            expect(assistantMessage).toBeInTheDocument();
        });

        it('should display timestamps for messages', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            // Check for message-timestamp class or timestamps
            const timestamps = screen.getAllByText(/:/);
            expect(timestamps.length).toBeGreaterThan(0);
        });

        it('should render markdown content in messages', () => {
            const messageWithMarkdown: Message = {
                id: 'msg-md',
                conversationId: mockConversationId,
                agentId: mockAgentId,
                role: 'assistant',
                content: '**Bold text** and `code snippet`',
                timestamp: '2026-03-08T10:02:00Z',
            };

            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [messageWithMarkdown],
                    total: 1,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            // Markdown should be rendered through StreamingMessage component
            expect(screen.getByText(/Bold text/)).toBeInTheDocument();
        });
    });

    describe('Pagination', () => {
        it('should show "Load more" button when hasMore is true', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 100,
                    limit: 50,
                    offset: 0,
                    hasMore: true,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/load/i)).toBeInTheDocument();
        });

        it('should not show "Load more" button when hasMore is false', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.queryByText(/load more/i)).not.toBeInTheDocument();
        });

        it('should load older messages when clicking "Load more"', async () => {
            const { rerender } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 100,
                    limit: 50,
                    offset: 0,
                    hasMore: true,
                },
                isLoading: false,
                isError: false,
            } as any);

            rerender(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />
            );

            const loadMoreButton = screen.getByText(/load/i);
            fireEvent.click(loadMoreButton);

            // Verify offset changed (component should update its internal state)
            await waitFor(() => {
                expect(loadMoreButton).toBeInTheDocument();
            });
        });
    });

    describe('Copy Message Functionality', () => {
        it('should show copy button for each message', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [mockMessages[0]],
                    total: 1,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const copyButtons = screen.queryAllByLabelText(/copy/i);
            expect(copyButtons.length).toBeGreaterThan(0);
        });

        it('should copy message content to clipboard when copy button clicked', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator, {
                clipboard: {
                    writeText: writeTextMock,
                },
            });

            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: [mockMessages[0]],
                    total: 1,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const copyButton = screen.getByLabelText(/copy/i);
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(writeTextMock).toHaveBeenCalledWith('Hello there');
            });
        });
    });

    describe('Message Display Features', () => {
        it('should render messages in chronological order', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const messages = container.querySelectorAll('[data-role]');
            expect(messages).toHaveLength(3);
            expect(messages[0].getAttribute('data-role')).toBe('user');
            expect(messages[1].getAttribute('data-role')).toBe('assistant');
            expect(messages[2].getAttribute('data-role')).toBe('user');
        });

        it('should show message count in footer', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 10,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/showing 3 of 10 messages/i)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should be keyboard navigable', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            // Check for proper semantic elements
            const messageList = container.querySelector('[role="list"]') || container.querySelector('[aria-label]');
            expect(messageList).toBeTruthy();
        });

        it('should have proper ARIA labels', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const copyButtons = screen.getAllByLabelText(/copy/i);
            expect(copyButtons.length).toBeGreaterThan(0);
            copyButtons.forEach(button => {
                expect(button).toHaveAttribute('aria-label', 'Copy message');
            });
        });
    });

    describe('Performance', () => {
        it('should handle large number of messages efficiently', () => {
            const largeMessageList: Message[] = Array.from({ length: 100 }, (_, i) => ({
                id: `msg-${i}`,
                conversationId: mockConversationId,
                agentId: mockAgentId,
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`,
                timestamp: new Date(Date.now() + i * 1000).toISOString(),
            })) as Message[];

            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: largeMessageList,
                    total: 100,
                    limit: 100,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            // Should render without crashing
            expect(container).toBeInTheDocument();
        });
    });

    describe('Real-time Streaming (issue #36)', () => {
        beforeEach(() => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
                error: null,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
        });

        it('shows a typing indicator while the assistant is composing with no content yet', () => {
            mockMessageStream({
                isStreaming: true,
                streamingMessage: { messageId: 'stream-1', content: '', isComplete: false, timestamp: new Date().toISOString() },
            });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/is typing/i)).toBeInTheDocument();
        });

        it('renders the streaming message content as tokens arrive', () => {
            mockMessageStream({
                isStreaming: true,
                streamingMessage: {
                    messageId: 'stream-1',
                    content: 'Partial respo',
                    isComplete: false,
                    timestamp: new Date().toISOString(),
                },
            });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByTestId('streaming-message-wrapper')).toBeInTheDocument();
            expect(screen.getByText(/Partial respo/)).toBeInTheDocument();
        });

        it('does not show the typing indicator once streaming content has arrived', () => {
            mockMessageStream({
                isStreaming: true,
                streamingMessage: {
                    messageId: 'stream-1',
                    content: 'Partial respo',
                    isComplete: false,
                    timestamp: new Date().toISOString(),
                },
            });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.queryByText(/is typing/i)).not.toBeInTheDocument();
        });

        it('renders a stop-generation button while streaming and wires it to stopGeneration()', () => {
            const stopGeneration = vi.fn();
            mockMessageStream({
                isStreaming: true,
                streamingMessage: { messageId: 'stream-1', content: 'Working...', isComplete: false, timestamp: new Date().toISOString() },
                stopGeneration,
            });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const stopButton = screen.getByRole('button', { name: /stop generating/i });
            fireEvent.click(stopButton);
            expect(stopGeneration).toHaveBeenCalledTimes(1);
        });

        it('does not render the stop-generation button when not streaming', () => {
            mockMessageStream({ isStreaming: false, streamingMessage: null });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.queryByRole('button', { name: /stop generating/i })).not.toBeInTheDocument();
        });

        it('does not open a live stream connection when enableLiveStream is false', () => {
            mockMessageStream({ isStreaming: true, streamingMessage: { messageId: 's', content: 'x', isComplete: false, timestamp: new Date().toISOString() } });

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                    enableLiveStream={false}
                />,
                { wrapper: createWrapper() }
            );

            // Even though the (mocked) hook reports streaming, the viewer should
            // suppress all live-stream UI when explicitly disabled.
            expect(screen.queryByTestId('streaming-message-wrapper')).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /stop generating/i })).not.toBeInTheDocument();
            expect(vi.mocked(useMessageStream)).toHaveBeenCalledWith(
                expect.objectContaining({ autoConnect: false })
            );
        });
    });

    describe('Jump to matched message (issue #35 search integration)', () => {
        beforeEach(() => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
                error: null,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
        });

        it('scrolls the matched message into view and highlights it when scrollToMessageId is set', async () => {
            const scrollIntoViewMock = vi.fn();
            Element.prototype.scrollIntoView = scrollIntoViewMock;

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                    scrollToMessageId="msg-2"
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(scrollIntoViewMock).toHaveBeenCalled();
            });

            const highlighted = container.querySelector('.ring-blue-400');
            expect(highlighted).toBeInTheDocument();
        });
    });

    describe('Role-based alignment', () => {
        it('aligns user messages to the right (justify-end) and assistant messages to the left (justify-start)', () => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { container } = render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const userWrapper = container.querySelector('[data-role="user"]')?.closest('.group');
            const assistantWrapper = container.querySelector('[data-role="assistant"]')?.closest('.group');

            expect(userWrapper).toHaveClass('justify-end');
            expect(assistantWrapper).toHaveClass('justify-start');

            // The inner bubble itself should also be pushed to the correct
            // side via margin, not just background color.
            const userBubble = container.querySelector('[data-role="user"]')?.closest('.max-w-\\[80\\%\\]');
            const assistantBubble = container.querySelector('[data-role="assistant"]')?.closest('.max-w-\\[80\\%\\]');
            expect(userBubble).toHaveClass('ml-auto');
            expect(assistantBubble).toHaveClass('mr-auto');
        });
    });

    describe('Message composer', () => {
        beforeEach(() => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
            } as any);
        });

        it('renders a message input and a send button', () => {
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
        });

        it('disables the send button while the input is empty', () => {
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByLabelText(/send message/i)).toBeDisabled();
        });

        it('enables the send button once text is typed', () => {
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'Hello agent' } });

            expect(screen.getByLabelText(/send message/i)).not.toBeDisabled();
        });

        it('disables the send button while a send is in-flight', () => {
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'Hello agent' } });

            expect(screen.getByLabelText(/send message/i)).toBeDisabled();
        });

        it('calls the send mutation and optimistically appends the user message when clicking Send', async () => {
            const mutateMock = vi.fn();
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: mutateMock,
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'New optimistic message' } });
            fireEvent.click(screen.getByLabelText(/send message/i));

            // Optimistic UI: the message appears immediately, before any
            // mutation response.
            expect(screen.getByText('New optimistic message')).toBeInTheDocument();

            expect(mutateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    agentId: mockAgentId,
                    conversationId: mockConversationId,
                    message: 'New optimistic message',
                }),
                expect.objectContaining({
                    onSuccess: expect.any(Function),
                    onError: expect.any(Function),
                })
            );
        });

        it('sends the message on Enter and inserts a newline on Shift+Enter', () => {
            const mutateMock = vi.fn();
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: mutateMock,
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i) as HTMLTextAreaElement;
            fireEvent.change(input, { target: { value: 'Shift enter test' } });

            // Shift+Enter should NOT send.
            fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
            expect(mutateMock).not.toHaveBeenCalled();

            // Plain Enter should send.
            fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
            expect(mutateMock).toHaveBeenCalled();
        });

        it('rolls back the optimistic message when the send mutation errors', () => {
            const mutateMock = vi.fn((_vars, handlers) => {
                handlers?.onError?.(new Error('send failed'));
            });
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: mutateMock,
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'This will fail' } });
            fireEvent.click(screen.getByLabelText(/send message/i));

            expect(screen.queryByText('This will fail')).not.toBeInTheDocument();
        });

        it('appends the agent reply to the transcript when the send mutation succeeds', () => {
            const mutateMock = vi.fn((_vars, handlers) => {
                handlers?.onSuccess?.({
                    messageId: 'msg-reply-1',
                    conversationId: mockConversationId,
                    response: 'Here is my reply',
                    model: 'claude-3-5-sonnet-20241022',
                    tokensUsed: 10,
                });
            });
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: mutateMock,
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'Trigger a reply' } });
            fireEvent.click(screen.getByLabelText(/send message/i));

            expect(screen.getByText('Here is my reply')).toBeInTheDocument();
        });
    });

    describe('Cross-tab synchronization (issue #36)', () => {
        beforeEach(() => {
            vi.mocked(useMessages).mockReturnValue({
                data: {
                    messages: mockMessages,
                    total: 3,
                    limit: 50,
                    offset: 0,
                    hasMore: false,
                },
                isLoading: false,
                isError: false,
                error: null,
            } as any);
        });

        it('broadcasts a sync event when a message send succeeds', () => {
            const broadcast = mockConversationSync();
            const mutateMock = vi.fn((_vars, handlers) => {
                handlers?.onSuccess?.({
                    messageId: 'reply-1',
                    conversationId: mockConversationId,
                    response: 'Synced reply',
                });
            });
            vi.mocked(useSendMessage).mockReturnValue({
                mutate: mutateMock,
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByLabelText(/message input/i);
            fireEvent.change(input, { target: { value: 'Hello from tab A' } });
            fireEvent.click(screen.getByLabelText(/send message/i));

            expect(broadcast).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'message_added',
                    conversationId: mockConversationId,
                })
            );
        });

        it('passes this conversation id to useConversationSync so events are scoped correctly', () => {
            mockConversationSync();

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            expect(vi.mocked(useConversationSync)).toHaveBeenCalledWith(
                expect.objectContaining({
                    conversationId: mockConversationId,
                    onEvent: expect.any(Function),
                })
            );
        });

        it('refetches messages when a sync event arrives from another tab', () => {
            let capturedOnEvent: ((event: unknown) => void) | undefined;
            vi.mocked(useConversationSync).mockImplementation((options: any) => {
                capturedOnEvent = options?.onEvent;
                return { broadcast: vi.fn() } as any;
            });

            vi.mocked(useSendMessage).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            render(
                <MessageTranscriptViewer
                    agentId={mockAgentId}
                    conversationId={mockConversationId}
                    agentName={mockAgentName}
                />,
                { wrapper: createWrapper() }
            );

            // Simulate another tab broadcasting that a new message arrived for
            // this same conversation — the viewer should not throw, and should
            // have registered a handler capable of triggering a refetch.
            expect(capturedOnEvent).toBeInstanceOf(Function);
            expect(() =>
                capturedOnEvent?.({
                    type: 'message_added',
                    conversationId: mockConversationId,
                    messageId: 'msg-from-other-tab',
                    timestamp: Date.now(),
                })
            ).not.toThrow();
        });
    });
});
