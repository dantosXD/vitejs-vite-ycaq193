import { ID, AppwriteException } from 'appwrite';
import { account } from '../appwrite/services';
import type { AuthError, User } from './types';
import { DEFAULT_PREFERENCES } from './constants';

export class AuthService {
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (error instanceof AppwriteException && error.code === 401) {
          throw error; // Don't retry auth failures
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    throw lastError;
  }

  private static handleError(error: any): AuthError {
    console.error('Auth error:', error);

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
        case 400:
          return {
            name: 'ValidationError',
            message: error.message || 'Invalid input provided',
            code: 400,
          };
        case 409:
          return {
            name: 'ConflictError',
            message: 'An account with this email already exists',
            code: 409,
          };
        default:
          return {
            name: 'AppwriteError',
            message: error.message || 'An unexpected error occurred with the service',
            code: error.code,
          };
      }
    }

    return {
      name: error?.name || 'UnknownError',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      code: error?.code || 500,
    };
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Create email session with retry
      await this.retryOperation(() => 
        account.createEmailSession(email, password)
      );

      // Get user data with retry
      const user = await this.retryOperation(() => 
        account.get()
      );

      if (!user) {
        throw new Error('Failed to get user data');
      }

      // Get user preferences
      let preferences = DEFAULT_PREFERENCES;
      try {
        const prefs = await this.retryOperation(() => 
          account.getPrefs()
        );
        preferences = {
          ...DEFAULT_PREFERENCES,
          ...prefs,
        };
      } catch (error) {
        console.warn('Failed to load preferences, using defaults:', error);
      }

      return {
        ...user,
        preferences,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      // Create user account with retry
      const user = await this.retryOperation(() => 
        account.create(ID.unique(), email, password, name)
      );
      
      // Create session with retry
      await this.retryOperation(() => 
        account.createEmailSession(email, password)
      );
      
      // Set default preferences with retry
      await this.retryOperation(() => 
        account.updatePrefs(DEFAULT_PREFERENCES)
      );

      return {
        ...user,
        preferences: DEFAULT_PREFERENCES,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      await this.retryOperation(() => 
        account.deleteSession('current')
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!navigator.onLine) {
        return null;
      }

      // Try to get the current session with retry
      try {
        await this.retryOperation(() => 
          account.getSession('current')
        );
      } catch (error) {
        if (error instanceof AppwriteException && error.code === 401) {
          return null;
        }
        throw error;
      }

      // Get user data with retry
      const user = await this.retryOperation(() => 
        account.get()
      );

      if (!user) {
        return null;
      }

      // Get user preferences with retry
      let preferences = DEFAULT_PREFERENCES;
      try {
        const prefs = await this.retryOperation(() => 
          account.getPrefs()
        );
        preferences = {
          ...DEFAULT_PREFERENCES,
          ...prefs,
        };
      } catch (error) {
        console.warn('Failed to load preferences, using defaults:', error);
      }

      return {
        ...user,
        preferences,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async updatePreferences(preferences: Partial<User['preferences']>): Promise<User['preferences']> {
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      const currentPrefs = await this.retryOperation(() => 
        account.getPrefs()
      );

      const updatedPrefs = {
        ...DEFAULT_PREFERENCES,
        ...currentPrefs,
        ...preferences,
      };
      
      await this.retryOperation(() => 
        account.updatePrefs(updatedPrefs)
      );

      return updatedPrefs;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}