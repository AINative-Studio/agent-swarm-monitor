'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Network,
  Globe,
  Phone,
  Clock,
  Activity,
  Users,
  Settings,
  MessageSquare,
  MessagesSquare,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import ComingSoonModal from '@/components/openclaw/ComingSoonModal';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Agent Swarms', href: '/swarms', icon: Network },
  { name: 'Conversations', href: '/conversations', icon: MessagesSquare },
  { name: 'Integrations', href: '/integrations', icon: Globe },
  { name: 'Channels', href: '/channels', icon: Phone },
  { name: 'Audit Log', href: '/audit-log', icon: Clock },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Recursive Intelligence', href: '/recursive-intelligence', icon: RefreshCw },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Multi-workspace switching is not backed by anything real yet: there is no
// API endpoint that scopes agents/swarms/templates/team data by workspace,
// and the authenticated user only ever has a single, fixed `workspaceId`.
// A three-item stub list that silently "switches" was purely cosmetic and
// didn't even persist across navigation (issue #136) -- worse, it implied a
// multi-tenant data-isolation boundary that doesn't exist. Rather than fake
// persistence (which would still be misleading about real data scoping),
// this surfaces the user's one real workspace and marks the switcher itself
// as not-yet-functional via the same ComingSoonModal pattern used for the
// Gmail/LinkedIn integrations and the Settings 2FA/sessions buttons.
const DEFAULT_WORKSPACE_NAME = 'AINative Studio';

interface OpenClawSidebarProps {
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  className?: string;
}

export default function OpenClawSidebar({
  userName: propUserName,
  userEmail: propUserEmail,
  userInitials: propUserInitials,
  className,
}: OpenClawSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userName = user?.fullName || propUserName || 'User';
  const userEmail = user?.email || propUserEmail || '';
  const userInitials = propUserInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const workspaceName = DEFAULT_WORKSPACE_NAME;
  const [workspaceComingSoonOpen, setWorkspaceComingSoonOpen] = useState(false);

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
      {/* Workspace indicator -- multi-workspace switching isn't backed by
          any real data scoping yet (see comment above DEFAULT_WORKSPACE_NAME),
          so this shows the user's one real workspace and opens a "Coming
          soon" notice on click instead of pretending to switch anything. */}
      <div className="relative px-2 pt-4 pb-4">
        <button
          type="button"
          onClick={() => setWorkspaceComingSoonOpen(true)}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left transition-colors hover:bg-[#F0EFEC]"
          aria-haspopup="dialog"
          aria-label="Switch workspace (coming soon)"
        >
          <svg
            viewBox="0 0 48 42"
            className="h-7 w-7 shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g transform="scale(1.12) translate(-1,-1)">
              <path
                d="M8.54931 29.4455L13.8414 35.9711C13.906 36.0508 13.9578 36.1401 14.0068 36.2302C14.3773 36.9129 14.9904 36.9386 15.3299 36.2802C15.3923 36.1592 15.4125 36.0216 15.4125 35.8854L15.4125 29.4455L8.54931 29.4455Z"
                fill="#1a1a1a"
              />
              <path
                d="M31.7069 1.72461H35.4092C36.9208 1.72461 38.1461 2.94996 38.1461 4.46151V11.1064C38.1461 11.8851 38.4778 12.6269 39.0581 13.1461L41.3962 15.2381L39.0581 17.3301C38.4778 17.8493 38.1461 18.5911 38.1461 19.3697V25.6725C38.1461 27.1841 36.9208 28.4094 35.4092 28.4094H31.7069"
                stroke="#5867EF"
                strokeWidth="3.079"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M25.7264 28.4094L7.52649 28.4094C6.01494 28.4094 4.78958 27.1841 4.78958 25.6725L4.78958 19.0276C4.78958 18.249 4.45792 17.5072 3.87763 16.988L1.53951 14.896L3.87763 12.8039C4.45792 12.2847 4.78958 11.543 4.78958 10.7643L4.78958 4.4615C4.78958 2.94995 6.01494 1.7246 7.52649 1.7246L25.7264 1.7246"
                stroke="#1a1a1a"
                strokeWidth="3.079"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <path
              d="M31.5577 11.7462C30.8902 11.7462 30.3106 11.5384 29.8187 11.1227C29.362 10.6724 29.1337 10.1528 29.1337 9.56392C29.1337 8.94041 29.362 8.42081 29.8187 8.00513C30.3106 7.55481 30.8902 7.32965 31.5577 7.32965C32.1901 7.32965 32.7346 7.55481 33.1913 8.00513C33.648 8.42081 33.8764 8.94041 33.8764 9.56392C33.8764 10.1528 33.648 10.6724 33.1913 11.1227C32.7346 11.5384 32.1901 11.7462 31.5577 11.7462ZM31.7158 22.3991C31.4699 22.988 31.0307 23.2824 30.3984 23.2824C30.0471 23.2824 29.766 23.1439 29.5552 22.8668C29.3796 22.6243 29.3093 22.3125 29.3444 21.9315L29.8187 16.6835C29.8539 16.2679 30.0471 15.9215 30.3984 15.6443C30.7848 15.3672 31.2064 15.2287 31.6631 15.2287C32.2955 15.2287 32.7873 15.4538 33.1386 15.9041C33.5251 16.3198 33.648 16.8221 33.5075 17.411L31.7158 22.3991Z"
              fill="#5867EF"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900 truncate min-w-0">
            {workspaceName}
          </span>
          <Badge
            className="ml-auto shrink-0 bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium hover:bg-amber-50"
          >
            Coming soon
          </Badge>
        </button>
      </div>

      <ComingSoonModal
        open={workspaceComingSoonOpen}
        onOpenChange={setWorkspaceComingSoonOpen}
        channelName="Multi-workspace switching"
      />

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
        <a
          href="mailto:support@ainative.studio"
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#6B6B6B] hover:bg-[#F5F4F1] hover:text-gray-900 rounded-lg transition-colors"
        >
          <MessageSquare className="h-4 w-4 shrink-0 text-[#8C8C8C]" />
          <span>Message Founders</span>
        </a>

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-medium text-[#6B6B6B]"
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-[#8C8C8C] truncate">{userEmail}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-[#8C8C8C] hover:text-gray-900 hover:bg-[#F0EFEC] rounded-md transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
