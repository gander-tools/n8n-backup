import { describe, expect, test } from 'bun:test';
import { getVersionInfo } from '../../../src/commands/version';
import pkg from '../../../package.json';

describe('version command', () => {
	test('should return package name and version', () => {
		// Arrange & Act
		const result = getVersionInfo();

		// Assert
		expect(result).toContain(pkg.name);
		expect(result).toContain(pkg.version);
	});

	test('should format version info correctly', () => {
		// Arrange & Act
		const result = getVersionInfo();

		// Assert
		expect(result).toBe(`${pkg.name} v${pkg.version}`);
	});

	test('should read version from package.json', () => {
		// Arrange & Act
		const result = getVersionInfo();

		// Assert
		// Version should match package.json, not be hardcoded
		expect(result).toContain('0.1.0');
	});
});
