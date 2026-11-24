/**
 * Simple toast hook for displaying notifications
 * This is a minimal implementation for the integrations feature
 */

import { useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple toast state management
let toastId = 0;
const listeners: Array<(toast: Toast) => void> = [];

/**
 * Fire a toast notification. Plain function (not a hook) so it can be
 * called from non-component modules -- e.g. lib/api-client.ts raising a
 * "session expired" toast when a token refresh fails. useToast() below
 * delegates to this for component call sites.
 */
export function toast(options: ToastOptions): { id: string } {
  const id = `toast-${toastId++}`;
  const newToast: Toast = {
    id,
    ...options,
  };

  // Notify all listeners
  listeners.forEach((listener) => listener(newToast));

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    // This would normally remove the toast, but for simplicity we'll just let it fade
  }, 3000);

  return { id };
}

export function useToast() {
  const dismiss = useCallback((toastId?: string) => {
    // Toast dismissal logic would go here
  }, []);

  return {
    toast,
    dismiss,
  };
}

// Export listener registration for Toaster component
export function addToastListener(listener: (toast: Toast) => void) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}
