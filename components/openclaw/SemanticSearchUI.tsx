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
const PAGE_SIZE = 10;

// Matches a single <mark>...</mark> span. Deliberately narrow (no other
// tags/attributes) so backend-supplied highlight markup is parsed into
// plain text + <mark> segments and rendered as real React nodes, never as
// raw HTML via dangerouslySetInnerHTML -- see issue #130. Anything other
// than the exact <mark>...</mark> wrapper (including a stray <script> or
// an on* attribute smuggled into the string) is treated as literal text
// and rendered escaped, so it can never execute.
const MARK_PATTERN = /<mark>([\s\S]*?)<\/mark>/g;

/**
 * Renders search-highlight content as safe React text/element nodes
 * instead of injecting raw HTML. Splits on <mark>...</mark> spans; every
 * other character -- including any HTML-looking substring -- is rendered
 * as plain text, so it is escaped by React and never parsed as markup.
 */
function renderHighlightedContent(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  MARK_PATTERN.lastIndex = 0;
  while ((match = MARK_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <React.Fragment key={key++}>{content.slice(lastIndex, match.index)}</React.Fragment>
      );
    }
    nodes.push(<mark key={key++}>{match[1]}</mark>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push(<React.Fragment key={key++}>{content.slice(lastIndex)}</React.Fragment>);
  }

  return nodes;
}

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
  const [page, setPage] = React.useState(0);
  // When a semantic search errors, we retry the same query in keyword mode. This is
  // tracked separately from the user's `semanticSearch` toggle so the toggle's own
  // state (and its label) still reflects the user's actual preference.
  const [fallbackToKeyword, setFallbackToKeyword] = React.useState(false);
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

  // Reset to the first page and clear any error fallback whenever the effective search
  // changes (new query, filters, or search mode) so stale pagination/fallback state from
  // a previous search doesn't leak into the next one.
  React.useEffect(() => {
    setPage(0);
    setFallbackToKeyword(false);
  }, [debouncedQuery, selectedAgent, dateRange, semanticSearch]);

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

  // Effective search mode: if the primary search (per the user's toggle) errored, we
  // retry once in keyword mode rather than surfacing a dead end.
  const effectiveSemantic = semanticSearch && !fallbackToKeyword;

  // Primary search query, in the mode the user selected.
  const primaryResult = useSearchMessages(
    debouncedQuery,
    filters,
    debouncedQuery.length >= 2,
    { semantic: semanticSearch, limit: PAGE_SIZE, offset: page * PAGE_SIZE }
  );

  // Fallback keyword search, only enabled once the primary semantic search has errored.
  const fallbackResult = useSearchMessages(
    debouncedQuery,
    filters,
    fallbackToKeyword && debouncedQuery.length >= 2,
    { semantic: false, limit: PAGE_SIZE, offset: page * PAGE_SIZE }
  );

  // Trigger the keyword fallback the first time the primary (semantic) search errors.
  React.useEffect(() => {
    if (semanticSearch && primaryResult.isError && !fallbackToKeyword) {
      setFallbackToKeyword(true);
    }
  }, [semanticSearch, primaryResult.isError, fallbackToKeyword]);

  const { data, isLoading, isError, error } = fallbackToKeyword
    ? fallbackResult
    : primaryResult;

  // Accumulate results across pages for the current search (query/filters/mode), so
  // "Load more" appends to what's already shown instead of replacing it. Keyed by the
  // search identity (not just offset, since a short page would make offset/length
  // bookkeeping unreliable) so switching query/filters/mode starts a fresh accumulation,
  // and tracked by which page number each response answered so out-of-order responses
  // (e.g. a slow page-1 retry arriving after page 2) don't get appended twice.
  const searchKey = `${debouncedQuery}|${JSON.stringify(filters)}|${effectiveSemantic}`;
  type SearchResults = NonNullable<typeof data>['results'];
  const [accumulated, setAccumulated] = React.useState<{
    key: string;
    lastPage: number;
    results: SearchResults;
  }>({ key: searchKey, lastPage: -1, results: [] });

  React.useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => {
      if (prev.key !== searchKey || page === 0) {
        return { key: searchKey, lastPage: page, results: data.results };
      }
      if (page === prev.lastPage + 1) {
        return { key: searchKey, lastPage: page, results: [...prev.results, ...data.results] };
      }
      return prev;
    });
  }, [data, searchKey, page]);

  const accumulatedResults = accumulated.key === searchKey ? accumulated.results : [];

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
    if (!accumulatedResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < accumulatedResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const result = accumulatedResults[focusedIndex];
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
              {fallbackToKeyword && (
                <p className="text-sm mt-2 text-muted-foreground">
                  Keyword search fallback also failed.
                </p>
              )}
            </div>
          )}

          {/* Fallback notice: semantic search failed, showing keyword results instead */}
          {fallbackToKeyword && !isError && (
            <div
              role="status"
              className="mb-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2"
            >
              Semantic search is unavailable right now — showing keyword search results
              instead.
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
              {accumulatedResults.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for &quot;{debouncedQuery}&quot;</p>
                  <p className="text-sm mt-2">Try different keywords or filters</p>
                </div>
              )}

              {/* Results List */}
              {accumulatedResults.length > 0 && (
                <div ref={resultsRef} className="space-y-3">
                  {accumulatedResults.map((result, index) => (
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

                      <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {renderHighlightedContent(result.highlightedContent)}
                      </div>

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

              {/* Pagination: load more results */}
              {accumulatedResults.length > 0 && accumulatedResults.length < data.total && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isLoading}
                    className="text-sm px-4 py-2 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Load more ({data.total - accumulatedResults.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
