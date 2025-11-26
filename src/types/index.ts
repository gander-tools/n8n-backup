/**
 * Core type definitions for n8n-backup
 *
 * Following TDD principles:
 * - Types are defined before implementation
 * - Each type has corresponding tests
 * - Types match the PRD specification
 */

/**
 * Configuration for n8n-backup operations
 */
export interface BackupConfig {
  /** Profile ID or name to use */
  profile?: string;
  /** Output directory for backups */
  outputDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Result of a backup operation
 */
export interface BackupResult {
  /** Operation success status */
  success: boolean;
  /** Version ID of the backup */
  versionId?: string;
  /** Error message if failed */
  error?: string;
  /** Number of workflows backed up */
  workflowCount?: number;
  /** Number of credentials backed up */
  credentialCount?: number;
  /** Number of tags backed up */
  tagCount?: number;
}

/**
 * Profile configuration for n8n instance
 */
export interface Profile {
  /** Unique profile ID */
  id: string;
  /** Display name */
  name: string;
  /** n8n instance URL */
  url: string;
  /** API key (encrypted in storage) */
  apiKey: string;
  /** Is this the default profile */
  isDefault: boolean;
}

// Export PocketBase types
export * from './pocketbase.js';
