/**
 * PocketBase client service for n8n-backup
 * Handles all communication with PocketBase backend
 *
 * @see https://pocketbase.io/docs/
 */

import PocketBase from 'pocketbase';
import type {
  PocketBaseAuthResponse,
  PocketBaseConfig,
  PocketBaseHealthResponse,
  PocketBaseRecord,
} from '../types/pocketbase.js';

/**
 * PocketBase client wrapper for n8n-backup
 * Provides type-safe access to PocketBase backend
 */
export class PocketBaseClient {
  private client: PocketBase;
  private config: PocketBaseConfig;

  /**
   * Creates a new PocketBase client instance
   * @param config - PocketBase configuration
   */
  constructor(config: PocketBaseConfig) {
    this.config = config;
    this.client = new PocketBase(config.url);
  }

  /**
   * Checks if PocketBase server is healthy
   * @returns Health check response
   * @throws Error if health check fails
   */
  async healthCheck(): Promise<PocketBaseHealthResponse> {
    try {
      const response = await fetch(`${this.config.url}/api/health`);

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        code?: number;
        message?: string;
        data?: Record<string, unknown>;
      };
      return {
        code: data.code || response.status,
        message: data.message || 'OK',
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PocketBase health check failed: ${error.message}`);
      }
      throw new Error('PocketBase health check failed: Unknown error');
    }
  }

  /**
   * Authenticates with PocketBase using admin credentials
   * @returns Authentication response with token and admin data
   * @throws Error if authentication fails
   */
  async authenticate(): Promise<PocketBaseAuthResponse> {
    try {
      const authData = await this.client.admins.authWithPassword(
        this.config.adminEmail,
        this.config.adminPassword,
      );

      // Type assertion needed as PocketBase SDK doesn't export admin auth types properly
      const admin = authData.record as unknown as {
        id: string;
        email: string;
        created: string;
        updated: string;
      };

      return {
        token: authData.token,
        admin: {
          id: admin.id,
          email: admin.email,
          created: admin.created,
          updated: admin.updated,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PocketBase authentication failed: ${error.message}`);
      }
      throw new Error('PocketBase authentication failed: Unknown error');
    }
  }

  /**
   * Checks if client is currently authenticated
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.client.authStore.isValid;
  }

  /**
   * Gets the current authentication token
   * @returns Authentication token or empty string if not authenticated
   */
  getToken(): string {
    return this.client.authStore.token;
  }

  /**
   * Logs out and clears authentication
   */
  logout(): void {
    this.client.authStore.clear();
  }

  /**
   * Lists all collections in PocketBase
   * @returns Array of collection records
   * @throws Error if not authenticated or request fails
   */
  async listCollections(): Promise<PocketBaseRecord[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const collections = await this.client.collections.getFullList();
      return collections as unknown as PocketBaseRecord[];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list collections: ${error.message}`);
      }
      throw new Error('Failed to list collections: Unknown error');
    }
  }

  /**
   * Creates a new record in a collection
   * @param collection - Collection name
   * @param data - Record data
   * @returns Created record
   * @throws Error if not authenticated or creation fails
   */
  async createRecord<T extends Record<string, unknown>>(
    collection: string,
    data: T,
  ): Promise<PocketBaseRecord & T> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const record = await this.client.collection(collection).create(data);
      return record as unknown as PocketBaseRecord & T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create record in ${collection}: ${error.message}`);
      }
      throw new Error(`Failed to create record in ${collection}: Unknown error`);
    }
  }

  /**
   * Gets a record from a collection by ID
   * @param collection - Collection name
   * @param id - Record ID
   * @returns Record data
   * @throws Error if not authenticated or record not found
   */
  async getRecord<T extends Record<string, unknown>>(
    collection: string,
    id: string,
  ): Promise<PocketBaseRecord & T> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const record = await this.client.collection(collection).getOne(id);
      return record as unknown as PocketBaseRecord & T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get record ${id} from ${collection}: ${error.message}`);
      }
      throw new Error(`Failed to get record ${id} from ${collection}: Unknown error`);
    }
  }

  /**
   * Lists all records in a collection
   * @param collection - Collection name
   * @returns Array of records
   * @throws Error if not authenticated or request fails
   */
  async listRecords<T extends Record<string, unknown>>(
    collection: string,
  ): Promise<Array<PocketBaseRecord & T>> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const records = await this.client.collection(collection).getFullList();
      return records as unknown as Array<PocketBaseRecord & T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list records from ${collection}: ${error.message}`);
      }
      throw new Error(`Failed to list records from ${collection}: Unknown error`);
    }
  }

  /**
   * Updates a record in a collection
   * @param collection - Collection name
   * @param id - Record ID
   * @param data - Updated data
   * @returns Updated record
   * @throws Error if not authenticated or update fails
   */
  async updateRecord<T extends Record<string, unknown>>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<PocketBaseRecord & T> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const record = await this.client.collection(collection).update(id, data);
      return record as unknown as PocketBaseRecord & T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update record ${id} in ${collection}: ${error.message}`);
      }
      throw new Error(`Failed to update record ${id} in ${collection}: Unknown error`);
    }
  }

  /**
   * Deletes a record from a collection
   * @param collection - Collection name
   * @param id - Record ID
   * @throws Error if not authenticated or deletion fails
   */
  async deleteRecord(collection: string, id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.client.collection(collection).delete(id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete record ${id} from ${collection}: ${error.message}`);
      }
      throw new Error(`Failed to delete record ${id} from ${collection}: Unknown error`);
    }
  }

  /**
   * Gets the underlying PocketBase client instance
   * For advanced usage when wrapper methods are not sufficient
   * @returns PocketBase client instance
   */
  getClient(): PocketBase {
    return this.client;
  }
}

/**
 * Creates a new PocketBase client instance
 * @param config - PocketBase configuration
 * @returns PocketBase client instance
 */
export function createPocketBaseClient(config: PocketBaseConfig): PocketBaseClient {
  return new PocketBaseClient(config);
}
