'use client';

import { formatRelativeTime } from '@/lib/openclaw-utils';
import type { Conversation } from '@/lib/conversation-types';
import { Archive, Trash2, MessageSquare } from 'lucide-react';

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onArchive,
  onDelete,
}: ConversationItemProps) {
  const agentName = conversation.metadata?.agentName as string || 'Unknown Agent';
  const workspaceName = conversation.metadata?.workspaceName as string || '';

  // Format the timestamp
  const timeAgo = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt)
    : formatRelativeTime(conversation.updatedAt);

  // Format message count
  const messageCountText = `${conversation.messageCount} message${conversation.messageCount !== 1 ? 's' : ''}`;

  return (
    <button
      type="button"
      role="button"
      data-testid={`conversation-item-${conversation.id}`}
      data-selected={isSelected}
      onClick={() => onSelect(conversation.id)}
      className={`
        w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:ring-inset
        ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {conversation.title}
          </h3>

          {/* Agent name */}
          <div className="flex items-center gap-2 mt-1">
            <MessageSquare className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">{agentName}</span>
            {workspaceName && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">{workspaceName}</span>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{messageCountText}</span>
            <span className="text-gray-400">•</span>
            <span>{timeAgo}</span>
            {conversation.status !== 'active' && (
              <>
                <span className="text-gray-400">•</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {conversation.status}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          {conversation.status === 'active' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(conversation.id);
              }}
              aria-label={`Archive ${conversation.title}`}
              title="Archive conversation"
              className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            aria-label={`Delete ${conversation.title}`}
            title="Delete conversation"
            className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </button>
  );
}
