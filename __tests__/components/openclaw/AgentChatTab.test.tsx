import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentChatTab from '@/components/openclaw/AgentChatTab';
import conversationService from '@/lib/conversation-service';
import { openclawService } from '@/lib/openclaw-service';
import { ApiError } from '@/lib/api-client';
import type { OpenClawAgent } from '@/types/openclaw';

// Mock the services (not raw fetch) so these tests assert the component goes
// through the shared apiClient-backed service layer -- see issue #125, where
// AgentChatTab previously called fetch() directly and never sent an auth
// header.
vi.mock('@/lib/conversation-service', () => ({
  default: {
    listConversations: vi.fn(),
    listMessages: vi.fn(),
  },
}));

vi.mock('@/lib/openclaw-service', () => ({
  openclawService: {
    sendMessage: vi.fn(),
  },
}));

const mockAgent: OpenClawAgent = {
  id: 'agent-123',
  name: 'Test Agent',
  persona: 'A helpful assistant.',
  model: 'anthropic/claude-sonnet-4',
  status: 'running',
  heartbeatEnabled: false,
  heartbeatInterval: '15m',
  heartbeatChecklist: [],
  configuration: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as unknown as OpenClawAgent;

const mockedConversationService = vi.mocked(conversationService);
const mockedOpenclawService = vi.mocked(openclawService);

describe('AgentChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads chat history through conversationService, never via raw fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    mockedConversationService.listConversations.mockResolvedValue({
      conversations: [
        {
          id: 'conv-1',
          agentId: mockAgent.id,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          lastMessageAt: '2026-01-01T00:00:00Z',
          messageCount: 1,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    mockedConversationService.listMessages.mockResolvedValue({
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          role: 'assistant',
          content: 'Hello there',
          timestamp: '2026-01-01T00:00:01Z',
        },
      ],
      total: 1,
      limit: 100,
      offset: 0,
    });

    render(<AgentChatTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
    });

    expect(mockedConversationService.listConversations).toHaveBeenCalledWith(mockAgent.id);
    expect(mockedConversationService.listMessages).toHaveBeenCalledWith('conv-1', 100);
    // The component must never issue a bare fetch() itself -- all requests
    // should flow through the apiClient-backed service mocks above.
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('does not throw and shows an empty state when loading conversations fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockedConversationService.listConversations.mockRejectedValue(
      new ApiError(500, 'Internal server error')
    );

    expect(() => render(<AgentChatTab agent={mockAgent} />)).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText("Couldn't load this conversation.")).toBeInTheDocument();
    });

    // The failure is a handled condition (clean early return / caught error)
    // and must be logged quietly, not via console.error, so it doesn't trip
    // Next.js's dev-mode error overlay.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('treats a 404 (no conversation history yet) as a normal empty state, not an error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockedConversationService.listConversations.mockRejectedValue(
      new ApiError(404, 'Not found')
    );

    render(<AgentChatTab agent={mockAgent} />);

    await waitFor(() => {
      expect(
        screen.getByText('Send a message to start chatting with your agent.', { exact: false })
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Couldn't load this conversation.")).not.toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('sends a new message through openclawService.sendMessage with the agent id', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch');

    mockedConversationService.listConversations.mockResolvedValue({
      conversations: [],
      total: 0,
      limit: 50,
      offset: 0,
    });
    mockedOpenclawService.sendMessage.mockResolvedValue({
      messageId: 'msg-reply-1',
      conversationId: 'conv-new',
      response: 'Hi! How can I help?',
    });

    render(<AgentChatTab agent={mockAgent} />);

    await waitFor(() => {
      expect(
        screen.getByText('Send a message to start chatting with your agent.', { exact: false })
      ).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Chat message input');
    await user.type(input, 'Hello agent');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument();
    });

    expect(mockedOpenclawService.sendMessage).toHaveBeenCalledWith({
      agentId: mockAgent.id,
      conversationId: undefined,
      message: 'Hello agent',
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
