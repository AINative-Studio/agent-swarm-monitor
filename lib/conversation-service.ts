/**
 * Conversation Service
 *
 * Mock implementation for development until Issue #32 is complete.
 * This provides the API interface needed by ConversationList component.
 */

import type {
  Conversation,
  ConversationFilters,
  ConversationListResponse,
} from './conversation-types';

export class ConversationService {
  private readonly apiUrl: string;
  private readonly authToken: string;

  constructor(apiUrl: string, authToken: string) {
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.authToken = authToken;
  }

  async listConversations(filters: ConversationFilters): Promise<ConversationListResponse> {
    // TODO: Replace with real API call when backend is ready
    return {
      conversations: [],
      total: 0,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  async getConversation(id: string): Promise<Conversation> {
    // TODO: Replace with real API call
    throw new Error('Not implemented');
  }

  async archiveConversation(id: string): Promise<void> {
    // TODO: Replace with real API call
    console.log('Archive conversation:', id);
  }

  async deleteConversation(id: string): Promise<void> {
    // TODO: Replace with real API call
    console.log('Delete conversation:', id);
  }
}
