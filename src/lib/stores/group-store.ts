import { create } from 'zustand';
import { ID, AppwriteException, Query } from 'appwrite';
import { databases, storage, COLLECTIONS, DATABASE_ID, BUCKETS } from '@/lib/appwrite';
import { toast } from 'sonner';
import type { Group } from '@/lib/types';

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: Error | null;
  createGroup: (groupData: Omit<Group, '$id'>, avatar?: File) => Promise<void>;
  updateGroup: (id: string, groupData: Partial<Group>, newAvatar?: File) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchUserGroups: (userId: string) => Promise<void>;
  addMember: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
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
        return new Error('Group not found.');
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

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  createGroup: async (groupData, avatar) => {
    try {
      set({ isLoading: true, error: null });

      let avatarId = null;
      if (avatar) {
        const uploadedAvatar = await storage.createFile(
          BUCKETS.GROUP_AVATARS,
          ID.unique(),
          avatar
        );
        avatarId = uploadedAvatar.$id;
      }

      const group = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        ID.unique(),
        {
          ...groupData,
          avatar: avatarId,
          createdAt: new Date().toISOString(),
        }
      );

      set(state => ({
        groups: [group as unknown as Group, ...state.groups],
        isLoading: false,
        error: null,
      }));

      toast.success('Group created successfully!');
    } catch (error) {
      const handledError = handleError(error, 'create group');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  updateGroup: async (id, groupData, newAvatar) => {
    try {
      set({ isLoading: true, error: null });

      let avatarId = groupData.avatar;
      if (newAvatar) {
        if (avatarId) {
          await storage.deleteFile(BUCKETS.GROUP_AVATARS, avatarId);
        }
        const uploadedAvatar = await storage.createFile(
          BUCKETS.GROUP_AVATARS,
          ID.unique(),
          newAvatar
        );
        avatarId = uploadedAvatar.$id;
      }

      const updatedGroup = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        id,
        {
          ...groupData,
          avatar: avatarId,
          updatedAt: new Date().toISOString(),
        }
      );

      set(state => ({
        groups: state.groups.map(g => g.$id === id ? updatedGroup as unknown as Group : g),
        isLoading: false,
        error: null,
      }));

      toast.success('Group updated successfully!');
    } catch (error) {
      const handledError = handleError(error, 'update group');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  deleteGroup: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const group = get().groups.find(g => g.$id === id);
      
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.GROUPS, id);

      if (group?.avatar) {
        await storage.deleteFile(BUCKETS.GROUP_AVATARS, group.avatar);
      }

      set(state => ({
        groups: state.groups.filter(g => g.$id !== id),
        isLoading: false,
        error: null,
      }));

      toast.success('Group deleted successfully!');
    } catch (error) {
      const handledError = handleError(error, 'delete group');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  fetchGroups: async () => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        [Query.orderDesc('$createdAt')]
      );

      set({ 
        groups: response.documents as unknown as Group[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch groups');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().groups.length === 0) {
        console.warn('Initial groups load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  fetchUserGroups: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        [
          Query.search('members', userId),
          Query.orderDesc('$createdAt'),
        ]
      );

      set({ 
        groups: response.documents as unknown as Group[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch user groups');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().groups.length === 0) {
        console.warn('Initial user groups load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  addMember: async (groupId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const group = get().groups.find(g => g.$id === groupId);
      if (!group) throw new Error('Group not found');

      const updatedGroup = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        groupId,
        {
          members: [...group.members.map(m => m.id), userId],
        }
      );

      set(state => ({
        groups: state.groups.map(g => g.$id === groupId ? updatedGroup as unknown as Group : g),
        isLoading: false,
        error: null,
      }));

      toast.success('Member added successfully!');
    } catch (error) {
      const handledError = handleError(error, 'add member');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const group = get().groups.find(g => g.$id === groupId);
      if (!group) throw new Error('Group not found');

      const updatedGroup = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.GROUPS,
        groupId,
        {
          members: group.members.filter(m => m.id !== userId).map(m => m.id),
          admins: group.admins.filter(id => id !== userId),
        }
      );

      set(state => ({
        groups: state.groups.map(g => g.$id === groupId ? updatedGroup as unknown as Group : g),
        isLoading: false,
        error: null,
      }));

      toast.success('Member removed successfully!');
    } catch (error) {
      const handledError = handleError(error, 'remove member');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },
}));