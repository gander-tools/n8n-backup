/**
 * Integration tests for PocketBase client CRUD operations
 * Tests create, read, update, delete operations with a real PocketBase instance
 *
 * Prerequisites:
 * - PocketBase running at http://localhost:8090
 * - Admin account: admin@test.local / testpassword123
 *
 * @see tests/TESTING.md for setup instructions
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  PocketBaseClient,
  createPocketBaseClient,
} from '../../src/services/pocketbase-client.js';
import type { PocketBaseConfig } from '../../src/types/pocketbase.js';

// Test configuration
const testConfig: PocketBaseConfig = {
  url: process.env.POCKETBASE_URL || 'http://localhost:8090',
  adminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@test.local',
  adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123',
};

// Test collection name
const TEST_COLLECTION = 'test_records';

// Helper function to wait for PocketBase
async function waitForPocketBase(url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return;
      }
    } catch (error) {
      // PocketBase not ready yet, continue waiting
    }

    // Wait 1 second before next retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `PocketBase at ${url} did not become ready after ${maxRetries} retries`,
  );
}

// Helper function to create a test collection
async function createTestCollection(client: PocketBaseClient): Promise<void> {
  const pb = client.getClient();

  try {
    // Try to delete existing test collection
    const collections = await pb.collections.getFullList();
    const existingCollection = collections.find(
      (c) => c.name === TEST_COLLECTION,
    );

    if (existingCollection) {
      await pb.collections.delete(existingCollection.id);
    }
  } catch (error) {
    // Collection doesn't exist, which is fine
  }

  // Create test collection with schema
  await pb.collections.create({
    name: TEST_COLLECTION,
    type: 'base',
    schema: [
      {
        name: 'title',
        type: 'text',
        required: true,
      },
      {
        name: 'description',
        type: 'text',
        required: false,
      },
      {
        name: 'count',
        type: 'number',
        required: false,
      },
      {
        name: 'active',
        type: 'bool',
        required: false,
      },
    ],
  });
}

// Helper function to cleanup test collection
async function cleanupTestCollection(client: PocketBaseClient): Promise<void> {
  const pb = client.getClient();

  try {
    const collections = await pb.collections.getFullList();
    const testCollection = collections.find((c) => c.name === TEST_COLLECTION);

    if (testCollection) {
      await pb.collections.delete(testCollection.id);
    }
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Failed to cleanup test collection:', error);
  }
}

describe('PocketBaseClient - CRUD Operations Integration Tests', () => {
  let client: PocketBaseClient;

  beforeAll(async () => {
    console.log('🔄 Setting up CRUD integration tests...');

    // Wait for PocketBase to be ready
    await waitForPocketBase(testConfig.url, 30);
    console.log('✅ PocketBase is ready');

    // Create client and authenticate
    client = createPocketBaseClient(testConfig);
    await client.authenticate();
    console.log('✅ Authenticated with PocketBase');

    // Create test collection
    await createTestCollection(client);
    console.log('✅ Test collection created');
  });

  afterAll(async () => {
    // Cleanup test collection
    await cleanupTestCollection(client);
    console.log('🧹 Test collection cleaned up');
  });

  describe('Factory Function', () => {
    test('should create PocketBaseClient using factory function', () => {
      const factoryClient = createPocketBaseClient(testConfig);

      expect(factoryClient).toBeInstanceOf(PocketBaseClient);
      expect(factoryClient.getClient()).toBeDefined();
    });
  });

  describe('Health Check', () => {
    test('should perform successful health check', async () => {
      const health = await client.healthCheck();

      expect(health).toBeDefined();
      expect(health.code).toBe(200);
      expect(health.message).toBe('OK');
    });

    test('should handle health check failure for invalid URL', async () => {
      const invalidClient = createPocketBaseClient({
        ...testConfig,
        url: 'http://localhost:9999',
      });

      await expect(invalidClient.healthCheck()).rejects.toThrow(
        'PocketBase health check failed',
      );
    });
  });

  describe('Authentication', () => {
    test('should authenticate successfully', async () => {
      const newClient = createPocketBaseClient(testConfig);
      const authResponse = await newClient.authenticate();

      expect(authResponse).toBeDefined();
      expect(authResponse.token).toBeDefined();
      expect(typeof authResponse.token).toBe('string');
      expect(authResponse.token.length).toBeGreaterThan(0);
      expect(authResponse.admin).toBeDefined();
      expect(authResponse.admin.email).toBe(testConfig.adminEmail);
      expect(authResponse.admin.id).toBeDefined();
      expect(authResponse.admin.created).toBeDefined();
      expect(authResponse.admin.updated).toBeDefined();
    });

    test('should track authentication state', async () => {
      const newClient = createPocketBaseClient(testConfig);

      expect(newClient.isAuthenticated()).toBe(false);

      await newClient.authenticate();

      expect(newClient.isAuthenticated()).toBe(true);
      expect(newClient.getToken()).toBeTruthy();
    });

    test('should logout successfully', async () => {
      const newClient = createPocketBaseClient(testConfig);
      await newClient.authenticate();

      expect(newClient.isAuthenticated()).toBe(true);

      newClient.logout();

      expect(newClient.isAuthenticated()).toBe(false);
      expect(newClient.getToken()).toBe('');
    });

    test('should reject invalid credentials', async () => {
      const invalidClient = createPocketBaseClient({
        ...testConfig,
        adminPassword: 'wrongpassword',
      });

      await expect(invalidClient.authenticate()).rejects.toThrow(
        'PocketBase authentication failed',
      );
    });
  });

  describe('Create Record', () => {
    test('should create a new record', async () => {
      interface TestRecord {
        title: string;
        description: string;
        count: number;
        active: boolean;
      }

      const newRecord: TestRecord = {
        title: 'Test Record 1',
        description: 'This is a test record',
        count: 42,
        active: true,
      };

      const created = await client.createRecord<TestRecord>(
        TEST_COLLECTION,
        newRecord,
      );

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.created).toBeDefined();
      expect(created.updated).toBeDefined();
      expect(created.title).toBe(newRecord.title);
      expect(created.description).toBe(newRecord.description);
      expect(created.count).toBe(newRecord.count);
      expect(created.active).toBe(newRecord.active);
    });

    test('should require authentication for creating records', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(
        unauthClient.createRecord(TEST_COLLECTION, { title: 'Test' }),
      ).rejects.toThrow('Not authenticated');
    });

    test('should validate required fields', async () => {
      // Missing required 'title' field
      await expect(
        client.createRecord(TEST_COLLECTION, {
          description: 'Missing title',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Read Record', () => {
    let testRecordId: string;

    beforeAll(async () => {
      // Create a test record for reading
      const created = await client.createRecord(TEST_COLLECTION, {
        title: 'Read Test Record',
        description: 'For testing read operations',
        count: 100,
      });
      testRecordId = created.id;
    });

    test('should get a record by ID', async () => {
      interface TestRecord {
        title: string;
        description: string;
        count: number;
      }

      const record = await client.getRecord<TestRecord>(
        TEST_COLLECTION,
        testRecordId,
      );

      expect(record).toBeDefined();
      expect(record.id).toBe(testRecordId);
      expect(record.title).toBe('Read Test Record');
      expect(record.description).toBe('For testing read operations');
      expect(record.count).toBe(100);
    });

    test('should require authentication for reading records', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(
        unauthClient.getRecord(TEST_COLLECTION, testRecordId),
      ).rejects.toThrow('Not authenticated');
    });

    test('should handle non-existent record', async () => {
      const fakeId = 'nonexistent123';

      await expect(
        client.getRecord(TEST_COLLECTION, fakeId),
      ).rejects.toThrow();
    });
  });

  describe('List Records', () => {
    beforeAll(async () => {
      // Create multiple test records
      await client.createRecord(TEST_COLLECTION, {
        title: 'List Record 1',
        count: 1,
      });
      await client.createRecord(TEST_COLLECTION, {
        title: 'List Record 2',
        count: 2,
      });
      await client.createRecord(TEST_COLLECTION, {
        title: 'List Record 3',
        count: 3,
      });
    });

    test('should list all records in a collection', async () => {
      interface TestRecord {
        title: string;
        count: number;
      }

      const records = await client.listRecords<TestRecord>(TEST_COLLECTION);

      expect(records).toBeDefined();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(3);

      // Verify all records have required fields
      for (const record of records) {
        expect(record.id).toBeDefined();
        expect(record.created).toBeDefined();
        expect(record.updated).toBeDefined();
        expect(record.title).toBeDefined();
      }
    });

    test('should require authentication for listing records', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(
        unauthClient.listRecords(TEST_COLLECTION),
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Update Record', () => {
    let updateRecordId: string;

    beforeAll(async () => {
      const created = await client.createRecord(TEST_COLLECTION, {
        title: 'Original Title',
        description: 'Original Description',
        count: 50,
        active: false,
      });
      updateRecordId = created.id;
    });

    test('should update a record', async () => {
      interface TestRecord {
        title: string;
        description: string;
        count: number;
        active: boolean;
      }

      const updates = {
        title: 'Updated Title',
        count: 75,
        active: true,
      };

      const updated = await client.updateRecord<TestRecord>(
        TEST_COLLECTION,
        updateRecordId,
        updates,
      );

      expect(updated).toBeDefined();
      expect(updated.id).toBe(updateRecordId);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Original Description'); // Unchanged
      expect(updated.count).toBe(75);
      expect(updated.active).toBe(true);
    });

    test('should support partial updates', async () => {
      interface TestRecord {
        count: number;
      }

      const partialUpdate = {
        count: 99,
      };

      const updated = await client.updateRecord<TestRecord>(
        TEST_COLLECTION,
        updateRecordId,
        partialUpdate,
      );

      expect(updated.count).toBe(99);
      // Other fields should remain unchanged
      expect(updated.title).toBe('Updated Title');
    });

    test('should require authentication for updating records', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(
        unauthClient.updateRecord(TEST_COLLECTION, updateRecordId, {
          title: 'Should Fail',
        }),
      ).rejects.toThrow('Not authenticated');
    });

    test('should handle update of non-existent record', async () => {
      const fakeId = 'nonexistent456';

      await expect(
        client.updateRecord(TEST_COLLECTION, fakeId, { title: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('Delete Record', () => {
    test('should delete a record', async () => {
      // Create a record to delete
      const created = await client.createRecord(TEST_COLLECTION, {
        title: 'To Be Deleted',
      });

      // Delete the record
      await client.deleteRecord(TEST_COLLECTION, created.id);

      // Verify it's deleted
      await expect(
        client.getRecord(TEST_COLLECTION, created.id),
      ).rejects.toThrow();
    });

    test('should require authentication for deleting records', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(
        unauthClient.deleteRecord(TEST_COLLECTION, 'someid'),
      ).rejects.toThrow('Not authenticated');
    });

    test('should handle deletion of non-existent record', async () => {
      const fakeId = 'nonexistent789';

      await expect(
        client.deleteRecord(TEST_COLLECTION, fakeId),
      ).rejects.toThrow();
    });
  });

  describe('List Collections', () => {
    test('should list all collections', async () => {
      const collections = await client.listCollections();

      expect(collections).toBeDefined();
      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeGreaterThan(0);

      // Verify test collection exists
      const testCollection = collections.find(
        (c) => c.name === TEST_COLLECTION,
      );
      expect(testCollection).toBeDefined();
    });

    test('should require authentication for listing collections', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      await expect(unauthClient.listCollections()).rejects.toThrow(
        'Not authenticated',
      );
    });
  });

  describe('Complete CRUD Workflow', () => {
    test('should complete full CRUD cycle', async () => {
      interface TestRecord {
        title: string;
        description: string;
        count: number;
        active: boolean;
      }

      // CREATE
      const newRecord: TestRecord = {
        title: 'CRUD Cycle Test',
        description: 'Testing full CRUD workflow',
        count: 1,
        active: true,
      };

      const created = await client.createRecord<TestRecord>(
        TEST_COLLECTION,
        newRecord,
      );
      expect(created.id).toBeDefined();
      expect(created.title).toBe(newRecord.title);

      const recordId = created.id;

      // READ
      const read = await client.getRecord<TestRecord>(TEST_COLLECTION, recordId);
      expect(read.id).toBe(recordId);
      expect(read.count).toBe(1);

      // UPDATE
      const updated = await client.updateRecord<TestRecord>(
        TEST_COLLECTION,
        recordId,
        {
          count: 2,
          active: false,
        },
      );
      expect(updated.count).toBe(2);
      expect(updated.active).toBe(false);
      expect(updated.title).toBe(newRecord.title); // Unchanged

      // LIST (verify it exists)
      const list = await client.listRecords<TestRecord>(TEST_COLLECTION);
      const found = list.find((r) => r.id === recordId);
      expect(found).toBeDefined();
      expect(found?.count).toBe(2);

      // DELETE
      await client.deleteRecord(TEST_COLLECTION, recordId);

      // VERIFY DELETION
      await expect(
        client.getRecord(TEST_COLLECTION, recordId),
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should provide meaningful error messages for failed operations', async () => {
      const unauthClient = createPocketBaseClient(testConfig);

      // Test each operation without authentication
      await expect(unauthClient.listCollections()).rejects.toThrow(
        'Not authenticated',
      );
      await expect(
        unauthClient.createRecord(TEST_COLLECTION, {}),
      ).rejects.toThrow('Not authenticated');
      await expect(
        unauthClient.getRecord(TEST_COLLECTION, 'id'),
      ).rejects.toThrow('Not authenticated');
      await expect(
        unauthClient.listRecords(TEST_COLLECTION),
      ).rejects.toThrow('Not authenticated');
      await expect(
        unauthClient.updateRecord(TEST_COLLECTION, 'id', {}),
      ).rejects.toThrow('Not authenticated');
      await expect(
        unauthClient.deleteRecord(TEST_COLLECTION, 'id'),
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Client Access', () => {
    test('should provide access to underlying PocketBase client', () => {
      const pb = client.getClient();

      expect(pb).toBeDefined();
      expect(pb.authStore).toBeDefined();
      expect(pb.collections).toBeDefined();
    });
  });
});
