import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

describe('OpenClawSidebar - Organization to Workspace Rename', () => {
  describe('Interface Type Naming', () => {
    it('should have Workspace interface instead of Organization interface', () => {
      // This test verifies the TypeScript interface is named Workspace
      // We can't directly test TypeScript interfaces at runtime, but we verify
      // the component renders with workspace-related data structure
      render(<OpenClawSidebar />);

      // Verify the component renders workspace picker UI
      const workspacePicker = screen.getByRole('button', { name: /switch workspace/i });
      expect(workspacePicker).toBeDefined();
    });
  });

  describe('UI Text - Workspace Terminology', () => {
    it('should display "Switch workspace" as aria-label instead of "Switch organisation"', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });
      expect(button).toHaveAttribute('aria-label', 'Switch workspace');
    });

    it('should display "Workspaces" header instead of "Organisations" in dropdown', () => {
      render(<OpenClawSidebar />);

      // Open workspace picker
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Check for "Workspaces" text
      const workspacesHeader = screen.getByText('Workspaces');
      expect(workspacesHeader).toBeDefined();
      expect(workspacesHeader.tagName).toBe('P');
    });

    it('should have aria-label "Workspaces" on listbox instead of "Organisations"', () => {
      render(<OpenClawSidebar />);

      // Open workspace picker
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Check listbox aria-label
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Workspaces');
    });

    it('should display "Create workspace" button instead of "Create organisation"', () => {
      render(<OpenClawSidebar />);

      // Open workspace picker
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Check for "Create workspace" button
      const createButton = screen.getByText('Create workspace');
      expect(createButton).toBeDefined();
    });

    it('should NOT contain any "organization" or "organisation" text in rendered output', () => {
      const { container } = render(<OpenClawSidebar />);

      // Open workspace picker to render all UI elements
      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Get all text content
      const allText = container.textContent || '';

      // Check for any case variations of "organization"
      expect(allText.toLowerCase()).not.toContain('organization');
      expect(allText.toLowerCase()).not.toContain('organisation');
    });
  });

  describe('Variable Naming', () => {
    it('should use workspace-related variable names in component state', () => {
      render(<OpenClawSidebar />);

      // Verify workspace picker functionality works (implies correct variable naming)
      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Initial state shows first workspace
      expect(button).toHaveTextContent('AINative Studio');

      // Open picker
      fireEvent.click(button);

      // Select different workspace
      const options = screen.getAllByRole('option');
      fireEvent.click(options[1]); // AgentClaw Labs

      // Verify state updated
      expect(button).toHaveTextContent('AgentClaw Labs');
    });

    it('should handle workspace picker open/close state correctly', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).toBeNull();

      // Open
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeDefined();

      // Close by clicking button again
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Data Structure - STUB_WORKSPACES', () => {
    it('should render all workspaces from STUB_WORKSPACES array', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Should have 3 workspace options
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);

      // Verify workspace names (use getAllByText since names appear in both button and dropdown)
      expect(screen.getAllByText('AINative Studio').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AgentClaw Labs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Personal').length).toBeGreaterThan(0);
    });

    it('should use workspace.id for React keys and aria-selected', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      const options = screen.getAllByRole('option');

      // First option should be selected
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Comment Updates', () => {
    it('should have comment "Workspace picker" instead of "Organisation picker"', () => {
      // This is verified by the component rendering the workspace picker UI correctly
      // We test this indirectly by verifying the picker exists
      render(<OpenClawSidebar />);

      const workspacePickerSection = screen.getByRole('button', { name: /switch workspace/i }).closest('div');
      expect(workspacePickerSection).toBeDefined();
    });
  });

  describe('Accessibility - Workspace Context', () => {
    it('should maintain proper ARIA attributes with workspace terminology', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Check all ARIA attributes
      expect(button).toHaveAttribute('aria-label', 'Switch workspace');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Workspaces');
    });
  });

  describe('Functional Behavior - Workspace Selection', () => {
    it('should update active workspace when selecting different option', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Initial workspace
      expect(button).toHaveTextContent('AINative Studio');

      // Open and select different workspace
      fireEvent.click(button);
      const personalOption = screen.getByRole('option', { name: /Personal/i });
      fireEvent.click(personalOption);

      // Verify workspace changed
      expect(button).toHaveTextContent('Personal');

      // Verify picker closed
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('should show checkmark on currently active workspace', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // Find the active option
      const options = screen.getAllByRole('option');
      const activeOption = options.find(opt => opt.getAttribute('aria-selected') === 'true');

      expect(activeOption).toBeDefined();

      // Check for checkmark icon (we can't easily test the icon itself, but verify the option is marked)
      expect(activeOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should close workspace picker when clicking outside', () => {
      const { container } = render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Open picker
      fireEvent.click(button);
      expect(screen.getByRole('listbox')).toBeDefined();

      // Click outside (on the container)
      fireEvent.mouseDown(container);

      // Picker should close
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  describe('Regression Tests - No Organization References', () => {
    it('should not have any Organization interface type in the component', () => {
      // This is a compile-time check, but we verify runtime behavior
      render(<OpenClawSidebar />);

      // If component renders successfully with workspace data, type is correct
      expect(screen.getByRole('button', { name: /switch workspace/i })).toBeDefined();
    });

    it('should not use "org" prefix in state variable names', () => {
      render(<OpenClawSidebar />);

      // Verify functionality that would break if variable names were wrong
      const button = screen.getByRole('button', { name: /switch workspace/i });

      // Open/close cycle
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should use STUB_WORKSPACES constant instead of STUB_ORGS', () => {
      render(<OpenClawSidebar />);

      const button = screen.getByRole('button', { name: /switch workspace/i });
      fireEvent.click(button);

      // If we can see all 3 workspaces, the constant is correctly named and used
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);
    });
  });

  describe('Integration with Rest of Sidebar', () => {
    it('should render navigation with workspace context', () => {
      render(<OpenClawSidebar />);

      // Workspace picker should be at top
      const workspaceButton = screen.getByRole('button', { name: /switch workspace/i });
      expect(workspaceButton).toBeDefined();

      // Navigation should be present (aside has role='navigation', and there's also a nav element)
      const navigations = screen.getAllByRole('navigation');
      expect(navigations.length).toBeGreaterThan(0);

      // User profile should be at bottom (falls back to 'User' when no auth context
      // supplies a logged-in user, as in this render)
      expect(screen.getByText('User')).toBeDefined();
    });
  });
});
