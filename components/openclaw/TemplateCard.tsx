'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenClawTemplate } from '@/types/openclaw';

interface TemplateCardProps {
  template: OpenClawTemplate;
  onSelect?: () => void;
  className?: string;
}

const iconColorMap: Record<string, { bg: string; text: string }> = {
  github: { bg: 'bg-gray-100', text: 'text-gray-700' },
  linear: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  git: { bg: 'bg-orange-50', text: 'text-orange-600' },
  grafana: { bg: 'bg-orange-50', text: 'text-orange-600' },
  pagerduty: { bg: 'bg-green-50', text: 'text-green-700' },
  slack: { bg: 'bg-purple-50', text: 'text-purple-600' },
  twilio: { bg: 'bg-red-50', text: 'text-red-600' },
  linkedin: { bg: 'bg-blue-50', text: 'text-blue-700' },
  email: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

function formatIconLabel(icon: string): string {
  const labels: Record<string, string> = {
    github: 'GitHub',
    linear: 'Linear',
    git: 'Git',
    grafana: 'Grafana',
    pagerduty: 'PagerDuty',
    slack: 'Slack',
    twilio: 'Twilio',
    linkedin: 'LinkedIn',
    email: 'Email',
  };
  return labels[icon] ?? icon;
}

export default function TemplateCard({ template, onSelect, className }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-start text-left rounded-lg border border-gray-200',
        'bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <ArrowUpRight
        className="absolute top-4 right-4 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />

      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
        {template.name}
      </h3>

      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
        {template.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {template.icons.map((icon) => {
          const colors = iconColorMap[icon] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
          return (
            <span
              key={icon}
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                colors.bg,
                colors.text
              )}
            >
              {formatIconLabel(icon)}
            </span>
          );
        })}
      </div>
    </button>
  );
}
