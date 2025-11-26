/**
 * Test helpers and utilities for integration tests
 * Shared functions used across multiple integration test files
 *
 * @module tests/integration/helpers
 */

import type { PocketBaseClient } from '../../src/services/pocketbase-client.js';

/**
 * Wait for PocketBase to be ready
 * Retries health check until successful or max retries reached
 *
 * @param url - PocketBase URL
 * @param maxRetries - Maximum number of retries (default: 30)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @throws Error if PocketBase doesn't become ready
 */
export async function waitForPocketBase(
	url: string,
	maxRetries = 30,
	retryDelay = 1000,
): Promise<void> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const response = await fetch(`${url}/api/health`, {
				signal: AbortSignal.timeout(2000),
			});

			if (response.ok) {
				const data = (await response.json()) as { code?: number };
				if (data.code === 200) {
					return;
				}
			}
		} catch (error) {
			// PocketBase not ready yet, continue waiting
		}

		// Wait before next retry
		await new Promise((resolve) => setTimeout(resolve, retryDelay));
	}

	throw new Error(
		`PocketBase at ${url} did not become ready after ${maxRetries} retries`,
	);
}

/**
 * Create a test collection in PocketBase
 * Deletes existing collection with same name if it exists
 *
 * @param client - Authenticated PocketBase client
 * @param collectionName - Name of the collection to create
 * @param schema - Collection schema definition
 */
export async function createTestCollection(
	client: PocketBaseClient,
	collectionName: string,
	schema: Array<{
		name: string;
		type: string;
		required?: boolean;
		options?: Record<string, unknown>;
	}>,
): Promise<void> {
	const pb = client.getClient();

	try {
		// Try to delete existing test collection
		const collections = await pb.collections.getFullList();
		const existingCollection = collections.find(
			(c) => c.name === collectionName,
		);

		if (existingCollection) {
			await pb.collections.delete(existingCollection.id);
		}
	} catch (error) {
		// Collection doesn't exist, which is fine
	}

	// Create test collection with schema
	await pb.collections.create({
		name: collectionName,
		type: 'base',
		schema,
	});
}

/**
 * Delete a test collection from PocketBase
 * Silently fails if collection doesn't exist
 *
 * @param client - Authenticated PocketBase client
 * @param collectionName - Name of the collection to delete
 */
export async function deleteTestCollection(
	client: PocketBaseClient,
	collectionName: string,
): Promise<void> {
	const pb = client.getClient();

	try {
		const collections = await pb.collections.getFullList();
		const testCollection = collections.find(
			(c) => c.name === collectionName,
		);

		if (testCollection) {
			await pb.collections.delete(testCollection.id);
		}
	} catch (error) {
		// Ignore cleanup errors
		console.warn(`Failed to delete test collection ${collectionName}:`, error);
	}
}

/**
 * Clean up all records in a collection
 * Useful for resetting test state
 *
 * @param client - Authenticated PocketBase client
 * @param collectionName - Name of the collection to clean
 */
export async function cleanupCollectionRecords(
	client: PocketBaseClient,
	collectionName: string,
): Promise<void> {
	try {
		const records = await client.listRecords(collectionName);

		for (const record of records) {
			await client.deleteRecord(collectionName, record.id);
		}
	} catch (error) {
		console.warn(
			`Failed to cleanup records in collection ${collectionName}:`,
			error,
		);
	}
}

/**
 * Create multiple test records in a collection
 * Useful for setting up test data
 *
 * @param client - Authenticated PocketBase client
 * @param collectionName - Name of the collection
 * @param records - Array of record data to create
 * @returns Array of created record IDs
 */
export async function createTestRecords<T extends Record<string, unknown>>(
	client: PocketBaseClient,
	collectionName: string,
	records: T[],
): Promise<string[]> {
	const ids: string[] = [];

	for (const record of records) {
		const created = await client.createRecord(collectionName, record);
		ids.push(created.id);
	}

	return ids;
}

/**
 * Wait for a condition to be true
 * Polls the condition function until it returns true or timeout
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in ms (default: 10000)
 * @param pollInterval - Interval between checks in ms (default: 100)
 * @throws Error if timeout is reached
 */
export async function waitForCondition(
	condition: () => boolean | Promise<boolean>,
	timeout = 10000,
	pollInterval = 100,
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		const result = await condition();
		if (result) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate random string for test data
 * Useful for creating unique test records
 *
 * @param length - Length of the random string (default: 8)
 * @returns Random alphanumeric string
 */
export function generateRandomString(length = 8): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return result;
}

/**
 * Generate unique collection name for testing
 * Includes timestamp to ensure uniqueness
 *
 * @param prefix - Prefix for the collection name (default: 'test')
 * @returns Unique collection name
 */
export function generateTestCollectionName(prefix = 'test'): string {
	const timestamp = Date.now();
	const random = generateRandomString(4);
	return `${prefix}_${timestamp}_${random}`;
}

/**
 * Retry a function multiple times with exponential backoff
 * Useful for flaky operations like network requests
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms (default: 100)
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 100,
): Promise<T> {
	let lastError: Error | undefined;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (i < maxRetries - 1) {
				const delay = initialDelay * 2 ** i;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError || new Error('Retry failed');
}

/**
 * Measure execution time of a function
 * Useful for performance testing
 *
 * @param fn - Function to measure
 * @returns Tuple of [result, duration in ms]
 */
export async function measureExecutionTime<T>(
	fn: () => Promise<T>,
): Promise<[T, number]> {
	const startTime = Date.now();
	const result = await fn();
	const duration = Date.now() - startTime;

	return [result, duration];
}

/**
 * Assert that execution time is within expected range
 * Useful for performance assertions
 *
 * @param fn - Function to measure
 * @param maxDuration - Maximum allowed duration in ms
 * @returns Result of the function
 * @throws Error if execution time exceeds maxDuration
 */
export async function assertExecutionTime<T>(
	fn: () => Promise<T>,
	maxDuration: number,
): Promise<T> {
	const [result, duration] = await measureExecutionTime(fn);

	if (duration > maxDuration) {
		throw new Error(
			`Execution time ${duration}ms exceeded maximum ${maxDuration}ms`,
		);
	}

	return result;
}

/**
 * Sleep for a specified duration
 * Useful for adding delays in tests
 *
 * @param ms - Duration in milliseconds
 */
export async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
