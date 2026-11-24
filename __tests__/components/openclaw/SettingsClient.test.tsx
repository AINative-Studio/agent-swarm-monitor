import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsClient from '@/app/settings/SettingsClient';
import { Toaster } from '@/components/ui/toaster';
import type { OpenClawSettings } from '@/types/openclaw';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditEvents: vi.fn(),
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
}));

import { useSettings, useUpdateSettings } from '@/hooks/useAuditLog';

const mockUseSettings = vi.mocked(useSettings);
const mockUseUpdateSettings = vi.mocked(useUpdateSettings);

// Minimal localStorage mock -- jsdom provides a real one, but we want a
// clean, inspectable store per test for the notification-persistence tests
// (issue #128) without leaking state between tests.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockSettings: OpenClawSettings = {
  gateway: { port: 8787, bindMode: 'localhost', authEnabled: true },
  agentDefaults: {
    defaultModel: 'anthropic/claude-opus-4-5',
    sandboxEnabled: true,
    compactionEnabled: true,
  },
  toolPermissions: { fileAccess: true, networkAccess: true, shellExecution: false },
};

describe('SettingsClient', () => {
  const mutateAsync = vi.fn().mockResolvedValue(mockSettings);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mutateAsync.mockResolvedValue(mockSettings);
    mockUseSettings.mockReturnValue({ data: mockSettings, isLoading: false } as any);
    mockUseUpdateSettings.mockReturnValue({ mutateAsync, isPending: false } as any);
  });

  it('renders the page heading', () => {
    renderWithQueryClient(<SettingsClient />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows a loading state for gateway settings before they arrive', () => {
    mockUseSettings.mockReturnValue({ data: undefined, isLoading: true } as any);
    renderWithQueryClient(<SettingsClient />);
    expect(screen.getByText(/loading gateway settings/i)).toBeInTheDocument();
  });

  it('renders the Gateway section with the current port value', () => {
    renderWithQueryClient(<SettingsClient />);
    expect(screen.getByLabelText('Port')).toHaveValue(8787);
  });

  it('renders the Agent Defaults section', () => {
    renderWithQueryClient(<SettingsClient />);
    expect(screen.getByText('Default model')).toBeInTheDocument();
    expect(screen.getByText('Sandbox by default')).toBeInTheDocument();
  });

  it('renders the Channels section with a link to manage channels', () => {
    renderWithQueryClient(<SettingsClient />);
    expect(screen.getByRole('link', { name: /manage channels/i })).toHaveAttribute(
      'href',
      '/channels'
    );
  });

  it('renders the Tool Permissions section and toggles shell execution', () => {
    renderWithQueryClient(<SettingsClient />);

    const shellSwitch = screen.getByLabelText('Shell execution');
    expect(shellSwitch).not.toBeChecked();

    fireEvent.click(shellSwitch);
    expect(shellSwitch).toBeChecked();
  });

  it('calls the update mutation and shows a saved confirmation on save', async () => {
    renderWithQueryClient(<SettingsClient />);

    fireEvent.click(screen.getByRole('button', { name: /save gateway settings/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  describe('Security section (issue #115)', () => {
    it('opens a "Coming Soon" dialog when "Enable" (2FA) is clicked, instead of doing nothing', () => {
      renderWithQueryClient(<SettingsClient />);

      expect(screen.queryByText(/Two-factor authentication - Coming Soon/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Enable' }));

      expect(screen.getByText('Two-factor authentication - Coming Soon')).toBeInTheDocument();
    });

    it('opens a "Coming Soon" dialog when "View Sessions" is clicked, instead of doing nothing', () => {
      renderWithQueryClient(<SettingsClient />);

      expect(screen.queryByText(/Active sessions - Coming Soon/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'View Sessions' }));

      expect(screen.getByText('Active sessions - Coming Soon')).toBeInTheDocument();
    });
  });

  describe('Notification toggles persistence (issue #128)', () => {
    it('persists a toggle change to localStorage so it survives a reload', () => {
      const { unmount } = renderWithQueryClient(<SettingsClient />);

      const weeklyDigestSwitch = screen.getByLabelText('Weekly digest');
      expect(weeklyDigestSwitch).not.toBeChecked();

      fireEvent.click(weeklyDigestSwitch);
      expect(weeklyDigestSwitch).toBeChecked();

      const stored = JSON.parse(
        window.localStorage.getItem('openclaw_notification_settings') ?? '{}'
      );
      expect(stored.weeklyDigest).toBe(true);

      // Simulate a reload: unmount and render a fresh instance, which should
      // read the persisted value back from localStorage instead of reverting
      // to the hardcoded default.
      unmount();
      renderWithQueryClient(<SettingsClient />);
      expect(screen.getByLabelText('Weekly digest')).toBeChecked();
    });

    it('shows a save confirmation toast when a notification toggle changes', async () => {
      renderWithQueryClient(
        <>
          <SettingsClient />
          <Toaster />
        </>
      );

      fireEvent.click(screen.getByLabelText('Agent error alerts'));

      expect(await screen.findByText(/Agent error alerts disabled/i)).toBeInTheDocument();
    });
  });
});
