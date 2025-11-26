/**
 * n8n-backup - CLI utility for backup and restore of n8n workflows
 * @see https://github.com/gander-tools/n8n-backup
 */

export * from './types/index.js';
export * from './services/pocketbase-client.js';

/**
 * Main entry point for the n8n-backup CLI
 * TDD: This module will be developed using Test-Driven Development
 */
export function main(): void {
  console.log('n8n-backup v0.1.0 - TDD Implementation');
  console.log('Backup and restore for n8n workflows, credentials, and tags');
}

// Run if executed directly
if (import.meta.main) {
  main();
}
