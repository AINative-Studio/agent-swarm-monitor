/**
 * Mock data for conversation integration tests
 */

import type {
  Conversation,
  Message,
  SearchResult,
  SemanticSearchResponse,
  ConversationListResponse,
  MessageListResponse,
} from '@/types/conversation';

/**
 * Mock conversations
 */
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agentId: 'agent-123',
    title: 'Product Roadmap Discussion',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-08T14:30:00Z',
    lastMessageAt: '2026-03-08T14:30:00Z',
    messageCount: 15,
  },
  {
    id: 'conv-2',
    agentId: 'agent-123',
    title: 'Bug Report Analysis',
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-07T16:45:00Z',
    lastMessageAt: '2026-03-07T16:45:00Z',
    messageCount: 8,
  },
  {
    id: 'conv-3',
    agentId: 'agent-123',
    title: 'Feature Requests Review',
    createdAt: '2026-03-06T11:30:00Z',
    updatedAt: '2026-03-08T10:15:00Z',
    lastMessageAt: '2026-03-08T10:15:00Z',
    messageCount: 12,
  },
  {
    id: 'conv-4',
    agentId: 'agent-456',
    title: 'Customer Support Chat',
    createdAt: '2026-03-07T08:00:00Z',
    updatedAt: '2026-03-08T09:20:00Z',
    lastMessageAt: '2026-03-08T09:20:00Z',
    messageCount: 20,
  },
];

/**
 * Mock messages for conversation 1
 */
export const mockMessagesConv1: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'What features should we prioritize for Q2?',
    timestamp: '2026-03-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    role: 'assistant',
    content:
      'Based on user feedback and market trends, I recommend prioritizing: 1) Advanced analytics dashboard, 2) Mobile app improvements, 3) Integration with third-party tools.',
    timestamp: '2026-03-01T10:01:30Z',
    metadata: {
      model: 'gpt-4',
      tokensUsed: 45,
    },
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Can you provide more details on the analytics dashboard?',
    timestamp: '2026-03-01T10:05:00Z',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    role: 'assistant',
    content:
      'The analytics dashboard should include:\n- Real-time metrics visualization\n- Custom report builder\n- Export to CSV/PDF\n- Anomaly detection\n- Predictive analytics using ML',
    timestamp: '2026-03-01T10:06:15Z',
    metadata: {
      model: 'gpt-4',
      tokensUsed: 52,
    },
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    role: 'user',
    content: 'What about the mobile app improvements?',
    timestamp: '2026-03-08T14:30:00Z',
  },
];

/**
 * Mock messages for conversation 2
 */
export const mockMessagesConv2: Message[] = [
  {
    id: 'msg-6',
    conversationId: 'conv-2',
    role: 'user',
    content: 'Users are reporting login issues on Safari',
    timestamp: '2026-03-05T09:00:00Z',
  },
  {
    id: 'msg-7',
    conversationId: 'conv-2',
    role: 'assistant',
    content:
      'I found several reports about Safari login issues. The problem appears to be related to third-party cookie blocking. Let me investigate further.',
    timestamp: '2026-03-05T09:01:20Z',
    metadata: {
      model: 'gpt-4',
      tokensUsed: 38,
    },
  },
  {
    id: 'msg-8',
    conversationId: 'conv-2',
    role: 'user',
    content: 'How can we fix this?',
    timestamp: '2026-03-07T16:45:00Z',
  },
];

/**
 * Mock search results
 */
export const mockSearchResults: SearchResult[] = [
  {
    messageId: 'msg-2',
    conversationId: 'conv-1',
    content:
      'Based on user feedback and market trends, I recommend prioritizing: 1) Advanced analytics dashboard, 2) Mobile app improvements, 3) Integration with third-party tools.',
    snippet: '...recommend prioritizing: 1) Advanced analytics dashboard...',
    relevanceScore: 0.92,
    sender: 'agent',
    timestamp: '2026-03-01T10:01:30Z',
    highlightedSnippet:
      '...recommend prioritizing: 1) Advanced <mark>analytics dashboard</mark>...',
  },
  {
    messageId: 'msg-4',
    conversationId: 'conv-1',
    content:
      'The analytics dashboard should include:\n- Real-time metrics visualization\n- Custom report builder\n- Export to CSV/PDF\n- Anomaly detection\n- Predictive analytics using ML',
    snippet: '...The analytics dashboard should include: Real-time metrics...',
    relevanceScore: 0.89,
    sender: 'agent',
    timestamp: '2026-03-01T10:06:15Z',
    highlightedSnippet:
      'The <mark>analytics dashboard</mark> should include: Real-time metrics...',
  },
];

/**
 * Mock API responses
 */
export const mockConversationListResponse: ConversationListResponse = {
  conversations: mockConversations.filter((c) => c.agentId === 'agent-123'),
  total: 3,
  limit: 10,
  offset: 0,
};

export const mockMessageListResponse: MessageListResponse = {
  messages: mockMessagesConv1,
  total: 5,
  limit: 100,
  offset: 0,
};

export const mockSemanticSearchResponse: SemanticSearchResponse = {
  results: mockSearchResults,
  totalResults: 2,
  queryTime: 45,
};

export const mockSendMessageResponse: Message = {
  id: 'msg-new-user',
  conversationId: 'conv-1',
  role: 'user',
  content: 'This is a new message',
  timestamp: new Date().toISOString(),
};

export const mockNewConversation: Conversation = {
  id: 'conv-new',
  agentId: 'agent-123',
  title: 'New Conversation',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastMessageAt: null,
  messageCount: 0,
};

/**
 * Helper to create a mock message
 */
export function createMockMessage(
  overrides?: Partial<Message>
): Message {
  return {
    id: `msg-${Date.now()}`,
    conversationId: 'conv-1',
    role: 'user',
    content: 'Test message',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create a mock conversation
 */
export function createMockConversation(
  overrides?: Partial<Conversation>
): Conversation {
  return {
    id: `conv-${Date.now()}`,
    agentId: 'agent-123',
    title: 'Test Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: null,
    messageCount: 0,
    ...overrides,
  };
}

/**
 * Error responses for testing error scenarios
 */
export const mockErrorResponses = {
  notFound: {
    status: 404,
    message: 'Conversation not found',
  },
  serverError: {
    status: 500,
    message: 'Internal server error',
  },
  unauthorized: {
    status: 401,
    message: 'Unauthorized',
  },
  badRequest: {
    status: 400,
    message: 'Bad request',
  },
};
