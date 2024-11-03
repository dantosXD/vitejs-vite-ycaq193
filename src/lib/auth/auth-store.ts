import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { AuthService } from './auth-service';
import type { User, AuthError, UserPreferences } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isOnline: navigator.onLine,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const user = await AuthService.login(email, password);
          set({ user, isLoading: false, error: null });
          toast.success('Welcome back!');
        } catch (error: any) {
          set({ isLoading: false, user: null, error });
          toast.error(error.message);
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          const user = await AuthService.register(email, password, name);
          set({ user, isLoading: false, error: null });
          toast.success('Account created successfully!');
        } catch (error: any) {
          set({ isLoading: false, user: null, error });
          toast.error(error.message);
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          await AuthService.logout();
          set({ user: null, isLoading: false, error: null });
          toast.success('Logged out successfully');
        } catch (error: any) {
          set({ isLoading: false, error });
          toast.error(error.message);
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await AuthService.getCurrentUser();
          set({ user, isLoading: false, error: null });
        } catch (error: any) {
          set({ isLoading: false, error });
        }
      },

      updatePreferences: async (preferences: Partial<UserPreferences>) => {
        try {
          set({ isLoading: true, error: null });
          const updatedPrefs = await AuthService.updatePreferences(preferences);
          const user = get().user;
          if (user) {
            set({
              user: { ...user, preferences: updatedPrefs },
              isLoading: false,
              error: null,
            });
          }
          toast.success('Preferences updated successfully');
        } catch (error: any) {
          set({ isLoading: false, error });
          toast.error(error.message);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAuth.getState().checkAuth();
  });

  window.addEventListener('offline', () => {
    useAuth.setState({ isOnline: false });
  });
}

// Initialize auth state
useAuth.getState().checkAuth();