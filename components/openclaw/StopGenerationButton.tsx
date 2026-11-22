'use client';

import * as React from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StopGenerationButtonProps {
  /** Whether the assistant is currently streaming a response. The button only renders when true. */
  isStreaming: boolean;
  /** Called when the user clicks the button — wire this to `useMessageStream().stopGeneration`. */
  onStop: () => void;
  className?: string;
}

/**
 * Stop-generation control for an in-progress assistant response (issue #36).
 *
 * Intentionally decoupled from any specific chat/transcript layout: it renders nothing
 * when `isStreaming` is false, and otherwise renders a small pill button a parent can
 * place anywhere (e.g. inline near a streaming message, or pinned above a chat input).
 * Wire it to `useMessageStream()`'s `stopGeneration` function and `isStreaming` flag.
 */
export function StopGenerationButton({
  isStreaming,
  onStop,
  className,
}: StopGenerationButtonProps) {
  if (!isStreaming) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onStop}
      aria-label="Stop generating response"
      className={cn('gap-1.5 rounded-full', className)}
    >
      <Square className="h-3 w-3 fill-current" />
      Stop generating
    </Button>
  );
}

export default StopGenerationButton;
