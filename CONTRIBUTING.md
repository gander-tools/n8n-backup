# Contributing to n8n-backup

Thank you for your interest in contributing to **n8n-backup**! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Test-Driven Development (TDD)](#test-driven-development-tdd)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code:

- **Be respectful**: Treat everyone with respect and consideration
- **Be collaborative**: Work together constructively
- **Be inclusive**: Welcome newcomers and help them learn
- **Be professional**: Keep discussions focused and productive
- **Be patient**: Remember that everyone was a beginner once

If you experience or witness unacceptable behavior, please report it to the project maintainers.

---

## Getting Started

Before you start contributing:

1. **Check existing issues**: Browse [open issues](https://github.com/gander-tools/n8n-backup/issues) to find something to work on
2. **Create an issue**: If you have a new idea, create an issue first to discuss it
3. **Wait for approval**: For major changes, wait for maintainer approval before starting work
4. **Ask questions**: Don't hesitate to ask for clarification in issues or discussions

### Good First Issues

Look for issues labeled `good first issue` - these are great for new contributors and typically involve:
- Documentation improvements
- Small bug fixes
- Adding tests
- Code cleanup

---

## Development Setup

### Prerequisites

Make sure you have the following installed:

- **Bun** >= 1.3 ([installation guide](https://bun.sh))
- **Git** >= 2.0
- **Docker** and **Docker Compose** (for integration tests)
- **Node.js** >= 18 (optional, Bun is preferred)

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/n8n-backup.git
   cd n8n-backup
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/gander-tools/n8n-backup.git
   ```

4. **Install dependencies**:
   ```bash
   bun install
   ```

5. **Install git hooks** (Lefthook):
   ```bash
   bun run prepare
   ```

6. **Verify setup**:
   ```bash
   bun run typecheck
   bun run lint
   bun run format:check
   bun test
   ```

All checks should pass. If not, see the [Getting Help](#getting-help) section.

---

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
# Update your main branch first
git checkout main
git pull upstream main

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation changes
- `test/description` - Test additions/improvements
- `refactor/description` - Code refactoring

### 2. Make Your Changes

Follow the [TDD workflow](#test-driven-development-tdd) and [code style guidelines](#code-style-guidelines).

### 3. Run Quality Checks

**CRITICAL**: Before committing, always run:

```bash
bun run format     # Format all files
bun run lint       # Check for linting issues
bun run typecheck  # Type checking
bun test           # Run all tests
```

If Lefthook is installed, these checks run automatically on commit. **Never bypass these checks.**

### 4. Commit Your Changes

See [Commit Message Conventions](#commit-message-conventions) for guidelines.

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub. See [Pull Request Process](#pull-request-process) for details.

---

## Test-Driven Development (TDD)

**This project strictly follows TDD methodology.** All features must be developed using the Red-Green-Refactor cycle.

### The TDD Cycle

#### 🔴 RED - Write a Failing Test

Write a test for the feature before implementing it. The test should fail initially.

```typescript
import { describe, expect, test } from 'bun:test';
import { myNewFeature } from '../src/utils/my-feature';

describe('myNewFeature', () => {
  test('should return expected result for valid input', () => {
    const result = myNewFeature('input');
    expect(result).toBe('expected output');
  });
});
```

Run the test to confirm it fails:
```bash
bun test
```

#### 🟢 GREEN - Write Minimal Code to Pass

Implement the simplest code that makes the test pass.

```typescript
// src/utils/my-feature.ts
export function myNewFeature(input: string): string {
  return 'expected output';
}
```

Run the test again to confirm it passes:
```bash
bun test
```

#### 🔵 REFACTOR - Improve and Optimize

Now improve the code while keeping tests green:
- Clean up the implementation
- Add error handling
- Optimize performance
- Improve readability

Run tests after each change:
```bash
bun test --watch  # Watch mode for continuous testing
```

### TDD Best Practices

1. **Write tests first, always** - No code without tests
2. **One test at a time** - Focus on one behavior
3. **Keep tests fast** - Unit tests should run in milliseconds
4. **Test all paths** - Happy path, error cases, edge cases
5. **Use descriptive test names** - Test name should explain what is being tested
6. **Arrange-Act-Assert** - Structure tests clearly:
   ```typescript
   test('should handle invalid input', () => {
     // Arrange: Set up test data
     const invalidInput = null;

     // Act: Execute the code
     const result = () => myFunction(invalidInput);

     // Assert: Verify the result
     expect(result).toThrow('Invalid input');
   });
   ```

### Test Structure

```
tests/
├── unit/              # Fast, isolated tests (no external dependencies)
│   ├── services/      # Service layer tests
│   ├── utils/         # Utility function tests
│   └── types/         # Type validation tests
└── integration/       # Component interaction tests (requires Docker)
    ├── backup/        # Backup flow tests
    ├── restore/       # Restore flow tests
    └── sync/          # Sync flow tests
```

---

## Code Style Guidelines

### TypeScript Standards

- **Strict mode enabled** - Always use strict TypeScript
- **No `any` types** - Use `unknown` if type is truly unknown
- **Explicit return types** - For all public functions and methods
- **Document complex types** - Use JSDoc for type documentation

**Example**:
```typescript
/**
 * Creates a backup of n8n workflows
 * @param profileId - The profile ID to backup from
 * @param options - Backup options
 * @returns The created version ID
 * @throws {ApiError} If API connection fails
 */
export async function createBackup(
  profileId: string,
  options: BackupOptions
): Promise<string> {
  // Implementation
}
```

### Naming Conventions

- **Files**: kebab-case (`backup-service.ts`, `api-client.ts`)
- **Classes**: PascalCase (`BackupService`, `ApiClient`)
- **Functions**: camelCase (`createBackup`, `fetchWorkflows`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_TIMEOUT`, `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`BackupConfig`, `ApiResponse`)
- **Private members**: Prefix with `_` (`_validateInput`)

**Example**:
```typescript
// Constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// Interface
interface BackupOptions {
  profileId: string;
  verbose: boolean;
}

// Class
class BackupService {
  private _apiClient: ApiClient;

  public async createBackup(options: BackupOptions): Promise<string> {
    return this._executeBackup(options);
  }

  private _executeBackup(options: BackupOptions): Promise<string> {
    // Implementation
  }
}

// Function
function calculateDuration(startTime: number, endTime: number): number {
  return endTime - startTime;
}
```

### Linting and Formatting

**Always use Biome** (not ESLint/Prettier).

**Before committing**:
```bash
bun run format      # Auto-format all files
bun run lint        # Check for linting issues
bun run lint:fix    # Auto-fix linting issues
```

**Biome configuration** is in `biome.json` - do not modify without team approval.

### Code Organization

- **One export per file** - Keep files focused
- **Group related functions** - Use directories to organize
- **Dependency injection** - Prefer passing dependencies over global state
- **Pure functions when possible** - Easier to test and reason about
- **Avoid deep nesting** - Refactor if more than 3 levels deep

### Error Handling

- **Always handle errors** - Never ignore caught exceptions
- **Use custom error classes** - For different error types
- **Provide context** - Include relevant information in error messages
- **Document throws** - Use JSDoc `@throws` tag

**Example**:
```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetches data from API
 * @throws {ApiError} If API request fails
 */
async function fetchData(url: string): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch data: ${response.statusText}`,
        response.status,
        url
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error.message}`, 0, url);
  }
}
```

---

## Commit Message Conventions

We follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `ci`: CI/CD changes

### Scope (Optional)

The scope specifies the area of change:
- `backup` - Backup functionality
- `restore` - Restore functionality
- `sync` - Sync functionality
- `profiles` - Profile management
- `cli` - CLI interface
- `api` - API client
- `db` - Database/PocketBase
- `types` - TypeScript types
- `tests` - Test infrastructure

### Subject

- Use imperative mood ("add feature" not "added feature")
- Don't capitalize first letter
- No period at the end
- Keep it concise (50 characters or less)

### Body (Optional)

- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Separate from subject with blank line

### Footer (Optional)

- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

**Simple feature**:
```
feat(backup): add support for filtering by tags

Implements tag-based filtering for selective backups.
Users can now use --tags flag to backup specific workflows.

Closes #45
```

**Bug fix**:
```
fix(restore): handle missing credentials gracefully

Prevent crash when credentials are missing during restore.
Instead, log warning and continue with other objects.

Fixes #78
```

**Breaking change**:
```
feat(api): update to n8n API v2

BREAKING CHANGE: Requires n8n version 1.0 or higher.
Update profile URLs to use /api/v2 endpoints.
```

**Documentation**:
```
docs: update installation instructions

Add Bun installation steps and clarify prerequisites.
```

**Test addition**:
```
test(backup): add unit tests for date filtering

Increase coverage for backup service date range filtering.
Tests happy path, edge cases, and error scenarios.
```

---

## Pull Request Process

### Before Creating a PR

1. **Sync with upstream**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks**:
   ```bash
   bun run ci  # Runs format, lint, typecheck, and tests
   ```

3. **Update documentation** if needed

4. **Add tests** for new features

5. **Update CHANGELOG.md** (if significant change)

### Creating the PR

1. **Use a clear title**: Follow commit message conventions
   - Example: `feat(backup): add selective backup by tags`

2. **Fill out the PR template** completely:
   - Description of changes
   - Related issues
   - Type of change (bug fix, feature, etc.)
   - Testing performed
   - Breaking changes (if any)

3. **Add labels**: Select appropriate labels (bug, enhancement, documentation, etc.)

4. **Request review**: Tag relevant maintainers or contributors

### PR Template

```markdown
## Description
[Brief description of what this PR does]

## Related Issues
Closes #[issue number]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Test improvement

## Testing Performed
[Describe the tests you ran and how to reproduce them]

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing performed

## Checklist
- [ ] My code follows the project's code style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
[Add screenshots to help explain your changes]

## Additional Notes
[Any additional information that reviewers should know]
```

### After Creating the PR

1. **Respond to feedback** - Address all review comments
2. **Make requested changes** - Push new commits to the same branch
3. **Keep PR updated** - Rebase if main branch advances
4. **Be patient** - Maintainers will review as soon as possible
5. **Squash commits** - Before merge, squash related commits into logical units

### PR Review Process

- Maintainers will review your PR within 3-5 business days
- At least one approval required before merging
- All CI checks must pass
- No merge conflicts with main branch
- Discussion and iteration is expected - don't take feedback personally

---

## Testing Requirements

### Coverage Requirements

- **Minimum coverage**: 80% (enforced in CI/CD)
- **Target coverage**: 90%+
- **All code paths tested**: Happy path, error cases, edge cases

### Running Tests

```bash
# Run all tests
bun test

# Run in watch mode (TDD)
bun test --watch

# Run with coverage report
bun test --coverage

# Run specific test file
bun test tests/unit/services/backup-service.test.ts

# Run integration tests only
bun test tests/integration

# Run tests matching pattern
bun test --grep "backup"
```

### Writing Tests

Every new feature must include:

1. **Unit tests** - Test individual functions/methods in isolation
2. **Integration tests** - Test component interactions (if applicable)
3. **Error case tests** - Test error handling
4. **Edge case tests** - Test boundary conditions

**Example test file**:
```typescript
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { BackupService } from '../src/services/backup-service';

describe('BackupService', () => {
  let backupService: BackupService;

  beforeEach(() => {
    // Set up test environment
    backupService = new BackupService();
  });

  afterEach(() => {
    // Clean up
  });

  describe('createBackup', () => {
    test('should create backup successfully with valid profile', async () => {
      // Arrange
      const profileId = 'test-profile';
      const options = { verbose: false };

      // Act
      const versionId = await backupService.createBackup(profileId, options);

      // Assert
      expect(versionId).toBeDefined();
      expect(typeof versionId).toBe('string');
    });

    test('should throw error with invalid profile', async () => {
      // Arrange
      const invalidProfileId = 'non-existent';
      const options = { verbose: false };

      // Act & Assert
      expect(
        async () => await backupService.createBackup(invalidProfileId, options)
      ).toThrow('Profile not found');
    });

    test('should handle API timeout gracefully', async () => {
      // Test timeout scenario
    });

    test('should track metrics during backup', async () => {
      // Test metrics collection
    });
  });
});
```

### Integration Tests

Integration tests require Docker:

```bash
# Start test environment
docker-compose -f tests/docker-compose.test.yml up -d

# Run integration tests
bun test tests/integration

# Stop test environment
docker-compose -f tests/docker-compose.test.yml down
```

---

## Documentation Requirements

### When to Update Documentation

Update documentation when you:
- Add new features
- Change existing behavior
- Add new CLI commands or options
- Modify configuration options
- Fix bugs that affect documented behavior

### Documentation Files

- **README.md** - User-facing documentation, quick start, examples
- **CLAUDE.md** - Development guide for Claude Code
- **CONTRIBUTING.md** - This file
- **ROADMAP.md** - Project roadmap and planned features
- **.claude/PRD.md** - Product Requirements Document

### Code Documentation

Use JSDoc for all public APIs:

```typescript
/**
 * Creates a backup of n8n instance data
 *
 * This function fetches workflows, credentials, and tags from the n8n API
 * and stores them in PocketBase as a versioned snapshot.
 *
 * @param profileId - The profile identifier to backup from
 * @param options - Backup configuration options
 * @param options.verbose - Enable detailed logging
 * @param options.output - Output directory for reports
 * @returns Promise resolving to the created version ID
 * @throws {ApiError} If API connection fails
 * @throws {ValidationError} If profile is invalid
 *
 * @example
 * ```typescript
 * const versionId = await createBackup('prod', { verbose: true });
 * console.log(`Backup created: ${versionId}`);
 * ```
 */
export async function createBackup(
  profileId: string,
  options: BackupOptions
): Promise<string> {
  // Implementation
}
```

---

## Project Structure

```
n8n-backup/
├── .claude/              # Claude Code configuration
│   └── PRD.md           # Product Requirements Document
├── src/                 # Source code
│   ├── commands/        # CLI command handlers
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── docs/                # Additional documentation
├── .github/             # GitHub configuration
│   └── workflows/       # CI/CD workflows
├── biome.json           # Biome configuration
├── lefthook.yml         # Git hooks configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project metadata
├── README.md            # User documentation
├── CONTRIBUTING.md      # This file
├── ROADMAP.md           # Project roadmap
├── CHANGELOG.md         # Version changelog
└── LICENSE              # GPL-3.0 license
```

---

## Common Tasks

### Adding a New Command

1. Create command file in `src/commands/`
2. Write tests first in `tests/unit/commands/`
3. Implement command logic
4. Add command to CLI router
5. Update README.md with command documentation
6. Add integration tests

### Adding a New Service

1. Define interface in `src/types/`
2. Write unit tests in `tests/unit/services/`
3. Implement service in `src/services/`
4. Add integration tests if needed
5. Document public methods with JSDoc

### Fixing a Bug

1. Write a test that reproduces the bug (should fail)
2. Fix the bug (test should now pass)
3. Add edge case tests to prevent regression
4. Update documentation if behavior changed
5. Add entry to CHANGELOG.md

### Updating Dependencies

```bash
# Check for outdated dependencies
bun outdated

# Update specific dependency
bun update package-name

# Update all dependencies (be careful!)
bun update

# Test after updating
bun run ci
```

---

## Getting Help

### Documentation

- **README.md** - Start here for basic usage
- **.claude/PRD.md** - Complete product specification
- **ROADMAP.md** - Planned features and implementation

### Community

- **GitHub Issues** - [Report bugs or request features](https://github.com/gander-tools/n8n-backup/issues)
- **GitHub Discussions** - [Ask questions and discuss ideas](https://github.com/gander-tools/n8n-backup/discussions)
- **Pull Requests** - [View ongoing work](https://github.com/gander-tools/n8n-backup/pulls)

### Asking Questions

When asking for help:

1. **Search first** - Check if your question was already answered
2. **Be specific** - Include error messages, code snippets, and context
3. **Show your work** - Explain what you've tried
4. **Be patient** - Maintainers are volunteers

**Good question format**:
```markdown
## Problem
[Clear description of what you're trying to do]

## What I've Tried
- Tried X, got error Y
- Checked documentation Z
- Searched for similar issues

## Environment
- Bun version: 1.3.0
- OS: macOS 14.0
- n8n version: 1.0.0

## Error Message
[Complete error message or stack trace]

## Additional Context
[Any other relevant information]
```

---

## Recognition

Contributors will be recognized in:
- **CHANGELOG.md** - Credit for each contribution
- **README.md** - List of contributors
- **Release notes** - Highlight significant contributions

Thank you for contributing to n8n-backup! Your efforts help make this tool better for everyone. 🎉

---

## License

By contributing to n8n-backup, you agree that your contributions will be licensed under the **GNU General Public License v3.0**.

See [LICENSE](LICENSE) file for details.
