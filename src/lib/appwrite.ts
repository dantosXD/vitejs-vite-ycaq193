export {
  defaultClient as client,
  getClient,
  resetClient,
} from './appwrite/init';

export {
  account,
  databases,
  storage,
  functions,
  avatars,
  initializeServices,
  isInitialized,
  isServicesInitialized,
  resetServices,
} from './appwrite/services';

export {
  DATABASE_ID,
  COLLECTIONS,
  BUCKETS,
} from './appwrite/constants';

export {
  uploadFile,
  getFilePreview,
  deleteFile,
  getImageUrl,
  getStorage,
} from './appwrite/utils';

// Re-export all constants
export * from './appwrite/constants';