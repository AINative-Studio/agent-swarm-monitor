'use client';

import { Activity, AlertCircle, Check, Loader2, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '@/types/openclaw';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
  showLabel?: boolean;
  reconnectAttempts?: number;
}

export function ConnectionStatusBadge({
  status,
  className = '',
  showLabel = true,
  reconnectAttempts = 0,
}: ConnectionStatusBadgeProps) {
  const config = {
    connected: {
      icon: Check,
      label: 'Connected',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
    },
    connecting: {
      icon: Loader2,
      label: 'Connecting...',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      animate: 'animate-spin',
    },
    reconnecting: {
      icon: Activity,
      label: reconnectAttempts > 0
        ? `Reconnecting (${reconnectAttempts})...`
        : 'Reconnecting...',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-600',
      animate: 'animate-pulse',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-600',
    },
    error: {
      icon: AlertCircle,
      label: 'Connection Error',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
    },
  };

  const statusConfig = config[status];
  const {
    icon: Icon,
    label,
    bgColor,
    textColor,
    iconColor,
  } = statusConfig;
  const animate = 'animate' in statusConfig ? statusConfig.animate : undefined;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bgColor} ${className}`}
      role="status"
      aria-label={label}
    >
      <Icon className={`h-3.5 w-3.5 ${iconColor} ${animate || ''}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${textColor}`}>{label}</span>
      )}
    </div>
  );
}
