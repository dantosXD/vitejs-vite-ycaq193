import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { User, AuthError } from './types';
import { AuthService } from './auth-service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
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
          set({ isLoading: false, user: null, error: error });
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
          set({ isLoading: false, user: null, error: error });
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
          set({ isLoading: false, error: error });
          toast.error(error.message);
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          if (!navigator.onLine) {
            const persistedUser = get().user;
            set({
              user: persistedUser,
              isLoading: false,
              isOnline: false,
              error: null,
            });
            return;
          }

          const user = await AuthService.getCurrentUser();
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            isLoading: false,
            error: error,
          });
        }
      },

      updatePreferences: async (preferences) => {
        try {
          set({ isLoading: true, error: null });
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          await AuthService.updatePreferences(preferences);
          
          const user = {
            ...currentUser,
            preferences: {
              ...currentUser.preferences,
              ...preferences,
            },
          };

          set({
            user,
            isLoading: false,
            error: null,
          });
          toast.success('Preferences updated successfully');
        } catch (error: any) {
          set({ isLoading: false, error: error });
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