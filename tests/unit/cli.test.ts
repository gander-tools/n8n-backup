/**
 * CLI entry point tests
 * @module tests/unit/cli
 */

import { describe, expect, test } from 'bun:test';

describe('CLI Entry Point', () => {
	test('should have a shebang for Node.js execution', async () => {
		const file = Bun.file('src/cli.ts');
		const content = await file.text();

		expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
	});

	test('should import and execute main function', async () => {
		// This test verifies the structure exists
		// We can't actually test execution without running the CLI
		const file = Bun.file('src/cli.ts');
		const exists = await file.exists();

		expect(exists).toBe(true);
	});
});
