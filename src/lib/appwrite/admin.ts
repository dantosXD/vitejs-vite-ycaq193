import { Client } from 'appwrite';
import { ENDPOINTS } from './config';

const adminClient = new Client()
  .setEndpoint(ENDPOINTS.API)
  .setProject(ENDPOINTS.PROJECT);

if (ENDPOINTS.API_KEY) {
  adminClient.setKey(ENDPOINTS.API_KEY);
}

export { adminClient };