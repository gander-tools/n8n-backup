/**
 * End-to-end integration tests
 * Tests complete workflows combining CLI, PocketBase, and business logic
 *
 * Prerequisites:
 * - Application must be built: `bun run build`
 * - PocketBase running at http://localhost:8090
 * - Admin account: admin@test.local / testpassword123
 *
 * @see tests/TESTING.md for setup instructions
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createPocketBaseClient } from '../../src/services/pocketbase-client.js';
import { getVersionInfo } from '../../src/commands/version.js';
import type { PocketBaseConfig } from '../../src/types/pocketbase.js';

// Test configuration
const testConfig: PocketBaseConfig = {
  url: process.env.POCKETBASE_URL || 'http://localhost:8090',
  adminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@test.local',
  adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123',
};

/**
 * Helper function to wait for PocketBase
 */
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
      // PocketBase not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `PocketBase at ${url} did not become ready after ${maxRetries} retries`,
  );
}

describe('End-to-End Integration Tests', () => {
  beforeAll(async () => {
    console.log('🔄 Setting up end-to-end tests...');
    await waitForPocketBase(testConfig.url, 30);
    console.log('✅ PocketBase is ready');
  });

  afterAll(() => {
    console.log('🧹 End-to-end tests completed');
  });

  describe('Application Initialization', () => {
    test('should initialize application components', () => {
      // Test version command
      const version = getVersionInfo();
      expect(version).toBeDefined();
      expect(version).toContain('@gander-tools/n8n-backup');
      expect(version).toContain('0.1.0');
    });

    test('should create and configure PocketBase client', async () => {
      const client = createPocketBaseClient(testConfig);

      expect(client).toBeDefined();
      expect(client.getClient()).toBeDefined();

      // Test health check
      const health = await client.healthCheck();
      expect(health.code).toBe(200);

      // Test authentication
      const auth = await client.authenticate();
      expect(auth.token).toBeDefined();
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('Service Integration', () => {
    test('should integrate version command with PocketBase client', async () => {
      // Get version info
      const version = getVersionInfo();
      expect(version).toContain('0.1.0');

      // Connect to PocketBase
      const client = createPocketBaseClient(testConfig);
      await client.authenticate();

      // Both should work together
      expect(client.isAuthenticated()).toBe(true);
      expect(version).toBeDefined();
    });

    test('should handle complete workflow: connect, authenticate, query', async () => {
      // Step 1: Create client
      const client = createPocketBaseClient(testConfig);

      // Step 2: Health check
      const health = await client.healthCheck();
      expect(health.code).toBe(200);

      // Step 3: Authenticate
      const auth = await client.authenticate();
      expect(auth.token).toBeDefined();

      // Step 4: Query collections
      const collections = await client.listCollections();
      expect(Array.isArray(collections)).toBe(true);

      // Step 5: Cleanup
      client.logout();
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from authentication failure', async () => {
      // Try with invalid credentials
      const invalidClient = createPocketBaseClient({
        ...testConfig,
        adminPassword: 'wrongpassword',
      });

      await expect(invalidClient.authenticate()).rejects.toThrow();

      // Should still work with correct credentials
      const validClient = createPocketBaseClient(testConfig);
      const auth = await validClient.authenticate();
      expect(auth.token).toBeDefined();
    });

    test('should handle PocketBase unavailable scenario', async () => {
      const unreachableClient = createPocketBaseClient({
        ...testConfig,
        url: 'http://localhost:9999',
      });

      await expect(unreachableClient.healthCheck()).rejects.toThrow(
        'PocketBase health check failed',
      );
    });
  });

  describe('Data Consistency', () => {
    test('should maintain consistency across operations', async () => {
      const client = createPocketBaseClient(testConfig);
      await client.authenticate();

      // Get initial collections count
      const initialCollections = await client.listCollections();
      const initialCount = initialCollections.length;

      // List again - should be the same
      const secondCollections = await client.listCollections();
      expect(secondCollections.length).toBe(initialCount);

      // Verify authentication persists
      expect(client.isAuthenticated()).toBe(true);

      // Token should remain the same
      const token1 = client.getToken();
      const token2 = client.getToken();
      expect(token1).toBe(token2);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent health checks', async () => {
      const client = createPocketBaseClient(testConfig);

      const healthChecks = await Promise.all([
        client.healthCheck(),
        client.healthCheck(),
        client.healthCheck(),
      ]);

      for (const health of healthChecks) {
        expect(health.code).toBe(200);
      }
    });

    test('should handle concurrent authentication attempts', async () => {
      const client1 = createPocketBaseClient(testConfig);
      const client2 = createPocketBaseClient(testConfig);
      const client3 = createPocketBaseClient(testConfig);

      const auths = await Promise.all([
        client1.authenticate(),
        client2.authenticate(),
        client3.authenticate(),
      ]);

      for (const auth of auths) {
        expect(auth.token).toBeDefined();
      }

      expect(client1.isAuthenticated()).toBe(true);
      expect(client2.isAuthenticated()).toBe(true);
      expect(client3.isAuthenticated()).toBe(true);
    });
  });

  describe('Resource Management', () => {
    test('should properly cleanup resources', async () => {
      const client = createPocketBaseClient(testConfig);
      await client.authenticate();

      expect(client.isAuthenticated()).toBe(true);

      // Logout should clear all auth state
      client.logout();

      expect(client.isAuthenticated()).toBe(false);
      expect(client.getToken()).toBe('');
    });

    test('should allow re-authentication after logout', async () => {
      const client = createPocketBaseClient(testConfig);

      // First auth
      await client.authenticate();
      expect(client.isAuthenticated()).toBe(true);

      // Logout
      client.logout();
      expect(client.isAuthenticated()).toBe(false);

      // Re-authenticate
      await client.authenticate();
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('Multiple Clients', () => {
    test('should support multiple independent clients', async () => {
      const client1 = createPocketBaseClient(testConfig);
      const client2 = createPocketBaseClient(testConfig);

      await client1.authenticate();
      await client2.authenticate();

      expect(client1.isAuthenticated()).toBe(true);
      expect(client2.isAuthenticated()).toBe(true);

      // Logout one should not affect the other
      client1.logout();

      expect(client1.isAuthenticated()).toBe(false);
      expect(client2.isAuthenticated()).toBe(true);

      // Both should be able to authenticate independently
      await client1.authenticate();

      expect(client1.isAuthenticated()).toBe(true);
      expect(client2.isAuthenticated()).toBe(true);
    });
  });

  describe('Version Information', () => {
    test('should provide consistent version across calls', () => {
      const version1 = getVersionInfo();
      const version2 = getVersionInfo();

      expect(version1).toBe(version2);
      expect(version1).toContain('0.1.0');
    });
  });

  describe('Complete Application Workflow', () => {
    test('should execute typical user workflow', async () => {
      // 1. User starts application - check version
      const version = getVersionInfo();
      expect(version).toContain('n8n-backup');

      // 2. User connects to PocketBase
      const client = createPocketBaseClient(testConfig);

      // 3. Check if PocketBase is healthy
      const health = await client.healthCheck();
      expect(health.code).toBe(200);

      // 4. Authenticate
      const auth = await client.authenticate();
      expect(auth.token).toBeDefined();
      expect(auth.admin.email).toBe(testConfig.adminEmail);

      // 5. Check authentication status
      expect(client.isAuthenticated()).toBe(true);

      // 6. Perform operations - list collections
      const collections = await client.listCollections();
      expect(Array.isArray(collections)).toBe(true);

      // 7. Get token for future requests
      const token = client.getToken();
      expect(token).toBeTruthy();

      // 8. User exits - cleanup
      client.logout();
      expect(client.isAuthenticated()).toBe(false);
    });
  });
});
