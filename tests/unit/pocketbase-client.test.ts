/**
 * Unit tests for PocketBase client
 * Tests individual methods in isolation without external dependencies
 *
 * @see tests/README.md for TDD methodology
 */

import { describe, expect, test } from 'bun:test';
import { PocketBaseClient, createPocketBaseClient } from '../../src/services/pocketbase-client.js';
import type { PocketBaseConfig } from '../../src/types/pocketbase.js';

describe('PocketBaseClient - Unit Tests', () => {
  const mockConfig: PocketBaseConfig = {
    url: 'http://localhost:8090',
    adminEmail: 'admin@test.local',
    adminPassword: 'testpassword',
  };

  describe('Constructor', () => {
    test('should create instance with valid config', () => {
      const client = new PocketBaseClient(mockConfig);

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(PocketBaseClient);
    });

    test('should initialize with not authenticated state', () => {
      const client = new PocketBaseClient(mockConfig);

      expect(client.isAuthenticated()).toBe(false);
      expect(client.getToken()).toBe('');
    });
  });

  describe('Factory Function', () => {
    test('should create client via factory function', () => {
      const client = createPocketBaseClient(mockConfig);

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(PocketBaseClient);
    });
  });

  describe('Client Access', () => {
    test('should provide access to underlying PocketBase client', () => {
      const client = new PocketBaseClient(mockConfig);
      const pbClient = client.getClient();

      expect(pbClient).toBeDefined();
      expect(pbClient.authStore).toBeDefined();
    });
  });

  describe('Authentication State', () => {
    test('should track authentication state', () => {
      const client = new PocketBaseClient(mockConfig);

      // Initially not authenticated
      expect(client.isAuthenticated()).toBe(false);

      // Token should be empty
      expect(client.getToken()).toBe('');
    });

    test('should clear authentication on logout', () => {
      const client = new PocketBaseClient(mockConfig);

      // Logout should not throw even when not authenticated
      expect(() => client.logout()).not.toThrow();

      // Should still be not authenticated
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Protected Methods - Error Handling', () => {
    test('should throw error when listing collections without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.listCollections()).rejects.toThrow('Not authenticated');
    });

    test('should throw error when creating record without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.createRecord('test', { data: 'value' })).rejects.toThrow(
        'Not authenticated',
      );
    });

    test('should throw error when getting record without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.getRecord('test', '123')).rejects.toThrow('Not authenticated');
    });

    test('should throw error when listing records without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.listRecords('test')).rejects.toThrow('Not authenticated');
    });

    test('should throw error when updating record without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.updateRecord('test', '123', { data: 'value' })).rejects.toThrow(
        'Not authenticated',
      );
    });

    test('should throw error when deleting record without authentication', async () => {
      const client = new PocketBaseClient(mockConfig);

      await expect(client.deleteRecord('test', '123')).rejects.toThrow('Not authenticated');
    });
  });
});
