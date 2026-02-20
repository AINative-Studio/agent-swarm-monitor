import type { HeartbeatInterval } from '@/types/openclaw';

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

export function formatModelShort(model: string): string {
  const parts = model.split('/');
  const name = parts[parts.length - 1];
  return name
    .replace('claude-', 'Claude ')
    .replace('opus-4-5', 'Opus 4.5')
    .replace('sonnet-4', 'Sonnet 4')
    .replace('gpt-4o', 'GPT-4o')
    .replace('gemini-2.0-flash', 'Gemini 2.0 Flash');
}

export const MODEL_OPTIONS = [
  { value: 'anthropic/claude-opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
] as const;

export const MODEL_OPTIONS_RAW = [
  { value: 'anthropic/claude-opus-4-5', label: 'anthropic/claude-opus-4-5' },
  { value: 'anthropic/claude-sonnet-4', label: 'anthropic/claude-sonnet-4' },
  { value: 'openai/gpt-4o', label: 'openai/gpt-4o' },
  { value: 'google/gemini-2.0-flash', label: 'google/gemini-2.0-flash' },
] as const;

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
