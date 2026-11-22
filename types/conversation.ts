/**
 * Conversation and semantic search types
 */

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'agent';
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
  messageCount: number;
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
