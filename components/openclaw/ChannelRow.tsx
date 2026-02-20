'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types/openclaw';

interface ChannelRowProps {
  channel: Channel;
  onConnect?: () => void;
  className?: string;
}

function ChannelIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, { bg: string; color: string; label: string }> = {
    slack: { bg: 'bg-purple-50', color: 'text-purple-600', label: 'S' },
    telegram: { bg: 'bg-blue-50', color: 'text-blue-500', label: 'T' },
    whatsapp: { bg: 'bg-green-50', color: 'text-green-600', label: 'W' },
    discord: { bg: 'bg-indigo-50', color: 'text-indigo-600', label: 'D' },
    teams: { bg: 'bg-blue-50', color: 'text-blue-700', label: 'M' },
  };

  const config = iconMap[icon];

  if (icon === 'slack') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M6 15a2 2 0 11-2-2h2v2zM7 15a2 2 0 012-2 2 2 0 012 2v5a2 2 0 11-4 0v-5z" fill="#E01E5A" />
          <path d="M9 6a2 2 0 11-2 2V6h2zM9 7a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 110-4h5z" fill="#36C5F0" />
          <path d="M18 9a2 2 0 112 2h-2V9zM17 9a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 114 0v5z" fill="#2EB67D" />
          <path d="M15 18a2 2 0 112-2v2h-2zM15 17a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 110 4h-5z" fill="#ECB22E" />
        </svg>
      </div>
    );
  }

  if (icon === 'telegram') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.57 7.4c-.12.54-.43.67-.87.42l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.48.24l.17-2.4 4.36-3.94c.19-.17-.04-.26-.29-.1l-5.4 3.4-2.32-.73c-.5-.16-.52-.5.11-.75l9.07-3.5c.42-.15.79.1.65.74z" fill="#2AABEE" />
        </svg>
      </div>
    );
  }

  if (icon === 'whatsapp') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="#25D366" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    );
  }

  if (icon === 'discord') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2" />
        </svg>
      </div>
    );
  }

  if (icon === 'teams') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M20.5 7h-3V5.5a1.5 1.5 0 00-1.5-1.5h-8A1.5 1.5 0 006.5 5.5V7h-3A1.5 1.5 0 002 8.5v7A1.5 1.5 0 003.5 17h3v1.5A1.5 1.5 0 008 20h8a1.5 1.5 0 001.5-1.5V17h3a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0020.5 7z" fill="#5059C9" />
          <circle cx="16" cy="4" r="2" fill="#7B83EB" />
          <circle cx="12" cy="7" r="2.5" fill="#5059C9" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold',
      config?.bg ?? 'bg-gray-100',
      config?.color ?? 'text-gray-500'
    )} aria-hidden="true">
      {config?.label ?? icon.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChannelRow({ channel, onConnect, className }: ChannelRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 py-5 px-1',
        'border-b border-gray-100 last:border-b-0',
        className
      )}
    >
      <div className="shrink-0">
        <ChannelIcon icon={channel.icon} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900">
          {channel.name}
        </h4>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          {channel.description}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-gray-400">
          {channel.connected ? 'Connected' : 'Not connected'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="border-gray-400 text-gray-800 bg-white hover:bg-gray-50 font-medium"
        >
          {channel.connected ? 'Manage' : 'Connect'}
        </Button>
      </div>
    </div>
  );
}
