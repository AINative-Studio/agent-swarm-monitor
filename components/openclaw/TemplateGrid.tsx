'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenClawTemplate } from '@/types/openclaw';
import TemplateCard from './TemplateCard';

interface TemplateGridProps {
  templates: OpenClawTemplate[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onSelectTemplate?: (template: OpenClawTemplate) => void;
  className?: string;
}

export default function TemplateGrid({
  templates,
  title,
  showViewAll = false,
  onViewAll,
  onSelectTemplate,
  className,
}: TemplateGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || showViewAll) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {title}
            </h2>
          )}
          {showViewAll && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              View all templates
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate?.(template)}
          />
        ))}
      </div>
    </div>
  );
}
