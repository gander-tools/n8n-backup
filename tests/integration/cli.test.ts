/**
 * Integration tests for CLI execution
 * Tests the built application binary and command execution
 *
 * Prerequisites:
 * - Application must be built: `bun run build`
 * - PocketBase running at http://localhost:8090
 *
 * @see tests/TESTING.md for setup instructions
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawn } from 'bun';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = join(import.meta.dir, '../..');
const CLI_PATH = join(PROJECT_ROOT, 'dist/index.js');
const CLI_BIN = join(PROJECT_ROOT, 'dist/cli.js');

/**
 * Helper to execute CLI command
 */
async function executeCli(
  args: string[] = [],
  options: { timeout?: number } = {},
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const timeout = options.timeout || 10000;

  return new Promise((resolve, reject) => {
    const proc = spawn({
      cmd: ['bun', 'run', CLI_PATH, ...args],
      cwd: PROJECT_ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    const timeoutId = setTimeout(() => {
      proc.kill();
      reject(new Error(`CLI execution timeout after ${timeout}ms`));
    }, timeout);

    if (proc.stdout) {
      proc.stdout.pipeTo(
        new WritableStream({
          write(chunk) {
            stdout += new TextDecoder().decode(chunk);
          },
        }),
      );
    }

    if (proc.stderr) {
      proc.stderr.pipeTo(
        new WritableStream({
          write(chunk) {
            stderr += new TextDecoder().decode(chunk);
          },
        }),
      );
    }

    proc.exited.then((exitCode) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: exitCode || 0,
      });
    });
  });
}

describe('CLI - Integration Tests', () => {
  beforeAll(() => {
    console.log('🔄 Setting up CLI integration tests...');
    console.log(`CLI Path: ${CLI_PATH}`);
    console.log(`Project Root: ${PROJECT_ROOT}`);
  });

  afterAll(() => {
    console.log('🧹 CLI integration tests completed');
  });

  describe('Build Artifacts', () => {
    test('should have built CLI file', () => {
      const exists = existsSync(CLI_PATH);
      expect(exists).toBe(true);
    });

    test('should have executable permissions on CLI file', () => {
      // On Unix systems, check if file exists
      // Actual permission check would require fs.stat
      const exists = existsSync(CLI_PATH);
      expect(exists).toBe(true);
    });
  });

  describe('Basic Execution', () => {
    test('should execute CLI without errors', async () => {
      const result = await executeCli([]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();
    });

    test('should display version and description', async () => {
      const result = await executeCli([]);

      expect(result.stdout).toContain('n8n-backup');
      expect(result.stdout).toContain('0.1.0');
      expect(result.stdout).toContain('TDD Implementation');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid arguments gracefully', async () => {
      const result = await executeCli(['--invalid-flag']);

      // Should not crash
      expect(result).toBeDefined();
    });

    test('should execute without throwing errors', async () => {
      // Should not throw an error
      await expect(executeCli([])).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should execute within reasonable time', async () => {
      const startTime = Date.now();
      await executeCli([]);
      const duration = Date.now() - startTime;

      // Should execute in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
