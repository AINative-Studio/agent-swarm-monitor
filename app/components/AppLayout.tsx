'use client';

import React, { useState, useEffect } from 'react';
import { AIKitSidebar, SidebarItem } from '@/components/aikit/AIKitSidebar';
import { AIKitModal } from '@/components/aikit/AIKitModal';
import {
  HomeIcon,
  UsersIcon,
  TemplateIcon,
  PlugIcon,
  TeamIcon,
  MenuIcon,
  UserCircleIcon,
} from '@/components/icons';

// Constants
const MOBILE_BREAKPOINT = 768;

const NAVIGATION_ITEMS: SidebarItem[] = [
  {
    icon: <HomeIcon />,
    label: 'Dashboard',
    href: '/',
  },
  {
    icon: <UsersIcon />,
    label: 'Agents',
    href: '/agents',
  },
  {
    icon: <TemplateIcon />,
    label: 'Templates',
    href: '/templates',
  },
  {
    icon: <PlugIcon />,
    label: 'Integrations',
    href: '/integrations',
  },
  {
    icon: <TeamIcon />,
    label: 'Team',
    href: '/team',
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AIKitSidebar
        items={NAVIGATION_ITEMS}
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        className="hidden md:flex"
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleToggleMobileMenu}
          />
          <div className="relative h-full w-64">
            <AIKitSidebar
              items={NAVIGATION_ITEMS}
              isCollapsed={false}
              onToggle={handleToggleMobileMenu}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 py-3 bg-background border-b border-border"
          data-testid="app-header"
        >
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={handleToggleMobileMenu}
              className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Toggle mobile menu"
              data-testid="mobile-menu-toggle"
            >
              <MenuIcon />
            </button>

            {/* Logo/Title */}
            <h1 className="text-xl font-semibold text-foreground">AgentClaw</h1>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={handleToggleUserMenu}
              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="User profile"
              data-testid="user-profile"
            >
              <UserCircleIcon size={24} />
              <span className="hidden sm:inline text-sm text-foreground">User</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6" role="main">
          {children}
        </main>
      </div>

      {/* User Profile Modal */}
      <AIKitModal
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        title="User Menu"
      >
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors">
            Profile
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors">
            Settings
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors text-destructive">
            Logout
          </button>
        </div>
      </AIKitModal>
    </div>
  );
}
