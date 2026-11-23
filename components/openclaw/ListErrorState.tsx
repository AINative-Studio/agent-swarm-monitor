'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/**
 * Returns a user-facing message for a failed React Query fetch, distinguishing
 * an auth failure (401) from other errors so the banner reads correctly either
 * way. Shared across list views per issue #107 so every page describes 401s
 * the same way instead of each one guessing at copy.
 */
export function getErrorMessage(error: unknown, fallback = 'Failed to load data.'): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Not authenticated. Please sign in again to view this data.';
    }
    return error.detail || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

interface ListErrorStateProps {
  error: unknown;
  onRetry: () => void;
  className?: string;
  /** Overrides the derived message entirely. */
  message?: string;
}

/**
 * Visible, actionable error banner for list-fetching views, modeled on
 * TaskCreateForm's "Not authenticated" + Retry pattern (see issue #107).
 * Renders in place of a misleading empty state when a query's isError is true.
 */
export default function ListErrorState({ error, onRetry, className, message }: ListErrorStateProps) {
  return (
    <Alert variant="destructive" role="alert" aria-live="assertive" className={cn('flex items-start gap-3', className)}>
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <AlertDescription className="flex-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span>{message ?? getErrorMessage(error)}</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
