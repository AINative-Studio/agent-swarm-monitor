import { describe, it, expect, vi } from 'vitest';
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

// This file predates the auth context integration and previously exercised
// the (now-removed) STUB_WORKSPACES dropdown switcher directly -- see
// __tests__/components/openclaw/OpenClawSidebar.test.tsx for the full,
// current test suite covering the honest "Coming soon" workspace indicator
// introduced for issue #136. This file is kept as a lightweight smoke test
// so there's still coverage when run from this historical path.
describe('OpenClawSidebar (smoke)', () => {
  it('renders without a functioning multi-workspace switcher', () => {
    render(<OpenClawSidebar userName="Toby Morning" userEmail="toby@ainative.studio" />);

    // Shows the user's one real workspace name, not a switchable list.
    expect(screen.getByText('AINative Studio')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // The control is clearly marked as not-yet-functional.
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /switch workspace \(coming soon\)/i });
    expect(button).toBeInTheDocument();

    // Clicking opens an informational modal rather than switching data.
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders navigation and user profile', () => {
    render(<OpenClawSidebar userName="Toby Morning" userEmail="toby@ainative.studio" />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByText('Toby Morning')).toBeInTheDocument();
    expect(screen.getByText('toby@ainative.studio')).toBeInTheDocument();
  });
});
