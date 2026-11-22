import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import ConversationListSidebar from '@/components/openclaw/ConversationListSidebar';
import type { Conversation, ConversationListResponse } from '@/types/conversation';
import type { OpenClawAgent, OpenClawAgentListResponse } from '@/types/openclaw';

// Mock the hooks
vi.mock('@/hooks/useConversations', () => ({
  useConversations: vi.fn(),
  useCreateConversation: vi.fn(),
  useDeleteConversation: vi.fn(),
}));

vi.mock('@/hooks/useOpenClawAgents', () => ({
  useAgentList: vi.fn(),
}));

import { useConversations, useCreateConversation, useDeleteConversation } from '@/hooks/useConversations';
import { useAgentList } from '@/hooks/useOpenClawAgents';

const mockUseConversations = vi.mocked(useConversations);
const mockUseCreateConversation = vi.mocked(useCreateConversation);
const mockUseDeleteConversation = vi.mocked(useDeleteConversation);
const mockUseAgentList = vi.mocked(useAgentList);

// Helper to wrap component with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

/** Builds a minimal-but-complete UseQueryResult for success/loading/error states. */
function buildQueryResult<T>(overrides: Partial<UseQueryResult<T, Error>>): UseQueryResult<T, Error> {
  const base = {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isPending: false,
    isSuccess: false,
    isLoadingError: false,
    isRefetchError: false,
    isInitialLoading: false,
    isRefetching: false,
    isStale: false,
    isPlaceholderData: false,
    isPaused: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    status: 'success',
    fetchStatus: 'idle',
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    refetch: vi.fn(),
    promise: Promise.resolve(overrides.data as T),
  };
  return { ...base, ...overrides } as unknown as UseQueryResult<T, Error>;
}

function mockConversationsSuccess(data: ConversationListResponse) {
  mockUseConversations.mockReturnValue(buildQueryResult<ConversationListResponse>({
    data,
    isSuccess: true,
    status: 'success',
  }));
}

function mockConversationsLoading() {
  mockUseConversations.mockReturnValue(buildQueryResult<ConversationListResponse>({
    isLoading: true,
    isPending: true,
    isInitialLoading: true,
    isFetching: true,
    isFetched: false,
    isFetchedAfterMount: false,
    status: 'pending',
    fetchStatus: 'fetching',
    dataUpdatedAt: 0,
  }));
}

function mockConversationsError(error: Error) {
  mockUseConversations.mockReturnValue(buildQueryResult<ConversationListResponse>({
    error,
    isError: true,
    isLoadingError: true,
    isFetched: false,
    isFetchedAfterMount: false,
    status: 'error',
    errorUpdatedAt: Date.now(),
    failureCount: 1,
    failureReason: error,
  }));
}

function mockAgentsSuccess(agents: OpenClawAgent[]) {
  const data: OpenClawAgentListResponse = { agents, total: agents.length, limit: 50, offset: 0 };
  mockUseAgentList.mockReturnValue(buildQueryResult<OpenClawAgentListResponse>({
    data,
    isSuccess: true,
    status: 'success',
  }));
}

function makeAgent(overrides: Partial<OpenClawAgent>): OpenClawAgent {
  return {
    id: 'agent-1',
    name: 'Linear Ticket Solver',
    persona: null,
    model: 'anthropic/claude-opus-4-5',
    userId: 'user-1',
    status: 'running',
    openclawSessionKey: null,
    openclawAgentId: null,
    heartbeatEnabled: false,
    heartbeatInterval: null,
    heartbeatChecklist: null,
    lastHeartbeatAt: null,
    nextHeartbeatAt: null,
    configuration: null,
    errorMessage: null,
    errorCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    provisionedAt: null,
    pausedAt: null,
    stoppedAt: null,
    ...overrides,
  };
}

// Mock agents
const mockAgents: OpenClawAgent[] = [
  makeAgent({ id: 'agent-1', name: 'Linear Ticket Solver' }),
  makeAgent({ id: 'agent-2', name: 'Team Slack Engineer' }),
];

// Mock conversation data (spanning two agents, mixed recency)
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agentId: 'agent-1',
    title: 'First Conversation',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    messageCount: 5,
  },
  {
    id: 'conv-2',
    agentId: 'agent-1',
    title: 'Second Conversation',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    messageCount: 3,
  },
  {
    id: 'conv-3',
    agentId: 'agent-2',
    title: 'Third Conversation',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    messageCount: 1,
  },
];

describe('ConversationListSidebar', () => {
  const mockOnSelectConversation = vi.fn();
  const mockOnNewConversation = vi.fn();
  const createConversationMock = vi.fn();
  const deleteConversationMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCreateConversation.mockReturnValue({
      mutate: createConversationMock,
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
      status: 'idle',
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      isPaused: false,
      submittedAt: 0,
    } as unknown as ReturnType<typeof useCreateConversation>);

    mockUseDeleteConversation.mockReturnValue({
      mutate: deleteConversationMock,
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
      status: 'idle',
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      isPaused: false,
      submittedAt: 0,
    } as unknown as ReturnType<typeof useDeleteConversation>);

    mockAgentsSuccess(mockAgents);
  });

  function renderSidebar(selectedConversationId: string | null = null) {
    return renderWithQueryClient(
      <ConversationListSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );
  }

  describe('Rendering', () => {
    it('should render loading state when conversations are being fetched', () => {
      mockConversationsLoading();
      renderSidebar();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render empty state when there are no conversations', () => {
      mockConversationsSuccess({ conversations: [], total: 0, limit: 50, offset: 0 });
      renderSidebar();
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    });

    it('should render conversation list when conversations exist', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      expect(screen.getByText('First Conversation')).toBeInTheDocument();
      expect(screen.getByText('Second Conversation')).toBeInTheDocument();
      expect(screen.getByText('Third Conversation')).toBeInTheDocument();
    });

    it('should render "New Conversation" button', () => {
      mockConversationsSuccess({ conversations: [], total: 0, limit: 50, offset: 0 });
      renderSidebar();
      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
    });

    it('should render search input', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();
      expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    });

    it('should display relative timestamps for conversations', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
      expect(screen.getByText(/1d ago/i)).toBeInTheDocument();
    });

    it('should display message count for each conversation', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      expect(screen.getByText(/5 messages/i)).toBeInTheDocument();
      expect(screen.getByText(/3 messages/i)).toBeInTheDocument();
      expect(screen.getByText(/1 message\b/i)).toBeInTheDocument();
    });
  });

  describe('Grouping by agent', () => {
    it('should render a group header with the agent name for each agent', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      expect(screen.getByText('Linear Ticket Solver')).toBeInTheDocument();
      expect(screen.getByText('Team Slack Engineer')).toBeInTheDocument();
    });

    it('should render an avatar for each agent group', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const avatars = screen.getAllByTestId('agent-avatar');
      expect(avatars.length).toBe(2); // agent-1 and agent-2
      expect(avatars.some((el) => el.textContent === 'LT')).toBe(true); // Linear Ticket Solver
      expect(avatars.some((el) => el.textContent === 'TS')).toBe(true); // Team Slack Engineer
    });

    it('should group conversations under their respective agent', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const agent1Group = screen.getByRole('group', { name: /linear ticket solver conversations/i });
      const agent2Group = screen.getByRole('group', { name: /team slack engineer conversations/i });

      expect(agent1Group).toContainElement(screen.getByText('First Conversation'));
      expect(agent1Group).toContainElement(screen.getByText('Second Conversation'));
      expect(agent2Group).toContainElement(screen.getByText('Third Conversation'));
    });

    it('should order agent groups by most recently active conversation first', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const groupHeadings = screen.getAllByRole('group').map((el) => el.getAttribute('aria-label'));
      // agent-2's conversation (10 min ago) is more recent than agent-1's most recent (2h ago)
      expect(groupHeadings[0]).toMatch(/team slack engineer/i);
      expect(groupHeadings[1]).toMatch(/linear ticket solver/i);
    });

    it('should sort conversations within a group by most recent first', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const agent1Group = screen.getByRole('group', { name: /linear ticket solver conversations/i });
      const titles = Array.from(agent1Group.querySelectorAll('h4')).map((el) => el.textContent);
      // conv-1 (2h ago) is more recent than conv-2 (1d ago)
      expect(titles).toEqual(['First Conversation', 'Second Conversation']);
    });
  });

  describe('Interaction', () => {
    it('should call onSelectConversation when a conversation is clicked', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const firstConversation = screen.getByText('First Conversation');
      await user.click(firstConversation);

      expect(mockOnSelectConversation).toHaveBeenCalledWith('conv-1');
    });

    it('should call onNewConversation when "New Conversation" button is clicked', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: [], total: 0, limit: 50, offset: 0 });
      renderSidebar();

      const newButton = screen.getByRole('button', { name: /new conversation/i });
      await user.click(newButton);

      expect(mockOnNewConversation).toHaveBeenCalled();
    });

    it('should highlight the selected conversation', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar('conv-1');

      const firstConvContainer = screen.getByText('First Conversation').closest('div[class*="bg-blue-50"]');
      expect(firstConvContainer).toBeInTheDocument();
      expect(firstConvContainer).toHaveClass('bg-blue-50');
    });

    it('should call delete mutation with the conversation’s own agentId when delete button is clicked', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const deleteButtons = screen.getAllByLabelText(/delete conversation/i);
      expect(deleteButtons).toHaveLength(3);

      // First rendered group is agent-2 (most recent); click its conversation's delete button
      await user.click(deleteButtons[0]);

      expect(deleteConversationMock).toHaveBeenCalledWith({
        conversationId: 'conv-3',
        agentId: 'agent-2',
      });
    });
  });

  describe('Search/Filter', () => {
    it('should filter conversations based on search input', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const searchInput = screen.getByPlaceholderText(/search conversations/i);
      await user.type(searchInput, 'First');

      await waitFor(() => {
        expect(screen.getByText('First Conversation')).toBeInTheDocument();
        expect(screen.queryByText('Second Conversation')).not.toBeInTheDocument();
        expect(screen.queryByText('Third Conversation')).not.toBeInTheDocument();
      });
    });

    it('should filter conversations by agent name', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const searchInput = screen.getByPlaceholderText(/search conversations/i);
      await user.type(searchInput, 'Slack Engineer');

      await waitFor(() => {
        expect(screen.getByText('Third Conversation')).toBeInTheDocument();
        expect(screen.queryByText('First Conversation')).not.toBeInTheDocument();
        expect(screen.queryByText('Second Conversation')).not.toBeInTheDocument();
      });
    });

    it('should show "no results" message when search has no matches', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const searchInput = screen.getByPlaceholderText(/search conversations/i);
      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText(/no matching conversations/i)).toBeInTheDocument();
    });

    it('should be case-insensitive when searching', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const searchInput = screen.getByPlaceholderText(/search conversations/i);
      await user.type(searchInput, 'first');

      expect(screen.getByText('First Conversation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search conversations/i)).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      mockConversationsSuccess({ conversations: mockConversations, total: 3, limit: 50, offset: 0 });
      renderSidebar();

      const firstConvButton = screen.getByLabelText(/select conversation first conversation/i);
      expect(firstConvButton).toBeInTheDocument();

      await user.click(firstConvButton);

      await waitFor(() => {
        expect(mockOnSelectConversation).toHaveBeenCalledWith('conv-1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when conversations fail to load', () => {
      mockConversationsError(new Error('Failed to fetch'));
      renderSidebar();
      expect(screen.getByText(/error loading conversations/i)).toBeInTheDocument();
    });
  });

  describe('Single-agent scope', () => {
    it('still groups (into a single group) when an agentId is provided', () => {
      mockConversationsSuccess({
        conversations: mockConversations.filter((c) => c.agentId === 'agent-1'),
        total: 2,
        limit: 50,
        offset: 0,
      });

      renderWithQueryClient(
        <ConversationListSidebar
          agentId="agent-1"
          selectedConversationId={null}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(mockUseConversations.mock.calls[0]?.[0]).toBe('agent-1');
      expect(screen.getAllByRole('group')).toHaveLength(1);
      expect(screen.getByText('Linear Ticket Solver')).toBeInTheDocument();
    });
  });
});
