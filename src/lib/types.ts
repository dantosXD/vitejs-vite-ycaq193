// Appwrite specific types
export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

export interface User extends AppwriteDocument {
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
}

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
    defaultCatchView: 'table' | 'grid' | 'timeline';
    measurementSystem: 'imperial' | 'metric';
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  };
}

export interface AuthError {
  name: string;
  message: string;
  code: number;
}

// ... rest of your types