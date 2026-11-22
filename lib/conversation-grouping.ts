/**
 * Client-side helpers for grouping and sorting conversations by agent.
 */
import type { Conversation } from '@/types/conversation';
import type { OpenClawAgent } from '@/types/openclaw';

export interface ConversationGroup {
  agentId: string;
  agentName: string;
  agentInitials: string;
  conversations: Conversation[];
  mostRecentAt: number;
}

/**
 * Derive 1-2 letter initials from an agent/display name, matching the
 * convention used for the user avatar in OpenClawSidebar.
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function conversationTimestamp(conversation: Conversation): number {
  const value = conversation.lastMessageAt || conversation.updatedAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Group conversations by agentId, sort each group's conversations by most
 * recent activity first, and sort the groups themselves by their most
 * recently active conversation.
 */
export function groupConversationsByAgent(
  conversations: Conversation[],
  agents: OpenClawAgent[]
): ConversationGroup[] {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const groups = new Map<string, ConversationGroup>();

  for (const conversation of conversations) {
    const agent = agentsById.get(conversation.agentId);
    const agentName = agent?.name ?? 'Unknown Agent';

    let group = groups.get(conversation.agentId);
    if (!group) {
      group = {
        agentId: conversation.agentId,
        agentName,
        agentInitials: getInitials(agentName),
        conversations: [],
        mostRecentAt: 0,
      };
      groups.set(conversation.agentId, group);
    }

    group.conversations.push(conversation);
    group.mostRecentAt = Math.max(group.mostRecentAt, conversationTimestamp(conversation));
  }

  for (const group of groups.values()) {
    group.conversations.sort(
      (a, b) => conversationTimestamp(b) - conversationTimestamp(a)
    );
  }

  return Array.from(groups.values()).sort((a, b) => b.mostRecentAt - a.mostRecentAt);
}
