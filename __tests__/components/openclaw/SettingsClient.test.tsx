import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsClient from '@/app/settings/SettingsClient';
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
});
