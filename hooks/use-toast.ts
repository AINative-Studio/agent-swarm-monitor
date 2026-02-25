/**
 * Simple toast hook for displaying notifications
 * This is a minimal implementation for the integrations feature
 */

import { useState, useCallback } from 'react';

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

export function useToast() {
  const [, setUpdate] = useState(0);

  const toast = useCallback((options: ToastOptions) => {
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
  }, []);

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
