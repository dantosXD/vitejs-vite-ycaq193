import { Permission, Role } from 'appwrite';

export const ENDPOINTS = {
  API: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://mentor-db.sustainablegrowthlabs.com/v1',
  PROJECT: import.meta.env.VITE_APPWRITE_PROJECT,
  API_KEY: import.meta.env.VITE_APPWRITE_API_KEY,
} as const;

export const DATABASE_ID = 'fishlog';

export const COLLECTIONS = {
  USERS: 'users',
  CATCHES: 'catches',
  GROUPS: 'groups',
  EVENTS: 'events',
  COMMENTS: 'comments',
  CHALLENGES: 'challenges',
} as const;

export const BUCKETS = {
  CATCH_PHOTOS: 'catch-photos',
  GROUP_AVATARS: 'group-avatars',
  USER_AVATARS: 'user-avatars',
} as const;

export const COLLECTION_PERMISSIONS = {
  [COLLECTIONS.USERS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.user('${document.userId}'))],
  },
  [COLLECTIONS.CATCHES]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.user('${document.userId}'))],
  },
  [COLLECTIONS.GROUPS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
  },
  [COLLECTIONS.EVENTS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
  },
  [COLLECTIONS.COMMENTS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.user('${document.userId}'))],
  },
  [COLLECTIONS.CHALLENGES]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
  },
} as const;

export const BUCKET_PERMISSIONS = {
  [BUCKETS.CATCH_PHOTOS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  [BUCKETS.GROUP_AVATARS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  [BUCKETS.USER_AVATARS]: {
    read: [Permission.read(Role.users())],
    write: [Permission.write(Role.users())],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
} as const;