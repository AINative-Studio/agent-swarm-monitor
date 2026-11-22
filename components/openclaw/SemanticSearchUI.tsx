'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Clock, Filter, Loader2, Sparkles } from 'lucide-react';
import { useSearchMessages } from '@/hooks/useConversationSearch';
import { cn } from '@/lib/utils';
import type { AgentOption, DateRangeOption, SearchFilters } from '@/types/conversation';
import { formatRelativeTime } from '@/lib/openclaw-utils';

const MAX_HISTORY_ITEMS = 5;
const SEARCH_DEBOUNCE_MS = 300;
const STORAGE_KEY = 'semantic-search-history';

interface SemanticSearchUIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultClick?: (conversationId: string, messageId: string) => void;
  availableAgents?: AgentOption[];
}

export default function SemanticSearchUI({
  open,
  onOpenChange,
  onResultClick,
  availableAgents = [],
}: SemanticSearchUIProps) {
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedAgent, setSelectedAgent] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<DateRangeOption>('all');
  const [semanticSearch, setSemanticSearch] = React.useState(true);
  const [searchHistory, setSearchHistory] = React.useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Load search history from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSearchHistory(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse search history:', e);
        }
      }
    }
  }, []);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Build filters
  const filters = React.useMemo((): SearchFilters | undefined => {
    const f: SearchFilters = {};
    let hasFilters = false;

    if (selectedAgent !== 'all') {
      f.agentId = selectedAgent;
      hasFilters = true;
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date | undefined;

      switch (dateRange) {
        case 'today':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (dateFrom) {
        f.dateFrom = dateFrom.toISOString();
        hasFilters = true;
      }
    }

    return hasFilters ? f : undefined;
  }, [selectedAgent, dateRange]);

  // Search query
  const {
    data,
    isLoading,
    isError,
    error,
  } = useSearchMessages(debouncedQuery, filters, debouncedQuery.length >= 2, {
    semantic: semanticSearch,
  });

  // Save to history when search completes successfully.
  //
  // Uses the functional form of setSearchHistory so this always operates on the latest
  // history state without needing `searchHistory` in the dependency array (which would
  // otherwise re-run this effect on every history update — not actually an infinite loop,
  // but unnecessary re-runs). The previous version read `searchHistory` directly from the
  // closure while omitting it from deps, which captured a stale value and could under- or
  // over-count entries (e.g. not correctly deduping/trimming to MAX_HISTORY_ITEMS when the
  // effect fired again before the history-loaded-from-localStorage effect's state caught up).
  React.useEffect(() => {
    if (data && debouncedQuery.length >= 2) {
      setSearchHistory((prevHistory) => {
        const updatedHistory = [
          debouncedQuery,
          ...prevHistory.filter((item) => item !== debouncedQuery),
        ].slice(0, MAX_HISTORY_ITEMS);

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        }

        return updatedHistory;
      });
    }
  }, [data, debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!data?.results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < data.results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const result = data.results[focusedIndex];
      if (result && onResultClick) {
        onResultClick(result.conversationId, result.id);
        onOpenChange(false);
      }
    }
  };

  // Scroll focused item into view
  React.useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const focusedElement = resultsRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [focusedIndex]);

  const handleClearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setDebouncedQuery(historyQuery);
    inputRef.current?.focus();
  };

  const handleResultClick = (conversationId: string, messageId: string) => {
    if (onResultClick) {
      onResultClick(conversationId, messageId);
      onOpenChange(false);
    }
  };

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4 border-b">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
              aria-label="Search conversations"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Semantic Search Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Label
              htmlFor="semantic-search-toggle"
              className="text-sm font-normal cursor-pointer"
            >
              Semantic Search
            </Label>
            <Switch
              id="semantic-search-toggle"
              checked={semanticSearch}
              onCheckedChange={setSemanticSearch}
              aria-label="Semantic Search"
            />
            <span className="text-xs text-muted-foreground">
              {semanticSearch
                ? 'Searching by meaning and context'
                : 'Searching by exact keyword match'}
            </span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {availableAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as DateRangeOption)}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[calc(80vh-220px)] overflow-y-auto">
          {/* Search History */}
          {!debouncedQuery && searchHistory.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Recent searches</span>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && debouncedQuery && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Searching...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="py-12 text-center text-destructive">
              <p>Search failed: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}

          {/* Results */}
          {data && debouncedQuery && !isLoading && (
            <>
              {/* Results Count with ARIA live region */}
              <div className="mb-4 text-sm text-muted-foreground">
                <span role="status" aria-live="polite">
                  {data.total === 1 ? '1 result found' : `Results (${data.total})`}
                </span>
              </div>

              {/* No Results */}
              {data.results.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for &quot;{debouncedQuery}&quot;</p>
                  <p className="text-sm mt-2">Try different keywords or filters</p>
                </div>
              )}

              {/* Results List */}
              {data.results.length > 0 && (
                <div ref={resultsRef} className="space-y-3">
                  {data.results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.conversationId, result.id)}
                      className={cn(
                        'w-full text-left p-4 rounded-lg border transition-colors',
                        'hover:bg-muted hover:border-primary/50',
                        focusedIndex === index && 'bg-muted border-primary'
                      )}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">
                          {result.conversationTitle}
                        </h3>
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs"
                        >
                          {Math.round(result.relevanceScore * 100)}%
                        </Badge>
                      </div>

                      <div
                        className="text-sm text-muted-foreground mb-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                      />

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(result.timestamp)}</span>
                        {result.agentName && (
                          <>
                            <span>•</span>
                            <span>Agent: {result.agentName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{result.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
