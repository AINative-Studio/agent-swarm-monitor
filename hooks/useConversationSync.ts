import { useCallback, useEffect, useRef } from 'react';

/**
 * Cross-tab conversation synchronization (issue #36).
 *
 * When a new message arrives for a conversation in one browser tab, this hook lets that
 * tab broadcast the event so every other tab with the same conversation open can update
 * its own state (e.g. append the message, bump unread counts, refetch).
 *
 * Transport: prefers the BroadcastChannel API (same-origin, same-browser, purpose-built
 * for this exact use case, no serialization round-trip through storage). Falls back to
 * `localStorage` + the `storage` event for environments without BroadcastChannel (older
 * Safari, or test environments that don't polyfill it) — per the issue's own suggestion
 * ("Use localStorage events for cross-tab communication"). The `storage` event only fires
 * in *other* tabs, never the tab that made the write, which is exactly the semantics we
 * want here (we don't want to re-receive our own broadcast).
 */

export type ConversationSyncEventType = 'message_added' | 'message_updated' | 'conversation_updated';

export interface ConversationSyncEvent {
  type: ConversationSyncEventType;
  conversationId: string;
  messageId?: string;
  /** Monotonic-ish sender-local timestamp, useful for ordering/dedup by consumers. */
  timestamp: number;
  /** Arbitrary small payload (e.g. the new message or a patch) — kept opaque to this hook. */
  payload?: unknown;
}

const CHANNEL_NAME = 'agentclaw-conversation-sync';
const STORAGE_KEY = '__agentclaw_conversation_sync__';

function supportsBroadcastChannel(): boolean {
  return typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined';
}

interface UseConversationSyncOptions {
  /**
   * Only invoke the listener for events matching this conversation ID. Omit to receive
   * events for all conversations (useful for a sidebar that needs to know about updates
   * across every open conversation, not just the one currently being viewed).
   */
  conversationId?: string;
  /** Called whenever a matching sync event arrives from another tab. */
  onEvent?: (event: ConversationSyncEvent) => void;
}

interface UseConversationSyncReturn {
  /** Broadcast a sync event to all other tabs. Does not call back into this tab's own onEvent. */
  broadcast: (event: Omit<ConversationSyncEvent, 'timestamp'>) => void;
}

export function useConversationSync(
  options: UseConversationSyncOptions = {}
): UseConversationSyncReturn {
  const { conversationId, onEvent } = options;

  // Keep the latest callback in a ref so the subscription effect doesn't need to
  // re-subscribe (and doesn't risk calling a stale closure) every time the consumer
  // passes a fresh inline function.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const channelRef = useRef<BroadcastChannel | null>(null);

  const handleIncoming = useCallback(
    (event: ConversationSyncEvent) => {
      if (!event || typeof event !== 'object') return;
      if (conversationId && event.conversationId !== conversationId) return;
      onEventRef.current?.(event);
    },
    [conversationId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (supportsBroadcastChannel()) {
      const channel = new window.BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      const listener = (messageEvent: MessageEvent<ConversationSyncEvent>) => {
        handleIncoming(messageEvent.data);
      };
      channel.addEventListener('message', listener);

      return () => {
        channel.removeEventListener('message', listener);
        channel.close();
        channelRef.current = null;
      };
    }

    // localStorage fallback: write a JSON-encoded event under a well-known key; every
    // other tab's `storage` listener fires on that write (the writing tab itself never
    // receives its own `storage` event, per spec).
    const storageListener = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== STORAGE_KEY || !storageEvent.newValue) return;
      try {
        const parsed = JSON.parse(storageEvent.newValue) as ConversationSyncEvent;
        handleIncoming(parsed);
      } catch {
        // Ignore malformed payloads (e.g. a concurrent writer using a different shape).
      }
    };
    window.addEventListener('storage', storageListener);

    return () => {
      window.removeEventListener('storage', storageListener);
    };
  }, [handleIncoming]);

  const broadcast = useCallback((event: Omit<ConversationSyncEvent, 'timestamp'>) => {
    const fullEvent: ConversationSyncEvent = { ...event, timestamp: Date.now() };

    if (channelRef.current) {
      channelRef.current.postMessage(fullEvent);
      return;
    }

    if (typeof window === 'undefined') return;

    if (supportsBroadcastChannel()) {
      // No open subscription in this hook instance (e.g. called before the effect ran),
      // but the API is available — send through a short-lived channel.
      const channel = new window.BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(fullEvent);
      channel.close();
      return;
    }

    try {
      // Writing the same key with a fresh value (even an identical one) still fires the
      // `storage` event in other tabs because the value's serialized form changes due to
      // the timestamp, so no artificial toggling is needed here.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fullEvent));
    } catch {
      // Storage can throw in private browsing / storage-full situations — sync is
      // best-effort, never a hard dependency for the app to function.
    }
  }, []);

  return { broadcast };
}
