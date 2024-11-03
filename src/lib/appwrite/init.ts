import { Client } from 'appwrite';
import { ENDPOINTS } from './config';

// Create a singleton client instance
let client: Client | null = null;

export function getClient(): Client {
  if (!client) {
    try {
      if (!ENDPOINTS.API || !ENDPOINTS.PROJECT) {
        throw new Error('Missing required Appwrite configuration');
      }
      client = new Client()
        .setEndpoint(ENDPOINTS.API)
        .setProject(ENDPOINTS.PROJECT);
    } catch (error) {
      console.error('Failed to create Appwrite client:', error);
      throw error;
    }
  }
  return client;
}

export function resetClient(): void {
  client = null;
}

// Export client for immediate use cases
export const defaultClient = getClient();