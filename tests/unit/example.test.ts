/**
 * Example unit test following TDD methodology
 *
 * Copyright (C) 2025 Adam Gąsowski (https://github.com/gander)
 * Licensed under GPL-3.0
 *
 * TDD Cycle:
 * 1. RED: Write a failing test
 * 2. GREEN: Write minimal code to pass
 * 3. REFACTOR: Improve the code
 *
 * Unit tests are fast, isolated, and test individual functions
 */

import { describe, expect, test } from 'bun:test';
import type { BackupConfig, BackupResult } from '../../src/types/index.js';

describe('TDD Example - Type Definitions', () => {
  test('BackupConfig type should accept valid configuration', () => {
    const config: BackupConfig = {
      profile: 'default',
      outputDir: '/tmp/backups',
      verbose: true,
    };

    expect(config.profile).toBe('default');
    expect(config.verbose).toBe(true);
  });

  test('BackupResult type should represent operation result', () => {
    const result: BackupResult = {
      success: true,
      versionId: 'v1.0.0',
      workflowCount: 5,
      credentialCount: 3,
      tagCount: 2,
    };

    expect(result.success).toBe(true);
    expect(result.versionId).toBe('v1.0.0');
  });

  test('BackupResult should handle failure cases', () => {
    const result: BackupResult = {
      success: false,
      error: 'Connection failed',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('TDD Example - Helper Functions', () => {
  // Example of TDD: Write test first, then implement
  test('should format version string correctly', () => {
    // This test will fail initially - that's TDD!
    const formatVersion = (major: number, minor: number, patch: number): string => {
      return `v${major}.${minor}.${patch}`;
    };

    expect(formatVersion(1, 2, 3)).toBe('v1.2.3');
    expect(formatVersion(0, 1, 0)).toBe('v0.1.0');
  });
});
