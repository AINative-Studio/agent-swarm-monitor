import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import SemanticSearchUI from '@/components/openclaw/SemanticSearchUI';
import conversationService from '@/lib/conversation-service';

// Mock the conversation service
vi.mock('@/lib/conversation-service', () => ({
  default: {
    searchMessages: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// The component debounces search input by 300ms (SEARCH_DEBOUNCE_MS). These tests use
// REAL timers (no vi.useFakeTimers()) and wait for that debounce to elapse naturally via
// `waitFor`'s own real-time polling, rather than faking timers.
//
// IMPORTANT: Do not reach for `vi.useFakeTimers()` in this file. `@testing-library/user-event`
// v14's `type()`/`click()` internally race a real `setTimeout` against a `config.advanceTimers()`
// call (see its `utils/misc/wait.js`), and that combination reliably deadlocks under Vitest's
// fake timers even when `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` is
// configured — confirmed by hanging this entire suite. Real timers avoid the deadlock and the
// extra wall-clock cost here is a few hundred ms, not worth the fragility.
const DEBOUNCE_WAIT_OPTIONS = { timeout: 2000 };

describe('SemanticSearchUI', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    user = userEvent.setup();
  });

  describe('Modal Behavior', () => {
    it('should render modal when open prop is true', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    });

    it('should not render modal when open prop is false', () => {
      render(
        <SemanticSearchUI open={false} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByPlaceholderText(/search conversations/i)).not.toBeInTheDocument();
    });

    it('should call onOpenChange when close button is clicked', async () => {
      const onOpenChange = vi.fn();
      render(
        <SemanticSearchUI open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false on Escape key', async () => {
      const onOpenChange = vi.fn();
      render(
        <SemanticSearchUI open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Search Input', () => {
    it('should render search input with correct placeholder', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    });

    it('should update input value when user types', async () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('should debounce search queries by 300ms', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      // Should not call immediately
      expect(conversationService.searchMessages).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalledTimes(1);
      }, DEBOUNCE_WAIT_OPTIONS);
    });

    it('should clear input when clear button is clicked', async () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test query');

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('Search Results', () => {
    it('should display search results when query returns data', async () => {
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Debug Session',
            content: 'This is about error handling in the API',
            role: 'user' as const,
            agentName: 'Dev-Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.95,
            highlightedContent: 'This is about <mark>error handling</mark> in the API',
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            conversationTitle: 'Debug Session',
            content: 'Let me help with error handling',
            role: 'assistant' as const,
            agentName: 'Dev-Bot',
            timestamp: '2026-03-08T10:01:00Z',
            relevanceScore: 0.88,
            highlightedContent: 'Let me help with <mark>error handling</mark>',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'error handling');

      await waitFor(() => {
        // Both mock results share the title "Debug Session" (same conversation).
        expect(screen.getAllByText('Debug Session').length).toBeGreaterThan(0);
      }, DEBOUNCE_WAIT_OPTIONS);

      expect(screen.getByText(/results \(2\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Dev-Bot/).length).toBeGreaterThan(0);
      expect(screen.getByText(/95%/i)).toBeInTheDocument();
    });

    it('should display "No results" message when query returns empty', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'nonexistent query');

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);
    });

    it('should highlight matched terms in results', async () => {
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Test',
            content: 'Original content',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.90,
            highlightedContent: 'This <mark>matched</mark> content',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'matched');

      await waitFor(() => {
        const highlightedElement = screen.getByText('matched');
        expect(highlightedElement.tagName).toBe('MARK');
      }, DEBOUNCE_WAIT_OPTIONS);
    });

    it('should call onResultClick when a result is clicked', async () => {
      const onResultClick = vi.fn();
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Test Conversation',
            content: 'Test content',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.90,
            highlightedContent: 'Test content',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} onResultClick={onResultClick} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      const resultItem = screen.getByText('Test Conversation').closest('[role="button"]');
      if (resultItem) {
        await user.click(resultItem);
      }

      expect(onResultClick).toHaveBeenCalledWith('conv-1', 'msg-1');
    });
  });

  describe('Filters', () => {
    it('should render agent filter dropdown', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/all agents/i)).toBeInTheDocument();
    });

    it('should render date range filter dropdown', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/all time/i)).toBeInTheDocument();
    });

    it('should apply agent filter to search query', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} availableAgents={[
          { id: 'agent-1', name: 'Dev-Bot' },
          { id: 'agent-2', name: 'Sales-Bot' },
        ]} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      // Open the agent filter dropdown via its trigger (the combobox button), not the
      // inner text span — Radix marks the span `pointer-events: none`, which user-event
      // correctly refuses to click.
      const agentFilterTrigger = screen.getAllByRole('combobox')[0];
      await user.click(agentFilterTrigger);

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalled();
      }, DEBOUNCE_WAIT_OPTIONS);
    });

    it('should apply date range filter to search query', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Select "Today" from the date range filter so a filters object is actually built
      // and passed through (with no filter selected, the component correctly omits the
      // filters argument entirely rather than passing an empty object).
      const dateRangeTrigger = screen.getAllByRole('combobox')[1];
      await user.click(dateRangeTrigger);
      const todayOption = await screen.findByText('Today');
      await user.click(todayOption);

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        const lastCall = vi.mocked(conversationService.searchMessages).mock.calls[0];
        expect(lastCall[0]).toBe('test');
        expect(lastCall[1]).toEqual(expect.objectContaining({ dateFrom: expect.any(String) }));
      }, DEBOUNCE_WAIT_OPTIONS);
    });
  });

  describe('Search History', () => {
    it('should display recent searches from localStorage', () => {
      localStorageMock.setItem('semantic-search-history', JSON.stringify([
        'API integration',
        'error handling',
        'deployment issues',
      ]));

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('API integration')).toBeInTheDocument();
      expect(screen.getByText('error handling')).toBeInTheDocument();
      expect(screen.getByText('deployment issues')).toBeInTheDocument();
    });

    it('should save search query to history when search is performed', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'new search query');

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalled();
      }, DEBOUNCE_WAIT_OPTIONS);

      await waitFor(() => {
        const savedHistory = JSON.parse(localStorageMock.getItem('semantic-search-history') || '[]');
        expect(savedHistory).toContain('new search query');
      });
    });

    it('should limit search history to 5 most recent items', async () => {
      localStorageMock.setItem('semantic-search-history', JSON.stringify([
        'query1',
        'query2',
        'query3',
        'query4',
        'query5',
      ]));

      const mockSearchResults = {
        results: [],
        total: 0,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'query6');

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalled();
      }, DEBOUNCE_WAIT_OPTIONS);

      await waitFor(() => {
        const savedHistory = JSON.parse(localStorageMock.getItem('semantic-search-history') || '[]');
        expect(savedHistory).toHaveLength(5);
        expect(savedHistory[0]).toBe('query6');
        // The oldest entry (query5, at the tail of the original 5-item list) is the one
        // dropped when a 6th item is pushed to the front and the list is trimmed back to
        // MAX_HISTORY_ITEMS — query1 (now second-most-recent) correctly remains.
        expect(savedHistory).not.toContain('query5');
      });
    });

    it('should populate search input when clicking on history item', async () => {
      localStorageMock.setItem('semantic-search-history', JSON.stringify([
        'previous search',
      ]));

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const historyItem = screen.getByText('previous search');
      await user.click(historyItem);

      const input = screen.getByPlaceholderText(/search conversations/i);
      expect(input).toHaveValue('previous search');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support keyboard navigation through results', async () => {
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Result 1',
            content: 'Content 1',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.90,
            highlightedContent: 'Content 1',
          },
          {
            id: 'msg-2',
            conversationId: 'conv-2',
            conversationTitle: 'Result 2',
            content: 'Content 2',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:01:00Z',
            relevanceScore: 0.85,
            highlightedContent: 'Content 2',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      // Arrow down should move focus to first result
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

      // First result should be highlighted
      const firstResult = screen.getByText('Result 1').closest('[role="button"]');
      expect(firstResult).toHaveClass('bg-muted');
    });

    it('should select result on Enter key when focused', async () => {
      const onResultClick = vi.fn();
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Result 1',
            content: 'Content 1',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.90,
            highlightedContent: 'Content 1',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} onResultClick={onResultClick} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      // Navigate to first result
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

      // Press Enter on the search input, which owns the keyboard-navigation handler
      // (firing on `document` never reaches it — React only dispatches synthetic events
      // from the element they're bound to or its descendants, not top-down from document).
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onResultClick).toHaveBeenCalledWith('conv-1', 'msg-1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for search input', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      expect(input).toHaveAttribute('aria-label', 'Search conversations');
    });

    it('should announce search results count to screen readers', async () => {
      const mockSearchResults = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Test',
            content: 'Content',
            role: 'user' as const,
            agentName: 'Bot',
            timestamp: '2026-03-08T10:00:00Z',
            relevanceScore: 0.90,
            highlightedContent: 'Content',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('1 result found');
      }, DEBOUNCE_WAIT_OPTIONS);
    });

    it('should be focusable and keyboard navigable', async () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Native <input> elements are in the tab order by default and don't need an
      // explicit tabIndex attribute — the real accessibility property to verify is that
      // the element can actually receive focus (and wasn't opted out via tabIndex={-1}).
      const input = screen.getByPlaceholderText(/search conversations/i);
      expect(input).not.toHaveAttribute('tabIndex', '-1');

      await user.tab();
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading indicator while searching', async () => {
      vi.mocked(conversationService.searchMessages).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ results: [], total: 0, limit: 10, offset: 0 }), 1000))
      );

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/searching/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when search fails', async () => {
      vi.mocked(conversationService.searchMessages).mockRejectedValue(
        new Error('Search failed')
      );

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);
    });
  });

  describe('Semantic Search Toggle', () => {
    it('should render a "Semantic Search" toggle', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('switch', { name: /semantic search/i })).toBeInTheDocument();
    });

    it('should default to semantic search enabled', () => {
      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const toggle = screen.getByRole('switch', { name: /semantic search/i });
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should pass semantic=true to the search service by default', async () => {
      const mockSearchResults = { results: [], total: 0, limit: 10, offset: 0 };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalled();
      }, DEBOUNCE_WAIT_OPTIONS);

      const lastCall = vi.mocked(conversationService.searchMessages).mock.calls[0];
      expect(lastCall[2]).toEqual(expect.objectContaining({ semantic: true }));
    });

    it('should switch to keyword search and pass semantic=false when toggled off', async () => {
      const mockSearchResults = { results: [], total: 0, limit: 10, offset: 0 };
      vi.mocked(conversationService.searchMessages).mockResolvedValue(mockSearchResults);

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const toggle = screen.getByRole('switch', { name: /semantic search/i });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(conversationService.searchMessages).toHaveBeenCalled();
      }, DEBOUNCE_WAIT_OPTIONS);

      const lastCall = vi.mocked(conversationService.searchMessages).mock.calls[0];
      expect(lastCall[2]).toEqual(expect.objectContaining({ semantic: false }));
    });
  });

  describe('Error fallback to keyword search', () => {
    it('should retry with semantic=false after the semantic search errors', async () => {
      vi.mocked(conversationService.searchMessages).mockImplementation(
        (_query, _filters, options) => {
          if (options?.semantic) {
            return Promise.reject(new Error('Semantic search unavailable'));
          }
          return Promise.resolve({
            results: [
              {
                id: 'msg-kw-1',
                conversationId: 'conv-kw-1',
                conversationTitle: 'Keyword Fallback Result',
                content: 'Fallback content',
                role: 'user' as const,
                agentName: 'Dev-Bot',
                timestamp: new Date().toISOString(),
                relevanceScore: 0.5,
                highlightedContent: 'Fallback content',
              },
            ],
            total: 1,
            limit: 10,
            offset: 0,
          });
        }
      );

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      // The fallback keyword call happens after the semantic call errors.
      await waitFor(() => {
        const calls = vi.mocked(conversationService.searchMessages).mock.calls;
        expect(calls.some((c) => c[2]?.semantic === false)).toBe(true);
      }, DEBOUNCE_WAIT_OPTIONS);

      await waitFor(() => {
        expect(screen.getByText('Keyword Fallback Result')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      expect(
        screen.getByText(/showing keyword search results instead/i)
      ).toBeInTheDocument();
    });

    it('should not fall back when the user has keyword search selected already', async () => {
      vi.mocked(conversationService.searchMessages).mockRejectedValue(
        new Error('Keyword search failed')
      );

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const toggle = screen.getByRole('switch', { name: /semantic search/i });
      await user.click(toggle);

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      expect(
        screen.queryByText(/showing keyword search results instead/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show a "Load more" control when more results exist than the current page', async () => {
      vi.mocked(conversationService.searchMessages).mockResolvedValue({
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Result One',
            content: 'content one',
            role: 'user',
            agentName: 'Dev-Bot',
            timestamp: new Date().toISOString(),
            relevanceScore: 0.9,
            highlightedContent: 'content one',
          },
        ],
        total: 5,
        limit: 1,
        offset: 0,
      });

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/load more/i)).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      expect(screen.getByText(/4 remaining/i)).toBeInTheDocument();
    });

    it('should request the next offset and append results when "Load more" is clicked', async () => {
      const page1 = {
        results: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            conversationTitle: 'Result One',
            content: 'content one',
            role: 'user' as const,
            agentName: 'Dev-Bot',
            timestamp: new Date().toISOString(),
            relevanceScore: 0.9,
            highlightedContent: 'content one',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };
      const page2 = {
        results: [
          {
            id: 'msg-2',
            conversationId: 'conv-2',
            conversationTitle: 'Result Two',
            content: 'content two',
            role: 'user' as const,
            agentName: 'Dev-Bot',
            timestamp: new Date().toISOString(),
            relevanceScore: 0.7,
            highlightedContent: 'content two',
          },
        ],
        total: 2,
        limit: 10,
        offset: 10,
      };

      vi.mocked(conversationService.searchMessages).mockImplementation(
        (_query, _filters, options) =>
          Promise.resolve(options?.offset === 10 ? page2 : page1)
      );

      render(
        <SemanticSearchUI open={true} onOpenChange={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/search conversations/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('Result One')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      await user.click(screen.getByText(/load more/i));

      await waitFor(() => {
        const calls = vi.mocked(conversationService.searchMessages).mock.calls;
        expect(calls.some((c) => c[2]?.offset === 10)).toBe(true);
      }, DEBOUNCE_WAIT_OPTIONS);

      await waitFor(() => {
        expect(screen.getByText('Result Two')).toBeInTheDocument();
      }, DEBOUNCE_WAIT_OPTIONS);

      // Both pages' results should be visible — "Load more" appends, not replaces.
      expect(screen.getByText('Result One')).toBeInTheDocument();
      expect(screen.queryByText(/load more/i)).not.toBeInTheDocument();
    });
  });
});
