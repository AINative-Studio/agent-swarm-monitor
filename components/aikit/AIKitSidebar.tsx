import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export interface AIKitSidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AIKitSidebar({
  items,
  isCollapsed = false,
  onToggle,
  className = '',
}: AIKitSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      data-testid="aikit-sidebar"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">AgentClaw</h2>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-toggle"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-foreground"
            >
              <path
                d="M10 4L6 8L10 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn('transition-transform', isCollapsed && 'rotate-180')}
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 p-2" role="navigation" aria-label="Main navigation">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground font-medium',
                    isCollapsed && 'justify-center'
                  )}
                  data-testid={`nav-item-${item.label.toLowerCase()}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full"
                          data-testid={`badge-${item.label.toLowerCase()}`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
