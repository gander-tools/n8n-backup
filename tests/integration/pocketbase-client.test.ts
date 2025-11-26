/**
 * Integration tests for PocketBase client
 * Tests communication with a real PocketBase instance running in Docker
 *
 * Prerequisites:
 * - Run `docker compose -f docker-compose.test.yml up -d pocketbase` before running these tests
 * - PocketBase should be accessible at http://localhost:8090
 *
 * @see tests/README.md for TDD methodology
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { PocketBaseConfig } from '../../src/types/pocketbase.js';

// Test configuration
const testConfig: PocketBaseConfig = {
  url: process.env.POCKETBASE_URL || 'http://localhost:8090',
  adminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@test.local',
  adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123',
};

describe('PocketBase Client - Integration Tests', () => {
  beforeAll(async () => {
    // Wait for PocketBase to be ready
    console.log('🔄 Waiting for PocketBase to be ready...');
    await waitForPocketBase(testConfig.url, 30);
    console.log('✅ PocketBase is ready');
  });

  afterAll(() => {
    console.log('🧹 Integration tests completed');
  });

  describe('Health Check', () => {
    test('should connect to PocketBase and get health status', async () => {
      const response = await fetch(`${testConfig.url}/api/health`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = (await response.json()) as { code?: number };
      expect(data).toBeDefined();
      expect(data.code).toBe(200);
    });

    test('should handle connection to invalid URL', async () => {
      const invalidUrl = 'http://localhost:9999';

      try {
        await fetch(`${invalidUrl}/api/health`, {
          signal: AbortSignal.timeout(2000),
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Authentication', () => {
    test('should authenticate with admin credentials', async () => {
      const response = await fetch(`${testConfig.url}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: testConfig.adminEmail,
          password: testConfig.adminPassword,
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        token: string;
        admin: { email: string };
      };
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(0);
      expect(data.admin).toBeDefined();
      expect(data.admin.email).toBe(testConfig.adminEmail);
    });

    test('should reject invalid credentials', async () => {
      const response = await fetch(`${testConfig.url}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: 'invalid@test.local',
          password: 'wrongpassword',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    test('should reject missing credentials', async () => {
      const response = await fetch(`${testConfig.url}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Collections', () => {
    let authToken: string;

    beforeAll(async () => {
      // Authenticate to get token for collection operations
      const response = await fetch(`${testConfig.url}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: testConfig.adminEmail,
          password: testConfig.adminPassword,
        }),
      });

      const data = (await response.json()) as { token: string };
      authToken = data.token;
    });

    test('should list collections with authentication', async () => {
      const response = await fetch(`${testConfig.url}/api/collections`, {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should reject listing collections without authentication', async () => {
      const response = await fetch(`${testConfig.url}/api/collections`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });
});

/**
 * Helper function to wait for PocketBase to be ready
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
      // PocketBase not ready yet, continue waiting
    }

    // Wait 1 second before next retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`PocketBase at ${url} did not become ready after ${maxRetries} retries`);
}
