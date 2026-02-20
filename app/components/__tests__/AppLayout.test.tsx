import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../AppLayout';

// Mock Next.js navigation hooks
const mockPathname = '/';
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sidebar with all navigation items', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    // Check that all 5 navigation items are present
    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-agents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-templates')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-integrations')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-team')).toBeInTheDocument();
  });

  it('renders navigation with correct labels', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('highlights active navigation item based on route', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const dashboardLink = screen.getByTestId('nav-item-dashboard');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders user profile in header', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
  });

  it('toggles sidebar on hamburger click', async () => {
    const user = userEvent.setup();
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('aikit-sidebar');
    const toggleButton = screen.getByTestId('sidebar-toggle');

    // Sidebar should start expanded (w-64)
    expect(sidebar).toHaveClass('w-64');

    // Click toggle button
    await user.click(toggleButton);

    // Sidebar should be collapsed (w-16)
    await waitFor(() => {
      expect(sidebar).toHaveClass('w-16');
    });

    // Click again to expand
    await user.click(toggleButton);

    await waitFor(() => {
      expect(sidebar).toHaveClass('w-64');
    });
  });

  it('collapses sidebar on mobile viewport', () => {
    // Mock window.innerWidth for mobile
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('aikit-sidebar');

    // On mobile, sidebar should be collapsed by default
    expect(sidebar).toHaveClass('w-16');
  });

  it('renders children content in main area', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('applies proper ARIA labels for accessibility', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const navigation = screen.getByRole('navigation', { name: /main navigation/i });
    expect(navigation).toBeInTheDocument();

    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
  });

  it('renders header with logo', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('AgentClaw')).toBeInTheDocument();
  });

  it('has mobile hamburger menu visible on small screens', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const hamburgerButton = screen.getByTestId('mobile-menu-toggle');
    expect(hamburgerButton).toBeInTheDocument();
  });

  it('opens user profile dropdown on click', async () => {
    const user = userEvent.setup();
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const userProfile = screen.getByTestId('user-profile');
    await user.click(userProfile);

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it('has responsive padding for main content area', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass(/p-/);
  });

  it('has smooth transition animations for sidebar toggle', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('aikit-sidebar');
    expect(sidebar).toHaveClass('transition-all');
    expect(sidebar).toHaveClass('duration-300');
  });

  it('renders all navigation icons', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    // Each nav item should have an icon (svg element)
    const navItems = [
      screen.getByTestId('nav-item-dashboard'),
      screen.getByTestId('nav-item-agents'),
      screen.getByTestId('nav-item-templates'),
      screen.getByTestId('nav-item-integrations'),
      screen.getByTestId('nav-item-team'),
    ];

    navItems.forEach((item) => {
      expect(item.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('maintains layout structure with header, sidebar, and main content', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('aikit-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('applies correct background colors matching design system', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('aikit-sidebar');
    expect(sidebar).toHaveClass('bg-card');

    const header = screen.getByTestId('app-header');
    expect(header).toHaveClass('bg-background');
  });
});
