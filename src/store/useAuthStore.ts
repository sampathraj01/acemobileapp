import { create } from 'zustand';
import { SessionUser } from '../models/User';
import { createAuthService } from '../services/config';

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setProfile: (profile: Pick<SessionUser, 'isGlobalAdmin'>) => void;
}

const authService = createAuthService();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  checkAuth: async () => {
    const user = await authService.getCurrentUser();
    set({ user, isLoading: false });
  },

  login: async (userId, password) => {
    console.log('useAuthStore login called', userId, password);
    const user = await authService.login(userId, password);
    set({ user, isLoading: false });
    return user !== null;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isLoading: false });
  },

  setProfile: (profile) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...profile } });
    }
  },
}));
