import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { openclawService } from '@/lib/openclaw-service';
import type { Message, MessageListResponse } from '@/types/openclaw';

// Mock the openclaw service
vi.mock('@/lib/openclaw-service', () => ({
    openclawService: {
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
    },
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

describe('useMessages Hook', () => {
    const mockAgentId = 'agent-123';
    const mockConversationId = 'conv-456';

    const mockMessages: Message[] = [
        {
            id: 'msg-1',
            conversationId: mockConversationId,
            agentId: mockAgentId,
            role: 'user',
            content: 'Hello',
            timestamp: '2026-03-08T10:00:00Z',
        },
        {
            id: 'msg-2',
            conversationId: mockConversationId,
            agentId: mockAgentId,
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2026-03-08T10:00:01Z',
            model: 'claude-3-5-sonnet-20241022',
            tokensUsed: 42,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useMessages', () => {
        it('should fetch messages for an agent and conversation', async () => {
            const mockResponse: MessageListResponse = {
                messages: mockMessages,
                total: 2,
                limit: 50,
                offset: 0,
                hasMore: false,
            };

            vi.mocked(openclawService.getMessages).mockResolvedValue(mockResponse);

            const { result } = renderHook(
                () => useMessages(mockAgentId, mockConversationId),
                { wrapper: createWrapper() }
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toEqual(mockResponse);
            expect(result.current.data?.messages).toHaveLength(2);
            expect(openclawService.getMessages).toHaveBeenCalledWith(
                mockAgentId,
                mockConversationId,
                expect.any(Number),
                expect.any(Number)
            );
        });

        it('should support pagination with limit and offset', async () => {
            const mockResponse: MessageListResponse = {
                messages: [mockMessages[0]],
                total: 10,
                limit: 1,
                offset: 5,
                hasMore: true,
            };

            vi.mocked(openclawService.getMessages).mockResolvedValue(mockResponse);

            const { result } = renderHook(
                () => useMessages(mockAgentId, mockConversationId, 1, 5),
                { wrapper: createWrapper() }
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.hasMore).toBe(true);
            expect(result.current.data?.offset).toBe(5);
            expect(openclawService.getMessages).toHaveBeenCalledWith(
                mockAgentId,
                mockConversationId,
                1,
                5
            );
        });

        it('should handle empty message list', async () => {
            const mockResponse: MessageListResponse = {
                messages: [],
                total: 0,
                limit: 50,
                offset: 0,
                hasMore: false,
            };

            vi.mocked(openclawService.getMessages).mockResolvedValue(mockResponse);

            const { result } = renderHook(
                () => useMessages(mockAgentId, mockConversationId),
                { wrapper: createWrapper() }
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.messages).toHaveLength(0);
            expect(result.current.data?.hasMore).toBe(false);
        });

        it('should handle fetch errors gracefully', async () => {
            const errorMessage = 'Failed to fetch messages';
            vi.mocked(openclawService.getMessages).mockRejectedValue(
                new Error(errorMessage)
            );

            const { result } = renderHook(
                () => useMessages(mockAgentId, mockConversationId),
                { wrapper: createWrapper() }
            );

            await waitFor(() => expect(result.current.isError).toBe(true));

            expect(result.current.error).toBeDefined();
            expect(result.current.data).toBeUndefined();
        });

        it('should refetch when agent or conversation changes', async () => {
            const mockResponse1: MessageListResponse = {
                messages: [mockMessages[0]],
                total: 1,
                limit: 50,
                offset: 0,
                hasMore: false,
            };

            const mockResponse2: MessageListResponse = {
                messages: [mockMessages[1]],
                total: 1,
                limit: 50,
                offset: 0,
                hasMore: false,
            };

            vi.mocked(openclawService.getMessages)
                .mockResolvedValueOnce(mockResponse1)
                .mockResolvedValueOnce(mockResponse2);

            const { result, rerender } = renderHook(
                ({ agentId, conversationId }) => useMessages(agentId, conversationId),
                {
                    wrapper: createWrapper(),
                    initialProps: { agentId: 'agent-1', conversationId: 'conv-1' },
                }
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.messages).toHaveLength(1);

            // Change conversation
            rerender({ agentId: 'agent-1', conversationId: 'conv-2' });

            await waitFor(() => expect(openclawService.getMessages).toHaveBeenCalledTimes(2));
        });
    });

    describe('useSendMessage', () => {
        it('should send a message and invalidate queries', async () => {
            const mockResponse = {
                messageId: 'msg-new',
                conversationId: mockConversationId,
                response: 'Got it!',
                model: 'claude-3-5-sonnet-20241022',
                tokensUsed: 35,
            };

            vi.mocked(openclawService.sendMessage).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useSendMessage(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                agentId: mockAgentId,
                conversationId: mockConversationId,
                message: 'Test message',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(openclawService.sendMessage).toHaveBeenCalledWith({
                agentId: mockAgentId,
                conversationId: mockConversationId,
                message: 'Test message',
            });
            expect(result.current.data).toEqual(mockResponse);
        });

        it('should handle send errors', async () => {
            const errorMessage = 'Failed to send message';
            vi.mocked(openclawService.sendMessage).mockRejectedValue(
                new Error(errorMessage)
            );

            const { result } = renderHook(() => useSendMessage(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                agentId: mockAgentId,
                message: 'Test',
            });

            await waitFor(() => expect(result.current.isError).toBe(true));

            expect(result.current.error).toBeDefined();
        });

        it('should create new conversation when conversationId not provided', async () => {
            const mockResponse = {
                messageId: 'msg-new',
                conversationId: 'conv-new',
                response: 'New conversation started',
            };

            vi.mocked(openclawService.sendMessage).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useSendMessage(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                agentId: mockAgentId,
                message: 'Start new chat',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.conversationId).toBe('conv-new');
            expect(openclawService.sendMessage).toHaveBeenCalledWith({
                agentId: mockAgentId,
                message: 'Start new chat',
            });
        });
    });
});
