import { Client, Account, Databases, Storage, Functions, Avatars, ID } from 'appwrite';
import { ENDPOINTS } from './constants';

class AppwriteServices {
  private static instance: AppwriteServices | null = null;
  private initializationAttempted = false; // Track if initialization has been attempted

  public readonly client: Client;
  public readonly account: Account;
  public readonly databases: Databases;
  public readonly storage: Storage;
  public readonly functions: Functions;
  public readonly avatars: Avatars;

  private constructor() {
    // Initialize the client
    this.client = new Client()
      .setEndpoint(ENDPOINTS.API)
      .setProject(ENDPOINTS.PROJECT);

    // Initialize services
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.functions = new Functions(this.client);
    this.avatars = new Avatars(this.client);
  }

  public static getInstance(): AppwriteServices {
    if (!AppwriteServices.instance) {
      AppwriteServices.instance = new AppwriteServices();
    }
    return AppwriteServices.instance;
  }

  // Auth methods following Appwrite's documentation
  public async createEmailSession(email: string, password: string) {
    return this.account.createSession(email, password); // Corrected method name
  }

  public async createAccount(email: string, password: string, name: string) {
    return this.account.create(
      ID.unique(),
      email,
      password,
      name
    );
  }

  public async getAccount() {
    try {
      return await this.account.get();
    } catch (error) {
      console.error('Failed to get account:', error);
      throw error;
    }
  }

  public async deleteSession(sessionId: string) {
    return this.account.deleteSession(sessionId);
  }

  public async getSession(sessionId: string) {
    return this.account.getSession(sessionId);
  }

  public async createVerification(url: string) {
    return this.account.createVerification(url);
  }

  public async getPrefs() {
    return this.account.getPrefs();
  }

  public async updatePrefs(prefs: object) {
    return this.account.updatePrefs(prefs);
  }

  public initialize(): Promise<void> { // Placeholder for future async initialization
    this.initializationAttempted = true;
    return Promise.resolve();
  }

  public isInitialized(): boolean {
    return this.initializationAttempted;
  }

  public static reset(): void {
    AppwriteServices.instance = null;
  }
}

const services = AppwriteServices.getInstance();

export const appwrite = services;
export const account = services.account;
export const databases = services.databases;
export const storage = services.storage;
export const functions = services.functions;
export const avatars = services.avatars;

export const initializeServices = () => services.initialize();
export const isServicesInitialized = () => services.isInitialized();
export const isInitialized = () => services.isInitialized();
export const resetServices = () => AppwriteServices.reset();
