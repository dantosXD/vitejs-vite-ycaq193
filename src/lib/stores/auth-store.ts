import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { ID, AppwriteException } from 'appwrite';
import { account } from '@/lib/appwrite';
import type { User, AuthError } from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/auth/constants';

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

const handleError = (error: unknown): AuthError => {
  if (!navigator.onLine) {
    return {
      name: 'NetworkError',
      message: 'You appear to be offline. Please check your internet connection.',
      code: 0,
    };
  }

  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401:
        return {
          name: 'AuthError',
          message: 'Invalid email or password',
          code: 401,
        };
      case 409:
        return {
          name: 'ConflictError',
          message: 'An account with this email already exists',
          code: 409,
        };
      case 429:
        return {
          name: 'RateLimitError',
          message: 'Too many attempts. Please try again later.',
          code: 429,
        };
      case 503:
        return {
          name: 'ServiceError',
          message: 'Service temporarily unavailable. Please try again later.',
          code: 503,
        };
      default:
        return {
          name: 'AppwriteError',
          message: error.message || 'An unexpected error occurred',
          code: error.code,
        };
    }
  }

  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 500,
  };
};

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

          if (!navigator.onLine) {
            throw new Error('You appear to be offline. Please check your internet connection.');
          }

          // Create email session
          await account.createEmailSession(email, password);

          // Get user data
          const appwriteUser = await account.get();
          
          // Get user preferences
          let preferences = DEFAULT_PREFERENCES;
          try {
            const prefs = await account.getPrefs();
            preferences = {
              ...DEFAULT_PREFERENCES,
              ...prefs,
            };
          } catch (error) {
            console.warn('Failed to load preferences, using defaults');
          }

          const user = {
            ...appwriteUser,
            preferences,
          };

          set({ user, isLoading: false, error: null });
          toast.success('Welcome back!');
        } catch (error) {
          const authError = handleError(error);
          set({ isLoading: false, user: null, error: authError });
          toast.error(authError.message);
          throw authError;
        }
      },

      register: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });

          if (!navigator.onLine) {
            throw new Error('You appear to be offline. Please check your internet connection.');
          }

          // Create user account
          await account.create(ID.unique(), email, password, name);
          
          // Create session
          await account.createEmailSession(email, password);
          
          // Set default preferences
          await account.updatePrefs(DEFAULT_PREFERENCES);

          // Get user data
          const appwriteUser = await account.get();
          const user = {
            ...appwriteUser,
            preferences: DEFAULT_PREFERENCES,
          };

          set({ user, isLoading: false, error: null });
          toast.success('Account created successfully!');
        } catch (error) {
          const authError = handleError(error);
          set({ isLoading: false, user: null, error: authError });
          toast.error(authError.message);
          throw authError;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });

          if (!navigator.onLine) {
            throw new Error('You appear to be offline. Please check your internet connection.');
          }

          await account.deleteSession('current');
          set({ user: null, isLoading: false, error: null });
          toast.success('Logged out successfully');
        } catch (error) {
          const authError = handleError(error);
          set({ isLoading: false, error: authError });
          toast.error(authError.message);
          throw authError;
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

          try {
            const appwriteUser = await account.get();
            if (!appwriteUser) {
              set({ user: null, isLoading: false, error: null });
              return;
            }

            let preferences = DEFAULT_PREFERENCES;
            try {
              const prefs = await account.getPrefs();
              preferences = {
                ...DEFAULT_PREFERENCES,
                ...prefs,
              };
            } catch (error) {
              console.warn('Failed to load preferences, using defaults');
            }

            set({
              user: { ...appwriteUser, preferences },
              isLoading: false,
              error: null,
            });
          } catch (error) {
            if (error instanceof AppwriteException && error.code === 401) {
              set({ user: null, isLoading: false, error: null });
              return;
            }
            throw error;
          }
        } catch (error) {
          const authError = handleError(error);
          set({
            user: null,
            isLoading: false,
            error: authError,
          });
        }
      },

      updatePreferences: async (preferences: Partial<User['preferences']>) => {
        try {
          set({ isLoading: true, error: null });

          if (!navigator.onLine) {
            throw new Error('You appear to be offline. Please check your internet connection.');
          }

          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          const updatedPreferences = {
            ...currentUser.preferences,
            ...preferences,
          };

          await account.updatePrefs(updatedPreferences);

          set({
            user: {
              ...currentUser,
              preferences: updatedPreferences,
            },
            isLoading: false,
            error: null,
          });

          toast.success('Preferences updated successfully');
        } catch (error) {
          const authError = handleError(error);
          set({ isLoading: false, error: authError });
          toast.error(authError.message);
          throw authError;
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