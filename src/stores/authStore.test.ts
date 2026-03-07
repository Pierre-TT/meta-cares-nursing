import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    removeQueries: vi.fn(),
  },
}));

import { useAuthStore } from './authStore';
import type { User } from './authStore';

const mockUser: User = {
  id: '1',
  email: 'nurse@metacares.be',
  role: 'nurse',
  firstName: 'Marie',
  lastName: 'Laurent',
  inamiNumber: '1-12345-67-890',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, initialized: true });
  });

  it('starts with null user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets user and clears loading', () => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.loading).toBe(false);
  });

  it('logs out correctly', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().loading).toBe(true);
  });
});