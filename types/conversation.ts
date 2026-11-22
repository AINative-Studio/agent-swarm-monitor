/**
 * Conversation and semantic search types
 */

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  agentId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

export interface CreateConversationRequest {
  agentId: string;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  role?: 'user' | 'assistant' | 'system';
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  messageId: string;
  conversationId: string;
  content: string;
  snippet: string;
  relevanceScore: number;
  sender: 'user' | 'agent';
  timestamp: string;
  highlightedSnippet?: string;
}

export interface SemanticSearchRequest {
  conversationId: string;
  query: string;
  limit?: number;
  minRelevanceScore?: number;
}

export interface SemanticSearchResponse {
  results: SearchResult[];
  totalResults: number;
  queryTime: number;
}

/**
 * Cross-conversation semantic search (SemanticSearchUI / useConversationSearch)
 */
export interface AgentOption {
  id: string;
  name: string;
}

export type DateRangeOption = 'all' | 'today' | 'week' | 'month';

export interface SearchFilters {
  agentId?: string;
  conversationId?: string;
  dateFrom?: string;
  dateTo?: string;
  role?: Message['role'];
}

export interface SearchMessage {
  id: string;
  conversationId: string;
  conversationTitle: string;
  content: string;
  role: Message['role'];
  agentName: string;
  timestamp: string;
  relevanceScore: number;
  highlightedContent: string;
}

export interface SearchMessagesResponse {
  results: SearchMessage[];
  total: number;
}

export interface SearchMessagesOptions {
  /** Semantic (embedding/natural-language) search vs plain keyword search. Default true. */
  semantic?: boolean;
}
