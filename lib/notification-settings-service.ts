/**
 * Mock persistence layer for the Settings page's Notification toggles
 * (Email notifications, Agent error alerts, Heartbeat failure alerts,
 * Weekly digest).
 *
 * These are genuinely local user preferences rather than workspace-wide
 * backend state, so -- distinct from lib/openclaw-service.ts's in-memory
 * array/object mock pattern used for shared/backend-owned resources --
 * this persists to localStorage, which actually survives a page reload
 * within the same browser session. There is still no real backend write.
 *
 * TODO: Replace with a real API call once the backend exposes a
 * notification-preferences endpoint.
 */

export interface NotificationSettings {
  emailNotifications: boolean;
  agentErrorAlerts: boolean;
  heartbeatFailAlerts: boolean;
  weeklyDigest: boolean;
}

const STORAGE_KEY = 'openclaw_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  agentErrorAlerts: true,
  heartbeatFailAlerts: true,
  weeklyDigest: false,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadNotificationSettings(): NotificationSettings {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    // Corrupt/unavailable storage -- fall back to defaults rather than throw.
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (e.g. private browsing quota) -- silently no-op;
    // the toggle still reflects the in-memory state for this page view.
  }
}
