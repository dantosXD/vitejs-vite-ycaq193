import { create } from 'zustand';
import { ID, AppwriteException, Query } from 'appwrite';
import { databases, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import type { Comment } from '@/lib/types';

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: Error | null;
  createComment: (catchId: string, content: string, userId: string) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  fetchComments: (catchId: string) => Promise<void>;
}

const handleError = (error: unknown, action: string): Error => {
  console.error(`Error ${action}:`, error);

  if (!navigator.onLine) {
    return new Error('You appear to be offline. Please check your internet connection.');
  }

  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401:
        return new Error('Unauthorized. Please log in again.');
      case 404:
        return new Error('Comment not found.');
      case 429:
        return new Error('Too many requests. Please try again later.');
      case 503:
        return new Error('Service temporarily unavailable. Please try again later.');
      default:
        return new Error(error.message || `Failed to ${action}`);
    }
  }

  return error instanceof Error ? error : new Error(`Failed to ${action}`);
};

export const useCommentStore = create<CommentState>((set) => ({
  comments: [],
  isLoading: false,
  error: null,

  createComment: async (catchId, content, userId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      const comment = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        ID.unique(),
        {
          catchId,
          content,
          userId,
          createdAt: new Date().toISOString(),
        }
      );

      set(state => ({
        comments: [...state.comments, comment as Comment],
        isLoading: false,
        error: null,
      }));

      toast.success('Comment added successfully!');
    } catch (error) {
      const handledError = handleError(error, 'add comment');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  updateComment: async (id, content) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      const updatedComment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        id,
        {
          content,
          updatedAt: new Date().toISOString(),
        }
      );

      set(state => ({
        comments: state.comments.map(c => c.$id === id ? updatedComment as Comment : c),
        isLoading: false,
        error: null,
      }));

      toast.success('Comment updated successfully!');
    } catch (error) {
      const handledError = handleError(error, 'update comment');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  deleteComment: async (id) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COMMENTS, id);

      set(state => ({
        comments: state.comments.filter(c => c.$id !== id),
        isLoading: false,
        error: null,
      }));

      toast.success('Comment deleted successfully!');
    } catch (error) {
      const handledError = handleError(error, 'delete comment');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  fetchComments: async (catchId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        [
          Query.equal('catchId', catchId),
          Query.orderDesc('$createdAt'),
        ]
      );

      set({ 
        comments: response.documents as Comment[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch comments');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },
}));