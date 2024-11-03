export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    groupInvites: boolean;
    challengeUpdates: boolean;
    newComments: boolean;
  };
  privacy: {
    showEmail: boolean;
    showLocation: boolean;
    publicProfile: boolean;
  };
  displaySettings: {
    defaultCatchView: 'grid' | 'table' | 'timeline';
    measurementSystem: 'imperial' | 'metric';
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  };
}

export interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface AuthError {
  name: string;
  message: string;
  code: number;
}