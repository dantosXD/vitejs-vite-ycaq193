import { create } from 'zustand';
import { ID, AppwriteException, Query } from 'appwrite';
import { databases, storage, COLLECTIONS, DATABASE_ID, BUCKETS } from '@/lib/appwrite';
import { toast } from 'sonner';
import type { Catch } from '@/lib/types';

interface CatchState {
  catches: Catch[];
  isLoading: boolean;
  error: Error | null;
  createCatch: (catchData: Omit<Catch, '$id'>, photos: File[]) => Promise<void>;
  updateCatch: (id: string, catchData: Partial<Catch>, newPhotos?: File[]) => Promise<void>;
  deleteCatch: (id: string) => Promise<void>;
  fetchCatches: () => Promise<void>;
  fetchUserCatches: (userId: string) => Promise<void>;
  fetchGroupCatches: (groupId: string) => Promise<void>;
}

const handleError = (error: unknown, action: string): Error => {
  console.error(`Error ${action}:`, error);

  if (!navigator.onLine) {
    return new Error('You appear to be offline. Please check your internet connection.');
  }

  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401:
        return new Error('Session expired. Please log in again.');
      case 404:
        return new Error('Resource not found.');
      case 429:
        return new Error('Too many requests. Please try again later.');
      case 500:
        return new Error('Server error. Please try again later.');
      case 503:
        return new Error('Service temporarily unavailable. Please try again later.');
      default:
        return new Error(error.message || `Failed to ${action}`);
    }
  }

  return error instanceof Error ? error : new Error(`Failed to ${action}`);
};

export const useCatchStore = create<CatchState>((set, get) => ({
  catches: [],
  isLoading: false,
  error: null,

  createCatch: async (catchData, photos) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      // Upload photos first
      const photoIds = await Promise.all(
        photos.map(photo => storage.createFile(BUCKETS.CATCH_PHOTOS, ID.unique(), photo))
      );

      // Create catch document with photo references
      const catch_ = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CATCHES,
        ID.unique(),
        {
          ...catchData,
          photos: photoIds.map(photo => photo.$id),
          createdAt: new Date().toISOString(),
        }
      );

      set(state => ({
        catches: [catch_ as unknown as Catch, ...state.catches],
        isLoading: false,
        error: null,
      }));

      toast.success('Catch recorded successfully!');
    } catch (error) {
      const handledError = handleError(error, 'record catch');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  updateCatch: async (id, catchData, newPhotos) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      let updatedPhotoIds = catchData.photos || [];

      // Upload new photos if provided
      if (newPhotos?.length) {
        const newPhotoIds = await Promise.all(
          newPhotos.map(photo => storage.createFile(BUCKETS.CATCH_PHOTOS, ID.unique(), photo))
        );
        updatedPhotoIds = [...updatedPhotoIds, ...newPhotoIds.map(photo => photo.$id)];
      }

      // Update catch document
      const updatedCatch = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CATCHES,
        id,
        {
          ...catchData,
          photos: updatedPhotoIds,
          updatedAt: new Date().toISOString(),
        }
      );

      set(state => ({
        catches: state.catches.map(c => c.$id === id ? updatedCatch as unknown as Catch : c),
        isLoading: false,
        error: null,
      }));

      toast.success('Catch updated successfully!');
    } catch (error) {
      const handledError = handleError(error, 'update catch');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  deleteCatch: async (id) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      // Get catch to find associated photos
      const catch_ = get().catches.find(c => c.$id === id);
      
      // Delete catch document
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CATCHES, id);

      // Delete associated photos
      if (catch_?.photos) {
        await Promise.all(
          catch_.photos.map(photoId => 
            storage.deleteFile(BUCKETS.CATCH_PHOTOS, photoId)
          )
        );
      }

      set(state => ({
        catches: state.catches.filter(c => c.$id !== id),
        isLoading: false,
        error: null,
      }));

      toast.success('Catch deleted successfully!');
    } catch (error) {
      const handledError = handleError(error, 'delete catch');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  fetchCatches: async () => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATCHES,
        [Query.orderDesc('$createdAt')]
      );

      set({ 
        catches: response.documents as unknown as Catch[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch catches');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().catches.length === 0) {
        console.warn('Initial catch load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  fetchUserCatches: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATCHES,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
        ]
      );

      set({ 
        catches: response.documents as unknown as Catch[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch user catches');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().catches.length === 0) {
        console.warn('Initial user catches load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  fetchGroupCatches: async (groupId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATCHES,
        [
          Query.search('sharedWithGroups', groupId),
          Query.orderDesc('$createdAt'),
        ]
      );

      set({ 
        catches: response.documents as unknown as Catch[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch group catches');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().catches.length === 0) {
        console.warn('Initial group catches load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },
}));