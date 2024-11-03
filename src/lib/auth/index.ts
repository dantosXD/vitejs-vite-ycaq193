import { AuthService } from './auth-service';
import { useAuth } from './auth-store';
import type { User, AuthError, UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './constants';

export {
  AuthService,
  useAuth,
  type User,
  type AuthError,
  type UserPreferences,
  DEFAULT_PREFERENCES,
};