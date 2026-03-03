'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationService } from '@/lib/conversation-service';
import type {
  Conversation,
  ConversationFilters,
  ConversationListResponse,
} from '@/lib/conversation-types';
import { ConversationItem } from './ConversationItem';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export interface ConversationListProps {
  workspaceId?: string;
  agentId?: string;
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
}

export function ConversationList({
  workspaceId,
  agentId,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Initialize ConversationService (in real app, this would use proper config)
  const conversationService = new ConversationService(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    process.env.NEXT_PUBLIC_AUTH_TOKEN || 'dev-token'
  );

  const limit = 50;

  // Fetch conversations
  const fetchConversations = useCallback(async (resetOffset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = resetOffset ? 0 : offset;
      const currentFilters: ConversationFilters = {
        ...filters,
        agentId,
        channelId: workspaceId,
        limit,
        offset: currentOffset,
      };

      const response: ConversationListResponse = await conversationService.listConversations(
        currentFilters
      );

      if (resetOffset) {
        setConversations(response.conversations);
        setOffset(0);
      } else {
        setConversations((prev) => [...prev, ...response.conversations]);
      }

      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, [agentId, workspaceId, filters, offset]);

  // Initial fetch and refetch when props change
  useEffect(() => {
    fetchConversations(true);
  }, [agentId, workspaceId, filters.status]);

  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
  };

  // Handle archive
  const handleArchive = async (conversationId: string) => {
    try {
      await conversationService.archiveConversation(conversationId);
      // Refresh list
      await fetchConversations(true);
    } catch (err) {
      console.error('Failed to archive conversation:', err);
    }
  };

  // Handle delete
  const handleDelete = async (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      await conversationService.deleteConversation(conversationToDelete);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      // Refresh list
      await fetchConversations(true);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
    fetchConversations(false);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: 'active' | 'archived' | 'deleted' | undefined) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="text-gray-500"
            role="status"
            aria-live="polite"
            aria-label="Loading conversations"
          >
            Loading conversations...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600" role="alert">
            Error loading conversations
          </div>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          <Button
            onClick={() => fetchConversations(true)}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">No conversations found</p>
          {(agentId || workspaceId) && (
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your filters
            </p>
          )}
        </div>
      </div>
    );
  }

  const hasMore = conversations.length < total;

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-filter"
            name="status-filter"
            role="combobox"
            aria-label="Status filter"
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={filters.status || ''}
            onChange={(e) => handleStatusFilterChange(e.target.value as any || undefined)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Conversation list */}
      <div
        className="flex-1 overflow-y-auto"
        role="list"
        aria-label="Conversations list"
      >
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            onSelect={handleSelectConversation}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination info and load more */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center mb-2">
            Showing {conversations.length} of {total} conversations
          </div>
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
