'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Integration } from '@/types/openclaw';

interface IntegrationRowProps {
  integration: Integration;
  onConnect?: () => void;
  className?: string;
}

function IntegrationIcon({ icon }: { icon: string }) {
  if (icon === 'gmail') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.5 4h-17A1.5 1.5 0 002 5.5v13A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0020.5 4z" fill="#F2F2F2" stroke="#E0E0E0" strokeWidth="0.5" />
        <path d="M2 5.5L12 13l10-7.5" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 18.5V5.5l10 7.5" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 18.5V5.5l-10 7.5" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 5.5h20" stroke="#FBBC05" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === 'linkedin') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2" />
        <path d="M7.5 10v6.5M7.5 7.5v.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 16.5V13c0-1.5.5-3 2.5-3s2 1.5 2 3v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">
      {icon.charAt(0).toUpperCase()}
    </div>
  );
}

export default function IntegrationRow({ integration, onConnect, className }: IntegrationRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 py-5 px-1',
        'border-b border-gray-100 last:border-b-0',
        className
      )}
    >
      <div className="shrink-0">
        <IntegrationIcon icon={integration.icon} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">
            {integration.name}
          </h4>
          {integration.comingSoon && (
            <Badge
              className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium hover:bg-amber-50"
            >
              Coming soon
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          {integration.description}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-gray-400">
          {integration.connected ? 'Connected' : 'Not connected'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="border-gray-400 text-gray-800 bg-white hover:bg-gray-50 font-medium"
        >
          {integration.connected ? 'Manage' : 'Connect'}
        </Button>
      </div>
    </div>
  );
}
