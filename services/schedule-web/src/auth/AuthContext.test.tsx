import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const { mockGetCurrentUser, mockLogin, mockCreateAccount, mockLogout } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockLogin: vi.fn(),
  mockCreateAccount: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    getCurrentUser: mockGetCurrentUser,
    login: mockLogin,
    createAccount: mockCreateAccount,
    logout: mockLogout,
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('restores a saved session on load', async () => {
    const user = { id: 'u1', name: 'Ada', email: 'ada@example.com' };
    localStorage.setItem('schedule-planner:user', JSON.stringify(user));
    mockGetCurrentUser.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.user).toEqual(user);
    });
  });

  it('persists the signed-in user after login', async () => {
    const user = { id: 'u1', name: 'Ada', email: 'ada@example.com' };
    mockLogin.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await result.current.signIn({ email: 'ada@example.com', password: 'test-password' });

    await waitFor(() => {
      expect(localStorage.getItem('schedule-planner:user')).toBe(JSON.stringify(user));
      expect(result.current.user).toEqual(user);
    });
  });
});
