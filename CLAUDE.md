# Claude Code Development Guide

This document provides guidance for Claude Code (AI assistant) when working on the n8n-backup project.

## Project Overview

**n8n-backup** is a CLI utility for backing up and restoring n8n workflows, credentials, and tags via REST API. It stores backups in PocketBase with strict versioning and comprehensive audit trails.

- **Package**: `@gander-tools/n8n-backup`
- **License**: GNU GPL 3.0
- **Repository**: https://github.com/gander-tools/n8n-backup
- **Author**: Adam Gąsowski ([@gander](https://github.com/gander))
- **Organization**: [gander-tools](https://github.com/gander-tools)

## Technology Stack

- **Runtime**: Bun >= 1.3
- **Language**: TypeScript >= 5.9
- **Linter/Formatter**: Biome (mandatory)
- **Testing**: Bun test (min 80% coverage)
- **Git Hooks**: Lefthook (local only)

### Installing Bun

If Bun is not available in the system, install it globally using npm:

```bash
npm install -g bun
```

This ensures Bun is available without searching for system installations.

## Important Note for Claude Code

**When the user mentions `npm` or `npx`, they mean `bun` and `bunx`.**

This project uses **Bun** as the primary runtime and package manager. Always use:
- `bun install` instead of `npm install`
- `bun add` instead of `npm install <package>`
- `bunx` instead of `npx`
- `bun run` instead of `npm run`

Example corrections:
- ❌ `npm install -g @gander-tools/n8n-backup`
- ✅ `bun install -g @gander-tools/n8n-backup`

- ❌ `npx @gander-tools/n8n-backup`
- ✅ `bunx @gander-tools/n8n-backup`

## Development Methodology

### Test-Driven Development (TDD)

This project **strictly follows TDD**. Every feature must be developed using the Red-Green-Refactor cycle:

1. **🔴 RED**: Write a failing test first
2. **🟢 GREEN**: Write minimal code to make it pass
3. **🔵 REFACTOR**: Improve and optimize the code

**Coverage Requirements**:
- Minimum: 80% (enforced in CI/CD)
- Target: 90%+
- Test all paths: happy, sad, and edge cases

### Test Structure

```
tests/
├── unit/           # Fast, isolated tests (no external deps)
└── integration/    # Component interaction tests (Docker required)
```

## Architecture

Follow the layered architecture defined in PRD:

```
src/
├── commands/       # CLI entry points (backup.ts, restore.ts, sync.ts)
├── services/       # Business logic (api-client, pocketbase-client, etc.)
├── types/          # TypeScript definitions (config, pocketbase, n8n, report)
└── utils/          # Helper functions
```

## Code Quality Standards

### ⚠️ CRITICAL: Pre-Commit Requirements

**ALWAYS run these commands before committing ANY changes:**

```bash
bun run format     # Format all files (biome format --write .)
bun run lint       # Check for linting issues (biome check .)
bun run typecheck  # Verify TypeScript types (tsc --noEmit)
```

**This is MANDATORY. Never commit without running these commands first.**

The pre-commit hook (lefthook) will automatically run these checks, but you should run them manually first to catch issues early.

If you encounter errors:
1. Run `bun run format` to auto-fix formatting issues
2. Run `bun run lint:fix` to auto-fix linting issues
3. Manually fix any remaining issues
4. Verify with `bun run format:check` and `bun run lint`

### Formatting & Linting

- **Always use Biome** (not ESLint/Prettier)
- Run `bun run lint` before commits
- Run `bun run format` to auto-fix
- Lefthook enforces these automatically (but Claude Code must do it manually)

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for public APIs
- Document complex types

### Naming Conventions

- **Files**: kebab-case (`backup-service.ts`)
- **Classes**: PascalCase (`BackupService`)
- **Functions**: camelCase (`createBackup`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Types/Interfaces**: PascalCase (`BackupConfig`)

## Git Workflow

### Commits

- Use conventional commits format
- Examples:
  - `feat: add backup command`
  - `fix: handle API timeout errors`
  - `test: add unit tests for restore service`
  - `docs: update README with installation guide`

### Hooks

Lefthook runs automatically on:
- **pre-commit**: format check, lint, typecheck
- **pre-push**: run tests

### CI/CD

GitHub Actions runs on every push:
1. Format check
2. Lint
3. Typecheck
4. Tests with coverage
5. Build

## Key Requirements from PRD

### Data Storage

- All data in PocketBase
- Version-based snapshots
- Per-object reports (status, message, skip reason)
- Always generate audit records

### Profiles

- Stored in PocketBase
- Support `--profile` flag
- One default profile required
- API keys encrypted

### Error Handling

- **Always ignore-errors mode** in restore/sync
- Never fail hard mid-operation
- Report all errors/skipped items
- Log comprehensive version_report_summary

### Version Validation

- Restore requires exact minor version match
- Abort if mismatch (no data modified)

## Testing Guidelines

### Unit Tests

```typescript
import { describe, expect, test } from 'bun:test';

describe('Feature Name', () => {
  test('should handle valid input', () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });

  test('should handle error cases', () => {
    expect(() => myFunction(invalidInput)).toThrow();
  });
});
```

### Integration Tests

```typescript
// Use Docker containers for n8n and PocketBase
// Test full backup/restore flow
// Clean up after tests
```

## Running the Project

```bash
# Development
bun run dev

# Tests
bun test                 # Run all tests
bun test --watch         # TDD mode
bun test --coverage      # With coverage report

# Linting & Formatting
bun run lint             # Check for issues
bun run lint:fix         # Auto-fix issues
bun run format           # Format code
bun run format:check     # Check formatting

# Build
bun run build            # Production build

# CI Pipeline (run all checks)
bun run ci
```

## Documentation Requirements

When implementing features:

1. **Code Comments**: Document complex logic
2. **Type Documentation**: Use JSDoc for public APIs
3. **README Updates**: Keep user documentation current
4. **Test Documentation**: Explain test scenarios

## Common Commands

```bash
# Install dependencies
bun install

# Add new dependency
bun add <package>

# Add dev dependency
bun add -d <package>

# Run TypeScript typecheck
bun run typecheck

# Initialize git hooks
bun run prepare
```

## Important Notes

### What NOT to Do

- ❌ No browser integration
- ❌ No deprecated APIs
- ❌ No ESLint or Prettier (use Biome)
- ❌ No code without tests
- ❌ No commits without passing hooks

### What TO Do

- ✅ Write tests first (TDD)
- ✅ Use Biome for all formatting/linting
- ✅ Follow semantic versioning
- ✅ Document public APIs
- ✅ Handle errors gracefully
- ✅ Keep test coverage above 80%

## Resources

- **PRD**: `.claude/PRD.md` (complete specification)
- **Test Guide**: `tests/README.md`
- **Bun Docs**: https://bun.sh/docs
- **Biome Docs**: https://biomejs.dev
- **n8n API**: https://docs.n8n.io/api/api-reference

## Questions?

If uncertain about implementation:
1. Check PRD first
2. Review existing code patterns
3. Write tests to clarify requirements
4. Follow TDD cycle strictly

---

**Remember**: This project values **test coverage**, **code quality**, and **strict adherence to the PRD specification**. When in doubt, write a test!
