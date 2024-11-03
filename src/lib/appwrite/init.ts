import { Client } from 'appwrite';
import { ENDPOINTS } from './config';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINTS.API)
  .setProject(ENDPOINTS.PROJECT);

export const initializeServices = () => services.initialize();

export { client };