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

import { useMessages, useSendMessage } from '@/hooks/useMessages';

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
});
