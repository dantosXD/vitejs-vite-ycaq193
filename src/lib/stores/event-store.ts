import { create } from 'zustand';
import { ID, AppwriteException, Query } from 'appwrite';
import { databases, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/lib/types';

interface EventState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  createEvent: (eventData: Omit<CalendarEvent, '$id'>) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchUserEvents: (userId: string) => Promise<void>;
  addParticipant: (eventId: string, userId: string) => Promise<void>;
  removeParticipant: (eventId: string, userId: string) => Promise<void>;
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
        return new Error('Event not found.');
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

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  createEvent: async (eventData) => {
    try {
      set({ isLoading: true, error: null });

      const event = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        ID.unique(),
        {
          ...eventData,
          createdAt: new Date().toISOString(),
        }
      );

      set(state => ({
        events: [event as unknown as CalendarEvent, ...state.events],
        isLoading: false,
        error: null,
      }));

      toast.success('Event created successfully!');
    } catch (error) {
      const handledError = handleError(error, 'create event');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      set({ isLoading: true, error: null });

      const updatedEvent = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        id,
        {
          ...eventData,
          updatedAt: new Date().toISOString(),
        }
      );

      set(state => ({
        events: state.events.map(e => e.$id === id ? updatedEvent as unknown as CalendarEvent : e),
        isLoading: false,
        error: null,
      }));

      toast.success('Event updated successfully!');
    } catch (error) {
      const handledError = handleError(error, 'update event');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  deleteEvent: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, id);

      set(state => ({
        events: state.events.filter(e => e.$id !== id),
        isLoading: false,
        error: null,
      }));

      toast.success('Event deleted successfully!');
    } catch (error) {
      const handledError = handleError(error, 'delete event');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  fetchEvents: async () => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        [Query.orderDesc('date')]
      );

      set({ 
        events: response.documents as unknown as CalendarEvent[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch events');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().events.length === 0) {
        console.warn('Initial events load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  fetchUserEvents: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      if (!navigator.onLine) {
        return; // Use cached data when offline
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        [
          Query.search('participants', userId),
          Query.orderDesc('date'),
        ]
      );

      set({ 
        events: response.documents as unknown as CalendarEvent[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const handledError = handleError(error, 'fetch user events');
      set({ isLoading: false, error: handledError });
      
      // Don't show error toast for initial load
      if (get().events.length === 0) {
        console.warn('Initial user events load failed:', handledError);
      } else {
        toast.error(handledError.message);
      }
    }
  },

  addParticipant: async (eventId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const event = get().events.find(e => e.$id === eventId);
      if (!event) throw new Error('Event not found');

      const updatedEvent = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId,
        {
          participants: [...event.participants.map(p => p.id), userId],
        }
      );

      set(state => ({
        events: state.events.map(e => e.$id === eventId ? updatedEvent as unknown as CalendarEvent : e),
        isLoading: false,
        error: null,
      }));

      toast.success('Participant added successfully!');
    } catch (error) {
      const handledError = handleError(error, 'add participant');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },

  removeParticipant: async (eventId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const event = get().events.find(e => e.$id === eventId);
      if (!event) throw new Error('Event not found');

      const updatedEvent = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId,
        {
          participants: event.participants.filter(p => p.id !== userId).map(p => p.id),
        }
      );

      set(state => ({
        events: state.events.map(e => e.$id === eventId ? updatedEvent as unknown as CalendarEvent : e),
        isLoading: false,
        error: null,
      }));

      toast.success('Participant removed successfully!');
    } catch (error) {
      const handledError = handleError(error, 'remove participant');
      set({ isLoading: false, error: handledError });
      toast.error(handledError.message);
      throw handledError;
    }
  },
}));