import { describe, expect, test } from 'bun:test';
import type { BackupConfig, BackupResult, Profile } from '../../src/types/index.js';

describe('Type Definitions', () => {
  describe('BackupConfig', () => {
    test('should accept valid configuration', () => {
      const config: BackupConfig = {
        profile: 'default',
        outputDir: '/tmp/backups',
        verbose: true,
      };

      expect(config.profile).toBe('default');
      expect(config.outputDir).toBe('/tmp/backups');
      expect(config.verbose).toBe(true);
    });

    test('should accept partial configuration', () => {
      const config: BackupConfig = {
        profile: 'production',
      };

      expect(config.profile).toBe('production');
      expect(config.outputDir).toBeUndefined();
      expect(config.verbose).toBeUndefined();
    });

    test('should accept empty configuration', () => {
      const config: BackupConfig = {};

      expect(config).toBeDefined();
      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe('BackupResult', () => {
    test('should represent successful backup', () => {
      const result: BackupResult = {
        success: true,
        versionId: 'v1.0.0-20250126',
        workflowCount: 15,
        credentialCount: 8,
        tagCount: 5,
      };

      expect(result.success).toBe(true);
      expect(result.versionId).toBe('v1.0.0-20250126');
      expect(result.workflowCount).toBe(15);
      expect(result.credentialCount).toBe(8);
      expect(result.tagCount).toBe(5);
    });

    test('should represent failed backup', () => {
      const result: BackupResult = {
        success: false,
        error: 'Connection timeout',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(result.versionId).toBeUndefined();
    });

    test('should handle partial failure with counts', () => {
      const result: BackupResult = {
        success: true,
        versionId: 'v1.0.1',
        workflowCount: 10,
        credentialCount: 0,
        tagCount: 3,
      };

      expect(result.success).toBe(true);
      expect(result.credentialCount).toBe(0);
    });
  });

  describe('Profile', () => {
    test('should represent valid profile', () => {
      const profile: Profile = {
        id: 'prof-123',
        name: 'Production',
        url: 'https://n8n.example.com',
        apiKey: 'encrypted-key-here',
        isDefault: true,
      };

      expect(profile.id).toBe('prof-123');
      expect(profile.name).toBe('Production');
      expect(profile.url).toBe('https://n8n.example.com');
      expect(profile.apiKey).toBe('encrypted-key-here');
      expect(profile.isDefault).toBe(true);
    });

    test('should represent non-default profile', () => {
      const profile: Profile = {
        id: 'prof-456',
        name: 'Staging',
        url: 'https://staging.n8n.example.com',
        apiKey: 'staging-key',
        isDefault: false,
      };

      expect(profile.isDefault).toBe(false);
    });
  });
});
