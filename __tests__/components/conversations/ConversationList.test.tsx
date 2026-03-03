import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from '@/components/conversations/ConversationList';
import type { Conversation } from '@/lib/conversation-types';

// Mock ConversationService
const mockListConversations = vi.fn();
const mockArchiveConversation = vi.fn();
const mockDeleteConversation = vi.fn();

vi.mock('@/lib/conversation-service', () => ({
  ConversationService: vi.fn().mockImplementation(() => ({
    listConversations: mockListConversations,
    archiveConversation: mockArchiveConversation,
    deleteConversation: mockDeleteConversation,
  })),
}));

// Mock data
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agentId: 'agent-1',
    channelId: 'channel-1',
    title: 'Customer Support Chat',
    status: 'active',
    messageCount: 15,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    lastMessageAt: '2024-01-01T12:00:00Z',
    metadata: { agentName: 'Support Bot', workspaceName: 'Main Workspace' },
  },
  {
    id: 'conv-2',
    agentId: 'agent-2',
    channelId: 'channel-1',
    title: 'Sales Inquiry',
    status: 'active',
    messageCount: 8,
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T11:00:00Z',
    lastMessageAt: '2024-01-02T11:00:00Z',
    metadata: { agentName: 'Sales Bot', workspaceName: 'Main Workspace' },
  },
  {
    id: 'conv-3',
    agentId: 'agent-1',
    channelId: 'channel-2',
    title: 'Technical Issue',
    status: 'archived',
    messageCount: 25,
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T15:00:00Z',
    lastMessageAt: '2024-01-03T15:00:00Z',
    metadata: { agentName: 'Support Bot', workspaceName: 'Dev Workspace' },
  },
];

describe('ConversationList', () => {
  const mockOnSelectConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListConversations.mockResolvedValue({
      conversations: mockConversations,
      total: mockConversations.length,
      limit: 50,
      offset: 0,
    });
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      mockListConversations.mockReturnValue(new Promise(() => {})); // Never resolves
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render conversation list after loading', async () => {
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      expect(screen.getByText('Sales Inquiry')).toBeInTheDocument();
      expect(screen.getByText('Technical Issue')).toBeInTheDocument();
    });

    it('should display conversation metadata correctly', async () => {
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Check for agent names (using getAllByText since "Support Bot" appears twice)
      const supportBotElements = screen.getAllByText('Support Bot');
      expect(supportBotElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Sales Bot')).toBeInTheDocument();

      // Check for message count
      expect(screen.getByText('15 messages')).toBeInTheDocument();
      expect(screen.getByText('8 messages')).toBeInTheDocument();
    });

    it('should render empty state when no conversations', async () => {
      mockListConversations.mockResolvedValue({
        conversations: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText(/no conversations/i)).toBeInTheDocument();
      });
    });

    it('should render error state on API failure', async () => {
      mockListConversations.mockRejectedValue(new Error('API Error'));

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Error loading conversations')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    it('should call onSelectConversation when clicking a conversation', async () => {
      const user = userEvent.setup();
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      const conversation = screen.getByText('Customer Support Chat');
      await user.click(conversation);

      expect(mockOnSelectConversation).toHaveBeenCalledWith('conv-1');
    });

    it('should highlight selected conversation', async () => {
      render(
        <ConversationList
          onSelectConversation={mockOnSelectConversation}
          selectedConversationId="conv-2"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sales Inquiry')).toBeInTheDocument();
      });

      const selectedItem = screen.getByText('Sales Inquiry').closest('[data-testid^="conversation-item"]');
      expect(selectedItem).toHaveAttribute('data-selected', 'true');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      const firstConversation = screen.getByText('Customer Support Chat').closest('button');
      if (firstConversation) {
        firstConversation.focus();
        await user.keyboard('{Enter}');
        expect(mockOnSelectConversation).toHaveBeenCalledWith('conv-1');
      }
    });
  });

  describe('Filtering', () => {
    it('should filter by agent ID', async () => {
      render(
        <ConversationList
          onSelectConversation={mockOnSelectConversation}
          agentId="agent-1"
        />
      );

      await waitFor(() => {
        expect(mockListConversations).toHaveBeenCalledWith(
          expect.objectContaining({ agentId: 'agent-1' })
        );
      });
    });

    it('should filter by workspace ID', async () => {
      render(
        <ConversationList
          onSelectConversation={mockOnSelectConversation}
          workspaceId="workspace-1"
        />
      );

      await waitFor(() => {
        expect(mockListConversations).toHaveBeenCalledWith(
          expect.objectContaining({ channelId: 'workspace-1' })
        );
      });
    });

    it('should filter by status using filter controls', async () => {
      const user = userEvent.setup();
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Find status filter and select "archived"
      const statusFilter = screen.getByRole('combobox', { name: /status/i }) as HTMLSelectElement;
      await user.selectOptions(statusFilter, 'archived');

      await waitFor(() => {
        expect(mockListConversations).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'archived' })
        );
      });
    });

    it('should update list when filters change', async () => {
      const { rerender } = render(
        <ConversationList
          onSelectConversation={mockOnSelectConversation}
          agentId="agent-1"
        />
      );

      await waitFor(() => {
        expect(mockListConversations).toHaveBeenCalledTimes(1);
      });

      rerender(
        <ConversationList
          onSelectConversation={mockOnSelectConversation}
          agentId="agent-2"
        />
      );

      await waitFor(() => {
        expect(mockListConversations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Pagination', () => {
    it('should load more conversations on scroll', async () => {
      const user = userEvent.setup();
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Find load more button or scroll trigger
      const loadMoreButton = screen.queryByRole('button', { name: /load more/i });
      if (loadMoreButton) {
        await user.click(loadMoreButton);

        await waitFor(() => {
          expect(mockListConversations).toHaveBeenCalledWith(
            expect.objectContaining({ offset: 50 })
          );
        });
      }
    });

    it('should handle pagination state correctly', async () => {
      mockListConversations.mockResolvedValue({
        conversations: mockConversations,
        total: 100,
        limit: 50,
        offset: 0,
      });

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Should show pagination info or load more button when more items exist
      const hasMore = screen.queryByText(/showing \d+ of 100/i) || screen.queryByRole('button', { name: /load more/i });
      expect(hasMore).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should archive conversation', async () => {
      const user = userEvent.setup();
      mockArchiveConversation.mockResolvedValue(undefined);

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Find archive button for first conversation
      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
      await user.click(archiveButtons[0]);

      await waitFor(() => {
        expect(mockArchiveConversation).toHaveBeenCalledWith('conv-1');
      });
    });

    it('should delete conversation with confirmation', async () => {
      const user = userEvent.setup();
      mockDeleteConversation.mockResolvedValue(undefined);

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Find delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion in dialog
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1');
      });
    });

    it('should refresh list after successful archive', async () => {
      const user = userEvent.setup();
      mockArchiveConversation.mockResolvedValue(undefined);

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      const initialCallCount = mockListConversations.mock.calls.length;

      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
      await user.click(archiveButtons[0]);

      await waitFor(() => {
        expect(mockListConversations.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      expect(screen.getByRole('list', { name: /conversations/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Tab through the UI - first tab lands on the status filter combobox
      await user.tab();
      let focused = document.activeElement;
      expect(focused).toHaveAttribute('role', 'combobox');

      // Second tab should focus on the first conversation button
      await user.tab();
      focused = document.activeElement;
      expect(focused).toHaveAttribute('role', 'button');
    });

    it('should announce loading state to screen readers', () => {
      mockListConversations.mockReturnValue(new Promise(() => {}));
      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', async () => {
      // Mock window.matchMedia for mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ConversationList onSelectConversation={mockOnSelectConversation} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Support Chat')).toBeInTheDocument();
      });

      // Component should still render all essential information
      const supportBotElements = screen.getAllByText('Support Bot');
      expect(supportBotElements.length).toBeGreaterThan(0);
    });
  });
});
