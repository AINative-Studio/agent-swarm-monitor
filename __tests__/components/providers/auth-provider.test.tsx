import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import AuthProvider, { useAuth } from '@/components/providers/auth-provider';
import authService from '@/lib/auth-service';
import apiClient from '@/lib/api-client';

// Issue #135: logging out in one tab only cleared that tab's own
// localStorage/in-memory apiClient token -- a different, already-open tab
// never noticed and stayed fully authenticated indefinitely. The fix listens
// for the browser's `storage` event (which fires in every OTHER tab when a
// localStorage key changes) so every open tab clears its own session and
// redirects as soon as any tab's access token is removed.

const mockReplace = vi.fn();
let mockPathname = '/agents';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock('@/lib/auth-service', () => ({
  default: {
    restoreSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const setTokenSpy = vi.spyOn(apiClient, 'setToken');

function Probe() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return <div>{user ? `logged in as ${user.email}` : 'logged out'}</div>;
}

describe('AuthProvider cross-tab logout (issue #135)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/agents';
    vi.mocked(authService.restoreSession).mockReturnValue({
      userId: 'u1',
      email: 'toby@ainative.studio',
      fullName: 'Toby Morning',
      workspaceId: 'w1',
    });
  });

  it('clears the in-memory session and apiClient token when another tab removes the access token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('logged in as toby@ainative.studio')).toBeInTheDocument();
    });

    // Simulate Tab B logging out: it removes the access token key from the
    // shared localStorage, which fires a `storage` event in every OTHER tab
    // (this one) with newValue === null.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'openclaw_access_token',
          oldValue: 'some-old-token',
          newValue: null,
          storageArea: window.localStorage,
        })
      );
    });

    // This tab's own in-memory session clears -- its existing
    // `!user && pathname !== '/login'` redirect guard (same one issue #124
    // relies on) takes it from here and sends it to /login, same as any
    // other dead-session case.
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText(/logged in as/)).not.toBeInTheDocument();
    expect(setTokenSpy).toHaveBeenCalledWith(null);
  });

  it('ignores storage events for unrelated keys', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('logged in as toby@ainative.studio')).toBeInTheDocument();
    });

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'some_unrelated_key',
        oldValue: 'a',
        newValue: null,
        storageArea: window.localStorage,
      })
    );

    // Still logged in -- an unrelated key change must not log this tab out.
    expect(screen.getByText('logged in as toby@ainative.studio')).toBeInTheDocument();
  });

  it('ignores a storage event where the access token key still has a value (e.g. a token refresh, not a logout)', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('logged in as toby@ainative.studio')).toBeInTheDocument();
    });

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'openclaw_access_token',
        oldValue: 'old-token',
        newValue: 'refreshed-token',
        storageArea: window.localStorage,
      })
    );

    expect(screen.getByText('logged in as toby@ainative.studio')).toBeInTheDocument();
  });
});
