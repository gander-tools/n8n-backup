/**
 * Version command - displays package name and version
 * @module commands/version
 */

import pkg from '../../package.json';

/**
 * Returns the package name and version information
 * @returns Formatted string with package name and version
 */
export function getVersionInfo(): string {
  return `${pkg.name} v${pkg.version}`;
}
