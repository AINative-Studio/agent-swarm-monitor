import { test, expect, type Page } from '@playwright/test';

/**
 * E2E coverage for the Chat History feature (issue #37):
 *   Flow A: Load conversations -> Select conversation -> View messages -> Send message
 *   Flow B: Perform semantic search -> Click result -> Jump to message
 *
 * ConversationListSidebar, MessageTranscriptViewer, and SemanticSearchUI are not wired
 * into any product route yet (confirmed: no page in app/ imports them). These specs
 * drive the real components through a minimal harness route
 * (app/e2e-chat-history/page.tsx) built solely for this purpose, with the
 * conversations/agents/messages HTTP calls mocked via page.route so the suite runs
 * without a live backend. Semantic search needs no route mock: conversation-service's
 * searchMessages() is itself a client-side mock today (see lib/conversation-service.ts),
 * returning canned matches for queries containing "error".
 *
 * When the real product page lands, repoint these specs at it, drop the route mocks
 * that become unnecessary, and delete the harness route.
 */

const AGENT_ID = 'agent-e2e-1';
const CONVERSATION_ID = 'conv-e2e-1';

const mockAgent = {
  id: AGENT_ID,
  name: 'E2E Test Agent',
  persona: null,
  model: 'anthropic/claude-opus-4-5',
  user_id: 'user-1',
  status: 'running',
  openclaw_session_key: null,
  openclaw_agent_id: null,
  heartbeat_enabled: false,
  heartbeat_interval: null,
  heartbeat_checklist: null,
  last_heartbeat_at: null,
  next_heartbeat_at: null,
  configuration: null,
  error_message: null,
  error_count: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
  provisioned_at: null,
  paused_at: null,
  stopped_at: null,
};

const mockConversation = {
  id: CONVERSATION_ID,
  agentId: AGENT_ID,
  title: 'Debug Session',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:05:00Z',
  lastMessageAt: '2026-01-01T00:05:00Z',
  messageCount: 2,
};

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: CONVERSATION_ID,
    agentId: AGENT_ID,
    role: 'user',
    content: 'Hello, can you help me debug this error?',
    timestamp: '2026-01-01T00:01:00Z',
  },
  {
    id: 'msg-2',
    conversationId: CONVERSATION_ID,
    agentId: AGENT_ID,
    role: 'assistant',
    content: 'Sure, let\'s take a look at the stack trace.',
    timestamp: '2026-01-01T00:02:00Z',
  },
];

/**
 * AuthProvider (components/providers/auth-provider.tsx) redirects any route
 * to /login unless it finds a restorable session in localStorage (checked via
 * authService.restoreSession(), which reads the openclaw_access_token /
 * openclaw_user keys written by lib/auth-service.ts on login). Seed that
 * session before navigating so the harness route renders instead of the
 * login screen.
 */
async function seedAuthSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('openclaw_access_token', 'e2e-test-token');
    localStorage.setItem('openclaw_refresh_token', 'e2e-test-refresh-token');
    localStorage.setItem(
      'openclaw_user',
      JSON.stringify({
        userId: 'user-e2e-1',
        email: 'e2e@ainative.studio',
        fullName: 'E2E Test User',
        workspaceId: 'workspace-e2e-1',
      })
    );
  });
}

/** Stub the conversations/agents/messages endpoints the harness page calls. */
async function mockChatHistoryApi(page: Page) {
  await page.route('**/api/v1/agents?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ agents: [mockAgent], total: 1, limit: 50, offset: 0 }),
    });
  });

  await page.route('**/api/v1/conversations?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        conversations: [mockConversation],
        total: 1,
        limit: 50,
        offset: 0,
      }),
    });
  });

  // Matches messages for any conversation under this agent -- including
  // conv-1, the id conversation-service's built-in searchMessages() mock
  // returns for "error" queries (see Flow B below), not just CONVERSATION_ID.
  await page.route(`**/api/v1/agents/${AGENT_ID}/conversations/*/messages?*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        messages: mockMessages,
        total: mockMessages.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    });
  });
}

test.describe('Flow A: load conversations -> select -> view messages', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await mockChatHistoryApi(page);
  });

  test('loads the conversation list grouped by agent', async ({ page }) => {
    await page.goto('/e2e-chat-history');

    await expect(page.getByRole('button', { name: /select conversation debug session/i })).toBeVisible();
    await expect(page.getByText('2 messages')).toBeVisible();
    await expect(page.getByText('E2E Test Agent')).toBeVisible();
  });

  test('selecting a conversation loads and displays its message transcript', async ({ page }) => {
    await page.goto('/e2e-chat-history');

    await expect(page.getByTestId('no-conversation-selected')).toBeVisible();

    await page.getByRole('button', { name: /select conversation debug session/i }).click();

    await expect(page.getByTestId('no-conversation-selected')).toBeHidden();
    await expect(page.getByRole('list', { name: 'Message transcript' })).toBeVisible();
    await expect(page.getByText('Hello, can you help me debug this error?')).toBeVisible();
    await expect(page.getByText("Sure, let's take a look at the stack trace.")).toBeVisible();
    await expect(page.getByText('Showing 2 of 2 messages')).toBeVisible();
  });

  test('shows an empty state when there are no conversations yet', async ({ page }) => {
    // Override the conversations mock for this test only: zero results.
    await page.route('**/api/v1/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ conversations: [], total: 0, limit: 50, offset: 0 }),
      });
    });

    await page.goto('/e2e-chat-history');

    await expect(page.getByText('No Conversations Yet')).toBeVisible();
  });
});

test.describe('Flow B: semantic search -> click result -> jump to message', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await mockChatHistoryApi(page);
  });

  test('opens the search dialog, runs a query, and jumps to the selected result', async ({ page }) => {
    await page.goto('/e2e-chat-history');

    await page.getByTestId('open-semantic-search').click();

    const searchDialog = page.getByRole('dialog', { name: 'Search Conversations' });
    await expect(searchDialog).toBeVisible();

    // Scope to the dialog: the sidebar also has its own "Search conversations"
    // labeled input, so an unscoped getByLabel would be ambiguous.
    const searchInput = searchDialog.getByLabel('Search conversations');
    // conversation-service's searchMessages() mock returns canned "Debug
    // Session" matches for any query containing "error" (see conversation-service.ts).
    await searchInput.fill('error');

    // Results arrive after the component's internal debounce + mock delay.
    await expect(page.getByText(/Results \(\d+\)|1 result found/)).toBeVisible({ timeout: 5000 });

    const firstResult = page.getByRole('button', { name: /Debug Session/ }).first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Clicking a result closes the search dialog and jumps the harness to
    // that conversation's transcript.
    await expect(searchDialog).toBeHidden();
    await expect(page.getByRole('list', { name: 'Message transcript' })).toBeVisible();
  });

  test('shows a no-results state for a query with no matches', async ({ page }) => {
    await page.goto('/e2e-chat-history');

    await page.getByTestId('open-semantic-search').click();
    const searchDialog = page.getByRole('dialog', { name: 'Search Conversations' });
    await searchDialog.getByLabel('Search conversations').fill('zzz-no-such-topic-zzz');

    await expect(page.getByText(/No results found for/)).toBeVisible({ timeout: 5000 });
  });
});
