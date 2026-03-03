import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageTranscript } from '@/components/conversations/MessageTranscript';
import { Message } from '@/lib/conversation-types';

describe('MessageTranscript', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Hello, how are you?',
      timestamp: '2024-03-02T10:00:00Z',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'I am doing well, thank you!',
      timestamp: '2024-03-02T10:00:30Z',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      role: 'user',
      content: 'What can you help me with?',
      timestamp: '2024-03-02T10:01:00Z',
    },
  ];

  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  describe('Rendering', () => {
    it('should render all messages', () => {
      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
      expect(screen.getByText('What can you help me with?')).toBeInTheDocument();
    });

    it('should render empty state when no messages', () => {
      render(<MessageTranscript conversationId="conv-1" messages={[]} />);

      expect(screen.getByText(/no messages/i)).toBeInTheDocument();
    });

    it('should render messages in chronological order', () => {
      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} />);

      const messages = screen.getAllByRole('article');
      expect(messages).toHaveLength(3);

      // First message should be the user message
      expect(messages[0]).toHaveTextContent('Hello, how are you?');
      // Second message should be assistant
      expect(messages[1]).toHaveTextContent('I am doing well, thank you!');
      // Third message should be user again
      expect(messages[2]).toHaveTextContent('What can you help me with?');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<MessageTranscript conversationId="conv-1" messages={[]} isLoading={true} />);

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should not show messages when loading', () => {
      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} isLoading={true} />);

      expect(screen.queryByText('Hello, how are you?')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={[]}
          error="Failed to load messages"
        />
      );

      expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const onRetry = vi.fn();
      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={[]}
          error="Network error"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={[]}
          error="Network error"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination / Load More', () => {
    it('should show "Load More" button when hasMore is true', () => {
      render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} hasMore={true} />
      );

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    it('should not show "Load More" button when hasMore is false', () => {
      render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} hasMore={false} />
      );

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('should call onLoadMore when "Load More" button is clicked', async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();

      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={mockMessages}
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreButton);

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should disable "Load More" button when loading more messages', () => {
      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={mockMessages}
          hasMore={true}
          isLoadingMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /loading/i });
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe('Auto-scroll', () => {
    it('should scroll to bottom on initial render', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} />);

      // Should call scrollIntoView on the last message
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it('should scroll to bottom when new message is added', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} />
      );

      const newMessages = [
        ...mockMessages,
        {
          id: 'msg-4',
          conversationId: 'conv-1',
          role: 'assistant',
          content: 'New message',
          timestamp: '2024-03-02T10:02:00Z',
        },
      ];

      rerender(<MessageTranscript conversationId="conv-1" messages={newMessages} />);

      // Should have called scrollIntoView again
      expect(scrollIntoViewMock.mock.calls.length).toBeGreaterThan(1);
    });

    it('should not auto-scroll when loading more historical messages', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} />
      );

      scrollIntoViewMock.mockClear();

      const olderMessages = [
        {
          id: 'msg-0',
          conversationId: 'conv-1',
          role: 'user',
          content: 'Earlier message',
          timestamp: '2024-03-02T09:59:00Z',
        },
        ...mockMessages,
      ];

      rerender(
        <MessageTranscript
          conversationId="conv-1"
          messages={olderMessages}
          isLoadingMore={true}
        />
      );

      // Should not scroll when loading older messages
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have a proper container role', () => {
      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} />);

      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('should have accessible loading announcement', () => {
      render(<MessageTranscript conversationId="conv-1" messages={[]} isLoading={true} />);

      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible error announcement', () => {
      render(
        <MessageTranscript
          conversationId="conv-1"
          messages={[]}
          error="Failed to load"
        />
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
    });

    it('should support keyboard navigation for Load More button', () => {
      render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} hasMore={true} />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      expect(loadMoreButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive container classes', () => {
      const { container } = render(
        <MessageTranscript conversationId="conv-1" messages={mockMessages} />
      );

      const transcriptContainer = container.querySelector('[data-testid="message-transcript"]');
      expect(transcriptContainer).toHaveClass('p-4', 'md:p-6');
    });

    it('should have proper spacing between messages on mobile', () => {
      render(<MessageTranscript conversationId="conv-1" messages={mockMessages} />);

      const messages = screen.getAllByRole('article');
      messages.forEach((message) => {
        expect(message).toHaveClass('mb-4');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages gracefully', () => {
      const longMessage: Message = {
        id: 'msg-long',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'A'.repeat(10000),
        timestamp: '2024-03-02T10:00:00Z',
      };

      render(<MessageTranscript conversationId="conv-1" messages={[longMessage]} />);

      expect(screen.getByText(/A{100}/)).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const specialMessage: Message = {
        id: 'msg-special',
        conversationId: 'conv-1',
        role: 'user',
        content: '<script>alert("xss")</script>',
        timestamp: '2024-03-02T10:00:00Z',
      };

      render(<MessageTranscript conversationId="conv-1" messages={[specialMessage]} />);

      // Should render as text, not execute
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    });

    it('should handle rapid message updates', () => {
      const { rerender } = render(
        <MessageTranscript conversationId="conv-1" messages={[mockMessages[0]]} />
      );

      // Simulate rapid updates
      for (let i = 1; i < mockMessages.length; i++) {
        rerender(
          <MessageTranscript
            conversationId="conv-1"
            messages={mockMessages.slice(0, i + 1)}
          />
        );
      }

      expect(screen.getAllByRole('article')).toHaveLength(3);
    });
  });
});
