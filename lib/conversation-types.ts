/**
 * Type definitions for Conversation API
 *
 * Types for chat history integration with the OpenClaw backend
 */

export interface Conversation {
  id: string;
  agentId: string;
  channelId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationFilters {
  agentId?: string;
  channelId?: string;
  status?: 'active' | 'archived' | 'deleted';
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class ConversationError extends Error {
  constructor(
    public statusCode: number,
    public detail: string,
    public conversationId?: string
  ) {
    super(detail);
    this.name = 'ConversationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}
