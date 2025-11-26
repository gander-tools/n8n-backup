/**
 * n8n-backup - CLI utility for backup and restore of n8n workflows
 *
 * Copyright (C) 2025 Adam Gąsowski (https://github.com/gander)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @license GPL-3.0
 * @author Adam Gąsowski <https://github.com/gander>
 * @see https://github.com/gander-tools/n8n-backup
 */

export * from './types/index.js';

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
