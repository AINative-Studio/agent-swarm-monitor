import type { HeartbeatInterval } from '@/types/openclaw';
import { MODEL_CATALOG, formatModelShort as formatModelShortFromCatalog } from '@/lib/model-catalog';

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  if (minutes >= 1) return `${minutes}m ago`;
  return 'just now';
}

export function formatHeartbeatInterval(interval: string | null): string {
  if (!interval) return '';
  const map: Record<string, string> = {
    '5m': 'Every 5m',
    '15m': 'Every 15m',
    '30m': 'Every 30m',
    '1h': 'Every 1h',
    '2h': 'Every 2h',
  };
  return map[interval] ?? interval;
}

// formatModelShort is centralized in lib/model-catalog.ts (see issue #106)
// and re-exported here for backward compatibility with existing imports
// (home list, agent detail subtitle). The catalog version is a strict
// superset of the formatting that used to live here -- it handles slugs not
// in MODEL_CATALOG (e.g. 'anthropic/claude-sonnet-4-5') via the same simple
// string replacement, plus additional known slugs -- so re-exporting it
// introduces no change in behavior for existing callers.
export const formatModelShort = formatModelShortFromCatalog;

// MODEL_OPTIONS / MODEL_OPTIONS_RAW now re-export the full catalog from
// lib/model-catalog.ts (70+ models across 11 providers) instead of the old
// 4-slug hardcoded list, so real agents' models match an actual SelectItem.
// See issue #106 ("wire lib/model-catalog.ts into the model selector") and
// issue #123 (blank Model dropdown caused by the old hardcoded list).
export const MODEL_OPTIONS = MODEL_CATALOG.flatMap((provider) =>
  provider.models.map((m) => ({ value: m.value, label: m.label }))
);

export const MODEL_OPTIONS_RAW = MODEL_OPTIONS;

export const HEARTBEAT_OPTIONS: { value: HeartbeatInterval; label: string }[] = [
  { value: '5m', label: 'Every 5 min' },
  { value: '15m', label: 'Every 15 min' },
  { value: '30m', label: 'Every 30 min' },
  { value: '1h', label: 'Every 1 hour' },
  { value: '2h', label: 'Every 2 hours' },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

export const fadeUpSimple = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};
