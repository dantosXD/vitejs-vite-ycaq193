import { Account, Databases, Storage, Functions, Avatars, ID, AppwriteException } from 'appwrite';
import { getClient, resetClient } from './client';
import { DATABASE_ID, COLLECTIONS, BUCKETS } from './config';

class AppwriteServices {
  private static instance: AppwriteServices | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  public readonly account: Account;
  public readonly databases: Databases;
  public readonly storage: Storage;
  public readonly functions: Functions;
  public readonly avatars: Avatars;

  private constructor() {
    try {
      const client = getClient();
      this.account = new Account(client);
      this.databases = new Databases(client);
      this.storage = new Storage(client);
      this.functions = new Functions(client);
      this.avatars = new Avatars(client);
    } catch (error) {
      console.error('Failed to initialize Appwrite services:', error);
      throw error;
    }
  }

  public static getInstance(): AppwriteServices {
    if (!AppwriteServices.instance) {
      try {
        AppwriteServices.instance = new AppwriteServices();
      } catch (error) {
        console.error('Failed to create AppwriteServices instance:', error);
        throw error;
      }
    }
    return AppwriteServices.instance;
  }

  private async validateServices(): Promise<void> {
    try {
      // Basic connectivity check
      await this.account.getSession('current').catch(error => {
        if (error instanceof AppwriteException && error.code !== 401) {
          throw error;
        }
      });

      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to validate Appwrite services: ${message}`);
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        await this.validateServices();
        console.log('Appwrite services initialized successfully');
      } catch (error) {
        this.initializationError = error instanceof Error 
          ? error 
          : new Error('Failed to initialize Appwrite services');
        throw this.initializationError;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public static reset(): void {
    AppwriteServices.instance = null;
    resetClient();
  }
}

const services = AppwriteServices.getInstance();

export const account = services.account;
export const databases = services.databases;
export const storage = services.storage;
export const functions = services.functions;
export const avatars = services.avatars;

export { ID, DATABASE_ID, COLLECTIONS, BUCKETS };

export const initializeServices = () => services.initialize();
export const isServicesInitialized = () => services.isInitialized();
export const resetServices = () => AppwriteServices.reset();
export const isInitialized = () => services.isInitialized();