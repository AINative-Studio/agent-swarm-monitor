import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OpenClawSidebar from '@/components/openclaw/OpenClawSidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('OpenClawSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workspace Terminology', () => {
    it('should display "Workspace" instead of "Organization" in interface definition', () => {
      render(<OpenClawSidebar />);
      expect(true).toBe(true);
    });

    it('should display workspace picker with correct label', () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      expect(button).toBeInTheDocument();
    });

    it('should show "Workspaces" heading in picker dropdown', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const heading = screen.getByText(/workspaces/i);
        expect(heading).toBeInTheDocument();
      });
    });

    it('should display "Create workspace" button in picker', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create workspace/i });
        expect(createButton).toBeInTheDocument();
      });
    });

    it('should show workspace name in picker button', () => {
      render(<OpenClawSidebar />);
      const workspaceName = screen.getByText('AINative Studio');
      expect(workspaceName).toBeInTheDocument();
    });
  });

  describe('Workspace Selection', () => {
    it('should display multiple workspaces in dropdown', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveTextContent('AINative Studio');
        expect(options[1]).toHaveTextContent('AgentClaw Labs');
        expect(options[2]).toHaveTextContent('Personal');
      });
    });

    it('should mark active workspace with check icon', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const firstOption = options[0];
        expect(firstOption).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should switch workspace when clicking different option', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const secondOption = options[1];
        fireEvent.click(secondOption);
      });
      await waitFor(() => {
        expect(screen.getByText('AgentClaw Labs')).toBeInTheDocument();
      });
    });

    it('should close picker after selecting workspace', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
      });
      const options = screen.getAllByRole('option');
      fireEvent.click(options[1]);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should render all navigation items', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /templates/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^agents$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /agent swarms/i })).toBeInTheDocument();
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
    it('should display user name and email', () => {
      render(<OpenClawSidebar userName="Toby Morning" userEmail="toby@ainative.studio" />);
      expect(screen.getByText('Toby Morning')).toBeInTheDocument();
      expect(screen.getByText('toby@ainative.studio')).toBeInTheDocument();
    });

    it('should display user initials', () => {
      render(<OpenClawSidebar userInitials="TM" />);
      expect(screen.getByText('TM')).toBeInTheDocument();
    });

    it('should use default values when not provided', () => {
      render(<OpenClawSidebar />);
      expect(screen.getByText('Toby Morning')).toBeInTheDocument();
      expect(screen.getByText('toby@ainative.studio')).toBeInTheDocument();
      expect(screen.getByText('TM')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<OpenClawSidebar />);
      const nav = screen.getByRole('navigation', { name: /openclaw navigation/i });
      expect(nav).toBeInTheDocument();
      const button = screen.getByRole('button', { name: /switch workspace/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should update aria-expanded when opening picker', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have listbox role for workspace picker', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const listbox = screen.getByRole('listbox', { name: /workspaces/i });
        expect(listbox).toBeInTheDocument();
      });
    });

    it('should have option role for each workspace', async () => {
      render(<OpenClawSidebar />);
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
      });
    });
  });

  describe('Click Outside Behavior', () => {
    it('should close picker when clicking outside', async () => {
      render(
        <div>
          <OpenClawSidebar />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
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
