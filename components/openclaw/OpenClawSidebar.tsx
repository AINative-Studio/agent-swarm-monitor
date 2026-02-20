'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Globe,
  Phone,
  Clock,
  Activity,
  Users,
  Settings,
  MessageSquare,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Integrations', href: '/integrations', icon: Globe },
  { name: 'Channels', href: '/channels', icon: Phone },
  { name: 'Audit Log', href: '/audit-log', icon: Clock },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface OpenClawSidebarProps {
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  className?: string;
}

export default function OpenClawSidebar({
  userName = 'Toby Morning',
  userEmail = 'toby@ainative.studio',
  userInitials = 'TM',
  className,
}: OpenClawSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col w-[220px] min-h-screen bg-[#FAF9F6] border-r border-[#EEECEA]',
        className
      )}
      role="navigation"
      aria-label="OpenClaw navigation"
    >
      {/* Brand header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-6">
        <Sparkles className="h-5 w-5 text-gray-900" aria-hidden="true" />
        <span className="text-sm font-semibold text-gray-900">AINative Studio</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-auto" aria-hidden="true" />
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                active
                  ? 'bg-[#F0EFEC] text-gray-900 font-medium'
                  : 'text-[#6B6B6B] hover:bg-[#F5F4F1] hover:text-gray-900'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-gray-900' : 'text-[#8C8C8C]')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2 pb-4 space-y-2">
        {/* Message Founders */}
        <Link
          href="/message-founders"
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#6B6B6B] hover:bg-[#F5F4F1] hover:text-gray-900 rounded-lg transition-colors"
        >
          <MessageSquare className="h-4 w-4 shrink-0 text-[#8C8C8C]" />
          <span>Message Founders</span>
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-medium text-[#6B6B6B]"
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-[#8C8C8C] truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
