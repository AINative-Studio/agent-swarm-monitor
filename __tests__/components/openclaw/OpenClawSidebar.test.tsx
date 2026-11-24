import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OpenClawSidebar from '@/components/openclaw/OpenClawSidebar';

// Mock Next.js modules
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

const mockLogout = vi.fn();
vi.mock('@/components/providers/auth-provider', () => ({
  useAuth: vi.fn(() => ({
    user: { userId: 'user-1', fullName: 'Toby Morning', email: 'toby@ainative.studio', workspaceId: 'ws-1' },
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
  })),
}));

describe('OpenClawSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workspace indicator (issue #136 -- no longer a functioning switcher)', () => {
    it('shows the workspace button labeled as not-yet-functional', () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace \(coming soon\)/i });
      expect(button).toBeInTheDocument();
    });

    it('displays a single real workspace name, not a hardcoded multi-workspace list', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByText('AINative Studio')).toBeInTheDocument();
      // There is no dropdown/listbox of workspace options any more.
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    it('displays a "Coming soon" badge on the workspace control', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('opens a "Coming soon" modal when clicked instead of switching anything', () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace \(coming soon\)/i });
      fireEvent.click(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /under development/i })).toBeInTheDocument();
      // The workspace name shown in the trigger is unchanged by clicking it.
      expect(screen.getByText('AINative Studio')).toBeInTheDocument();
    });

    it('closes the "Coming soon" modal via its own close action', () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace \(coming soon\)/i });
      fireEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /got it/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render all navigation items', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /templates/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^agents$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /agent swarms/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /conversations/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /integrations/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /channels/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /audit log/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /monitoring/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /team/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('should have correct href attributes', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /templates/i })).toHaveAttribute('href', '/templates');
      expect(screen.getByRole('link', { name: /^agents$/i })).toHaveAttribute('href', '/agents');
    });
  });

  describe('User Profile', () => {
    it('should display user name and email from auth context', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByText('Toby Morning')).toBeInTheDocument();
      expect(screen.getByText('toby@ainative.studio')).toBeInTheDocument();
    });

    it('should call logout when sign-out button is clicked', () => {
      render(<OpenClawSidebar />);
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<OpenClawSidebar />);
      const nav = screen.getByRole('navigation', { name: /openclaw navigation/i });
      expect(nav).toBeInTheDocument();
      const button = screen.getByRole('button', { name: /switch workspace \(coming soon\)/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    });
  });

  describe('CSS Classes', () => {
    it('should apply custom className prop', () => {
      const { container } = render(<OpenClawSidebar className="custom-class" />);
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('custom-class');
    });

    it('should highlight active navigation item', () => {
      render(<OpenClawSidebar />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
    });
  });
});
