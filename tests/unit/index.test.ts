import { describe, expect, test } from 'bun:test';
import { main } from '../../src/index.js';

describe('Main Entry Point', () => {
  test('main function should exist', () => {
    expect(main).toBeDefined();
    expect(typeof main).toBe('function');
  });

  test('main function should execute without errors', () => {
    expect(() => main()).not.toThrow();
  });

  test('main function should return void', () => {
    const result = main();
    expect(result).toBeUndefined();
  });
});
