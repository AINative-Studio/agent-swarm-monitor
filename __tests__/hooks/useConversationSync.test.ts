import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConversationSync } from '@/hooks/useConversationSync';
import type { ConversationSyncEvent } from '@/hooks/useConversationSync';

describe('useConversationSync', () => {
  describe('BroadcastChannel transport (available in this environment)', () => {
    it('receives an event broadcast from another hook instance for the same conversation', async () => {
      const received: ConversationSyncEvent[] = [];

      const tabA = renderHook(() =>
        useConversationSync({
          conversationId: 'conv-1',
          onEvent: (event) => received.push(event),
        })
      );
      const tabB = renderHook(() => useConversationSync({ conversationId: 'conv-1' }));

      tabB.result.current.broadcast({
        type: 'message_added',
        conversationId: 'conv-1',
        messageId: 'msg-1',
      });

      await waitFor(() => {
        expect(received).toHaveLength(1);
      });
      expect(received[0]).toMatchObject({
        type: 'message_added',
        conversationId: 'conv-1',
        messageId: 'msg-1',
      });
      expect(received[0].timestamp).toBeTypeOf('number');

      tabA.unmount();
      tabB.unmount();
    });

    it('ignores events for a different conversation when conversationId is set', async () => {
      const received: ConversationSyncEvent[] = [];

      const listener = renderHook(() =>
        useConversationSync({
          conversationId: 'conv-1',
          onEvent: (event) => received.push(event),
        })
      );
      const sender = renderHook(() => useConversationSync());

      sender.result.current.broadcast({
        type: 'message_added',
        conversationId: 'conv-OTHER',
        messageId: 'msg-1',
      });

      // Give any (incorrect) delivery a chance to arrive before asserting it didn't.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(received).toHaveLength(0);

      listener.unmount();
      sender.unmount();
    });

    it('receives events for all conversations when conversationId is omitted', async () => {
      const received: ConversationSyncEvent[] = [];

      const listener = renderHook(() =>
        useConversationSync({ onEvent: (event) => received.push(event) })
      );
      const sender = renderHook(() => useConversationSync());

      sender.result.current.broadcast({
        type: 'conversation_updated',
        conversationId: 'conv-anything',
      });

      await waitFor(() => {
        expect(received).toHaveLength(1);
      });

      listener.unmount();
      sender.unmount();
    });

    it('stops receiving events after unmount', async () => {
      const received: ConversationSyncEvent[] = [];

      const listener = renderHook(() =>
        useConversationSync({
          conversationId: 'conv-1',
          onEvent: (event) => received.push(event),
        })
      );
      const sender = renderHook(() => useConversationSync());

      listener.unmount();

      sender.result.current.broadcast({ type: 'message_added', conversationId: 'conv-1' });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(received).toHaveLength(0);

      sender.unmount();
    });
  });

  describe('localStorage fallback (BroadcastChannel unavailable)', () => {
    const originalBroadcastChannel = window.BroadcastChannel;

    beforeEach(() => {
      // Force the fallback path by removing BroadcastChannel for this describe block.
      // @ts-expect-error - intentionally deleting a global for the test
      delete window.BroadcastChannel;
    });

    afterEach(() => {
      window.BroadcastChannel = originalBroadcastChannel;
      window.localStorage.clear();
    });

    it('delivers events via the storage event to other hook instances', async () => {
      const received: ConversationSyncEvent[] = [];

      const listener = renderHook(() =>
        useConversationSync({
          conversationId: 'conv-1',
          onEvent: (event) => received.push(event),
        })
      );
      const sender = renderHook(() => useConversationSync());

      sender.result.current.broadcast({
        type: 'message_added',
        conversationId: 'conv-1',
        messageId: 'msg-42',
      });

      // jsdom does not natively dispatch `storage` events on same-window writes (real
      // browsers only fire them in *other* tabs/windows, never the writer's own), so we
      // simulate what another tab would observe: a StorageEvent carrying the new value.
      const stored = window.localStorage.getItem('__agentclaw_conversation_sync__');
      expect(stored).toBeTruthy();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: '__agentclaw_conversation_sync__',
          newValue: stored,
        })
      );

      await waitFor(() => {
        expect(received).toHaveLength(1);
      });
      expect(received[0]).toMatchObject({
        type: 'message_added',
        conversationId: 'conv-1',
        messageId: 'msg-42',
      });

      listener.unmount();
      sender.unmount();
    });

    it('ignores storage events for unrelated keys', async () => {
      const received: ConversationSyncEvent[] = [];

      const listener = renderHook(() =>
        useConversationSync({ onEvent: (event) => received.push(event) })
      );

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'some-other-app-key',
          newValue: JSON.stringify({ type: 'message_added', conversationId: 'conv-1' }),
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(received).toHaveLength(0);

      listener.unmount();
    });

    it('does not throw when localStorage.setItem fails', () => {
      const sender = renderHook(() => useConversationSync());
      const setItemSpy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      expect(() =>
        sender.result.current.broadcast({ type: 'message_added', conversationId: 'conv-1' })
      ).not.toThrow();

      setItemSpy.mockRestore();
      sender.unmount();
    });
  });
});
