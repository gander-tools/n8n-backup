# n8n-backup

[![TDD](https://img.shields.io/badge/TDD-Enabled-green?style=flat-square&logo=checkmarx)](https://github.com/gander-tools/n8n-backup)
[![Bun](https://img.shields.io/badge/Bun-1.3-black?style=flat-square&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Claude Code](https://img.shields.io/badge/Built_with-Claude_Code-blueviolet?style=flat-square&logo=anthropic)](https://claude.ai)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Test Coverage](https://img.shields.io/badge/coverage-%3E80%25-brightgreen?style=flat-square)](https://github.com/gander-tools/n8n-backup)

> **CLI utility for full backup and restore of n8n workflows, credentials, and tags via REST API**

A modern, type-safe CLI tool built with **Bun** and **TypeScript** that enables comprehensive backup and restore operations for n8n automation workflows. All backups are versioned and stored in PocketBase with full audit trails.

## ✨ Features

- 🔄 **Full Backup & Restore** - Complete snapshot of workflows, credentials, and tags
- 📦 **PocketBase Storage** - Versioned backups with strict audit trails
- 🔐 **Profile Management** - Multiple n8n instances with encrypted credentials
- 📊 **Detailed Reporting** - Per-object status tracking and comprehensive metrics
- ✅ **Version Validation** - Strict n8n version compatibility checks
- 🛡️ **Error Resilience** - Never fails mid-operation, always reports issues
- 🧪 **Test-Driven Development** - 80%+ test coverage with TDD methodology

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.3 ([install](https://bun.sh))
- **n8n** instance with API access
- **PocketBase** for backup storage

### Installation

```bash
# Install globally via npm
npm install -g @gander-tools/n8n-backup

# Or use with npx
npx @gander-tools/n8n-backup
```

### Basic Usage

```bash
# Backup workflows from default profile
n8n-backup backup

# Restore from specific version
n8n-backup restore <version_id>

# Sync between profiles
n8n-backup sync --source prod --target staging

# List available profiles
n8n-backup profiles list
```

## 📋 Commands

### `n8n-backup backup`

Creates a full snapshot of workflows, credentials, and tags from n8n via REST API.

**Options:**
- `--profile <name>` - Profile to use (default: default profile)
- `--output <dir>` - Output directory for reports
- `--verbose` - Enable detailed logging

**Output:**
- New version record in PocketBase
- Per-object reports (workflow_report, credential_report, tag_report)
- Audit record with full operation metadata

### `n8n-backup restore <version_id>`

Restores data from a specific backup version to target n8n instance.

**Requirements:**
- Exact minor version match between source and target n8n
- If version mismatch: operation aborts with no changes

**Options:**
- `--profile <name>` - Target profile
- `--dry-run` - Preview changes without applying

**Behavior:**
- Always runs in ignore-errors mode
- Skipped/errored objects are reported
- Never fails hard mid-operation

### `n8n-backup sync`

Performs backup from source and restore to target as a single operation.

```bash
n8n-backup sync --source prod --target staging --backup
```

**Options:**
- `--source <profile>` - Source profile (authoritative)
- `--target <profile>` - Target profile
- `--backup` - Create backup before sync

### `n8n-backup profiles`

Manage n8n instance profiles.

```bash
# Add new profile
n8n-backup profiles add --name prod --url https://n8n.example.com --api-key KEY

# List profiles
n8n-backup profiles list

# Set default profile
n8n-backup profiles set-default prod
```

## 🏗️ Architecture

Built with clean, layered architecture following TDD principles:

```
src/
├── commands/       # CLI entry points (backup, restore, sync)
├── services/       # Business logic (api-client, pocketbase-client)
├── types/          # TypeScript definitions
└── utils/          # Helper functions

tests/
├── unit/           # Fast, isolated tests
└── integration/    # Component interaction tests (Docker)
```

## 🧪 Test-Driven Development

This project **strictly follows TDD** with the Red-Green-Refactor cycle:

1. **🔴 RED** - Write a failing test
2. **🟢 GREEN** - Write minimal code to pass
3. **🔵 REFACTOR** - Improve and optimize

**Coverage Requirements:**
- Minimum: **80%** (enforced in CI/CD)
- Target: **90%+**
- All paths: happy, sad, and edge cases

```bash
# Run tests in TDD watch mode
bun test --watch

# Run with coverage report
bun test --coverage
```

See [tests/README.md](tests/README.md) for detailed testing guide.

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/gander-tools/n8n-backup.git
cd n8n-backup

# Install dependencies
bun install

# Install git hooks (Lefthook)
bun run prepare
```

### Development Workflow

```bash
# Run in development mode
bun run dev

# Run tests (TDD mode)
bun test --watch

# Lint and format
bun run lint
bun run format

# Type checking
bun run typecheck

# Run full CI pipeline locally
bun run ci
```

### Code Quality

- **Linter/Formatter**: Biome (not ESLint/Prettier)
- **Git Hooks**: Lefthook (enforces format, lint, tests)
- **CI/CD**: GitHub Actions (lint, format, test, build)

## 📊 Data Model

All backups stored in PocketBase with the following structure:

- **versions** - Backup metadata, metrics, timestamps
- **workflows** - Workflow data + per-object reports
- **credentials** - Encrypted credentials + reports
- **tags** - Tag data + reports
- **audits** - Complete audit trail
- **profiles** - n8n instance configurations

Each backup creates a new version with all data linked by `version_id`.

## 🔐 Security

**⚠️ Important Disclaimer:**

This tool does **not** include built-in security beyond PocketBase encryption. You are fully responsible for:

- Securely storing configuration and API keys
- PocketBase access control and permissions
- Preventing unauthorized access to backups
- Data protection compliance (GDPR, etc.)

API keys are stored encrypted in PocketBase, but securing the PocketBase instance itself is your responsibility.

## 📦 Technology Stack

- **Runtime**: [Bun](https://bun.sh) >= 1.3
- **Language**: [TypeScript](https://www.typescriptlang.org) >= 5.9
- **Linter/Formatter**: [Biome](https://biomejs.dev)
- **Git Hooks**: [Lefthook](https://lefthook.dev)
- **Testing**: Bun test framework
- **Storage**: [PocketBase](https://pocketbase.io)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

**Development Requirements:**
- Follow TDD methodology (write tests first!)
- Maintain 80%+ test coverage
- Use Biome for linting/formatting
- Follow conventional commits

## 📝 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2025 [Adam Gąsowski](https://github.com/gander)

## 🔗 Links

- **Repository**: https://github.com/gander-tools/n8n-backup
- **Issues**: https://github.com/gander-tools/n8n-backup/issues
- **NPM Package**: https://www.npmjs.com/package/@gander-tools/n8n-backup
- **Author**: [Adam Gąsowski (@gander)](https://github.com/gander)
- **Organization**: [Gander Tools](https://github.com/gander-tools)

## 📚 Documentation

- [Product Requirements Document (PRD)](.claude/PRD.md)
- [Test Guide](tests/README.md)
- [Claude Code Guide](CLAUDE.md)
- [n8n API Documentation](https://docs.n8n.io/api/api-reference)

## 🎯 Roadmap

- [x] MVP: Backup and restore commands
- [ ] Sync command with merge strategies
- [ ] Selective backup (filter by ID, tags, date)
- [ ] Differential backup (track changes)
- [ ] Advanced output formats (JSON, CI mode)
- [ ] Retention policies and cleanup command
- [ ] Encryption and signing (GPG/KMS)

## 💬 Support

If you encounter any issues or have questions:

1. Check the [documentation](.claude/PRD.md)
2. Search [existing issues](https://github.com/gander-tools/n8n-backup/issues)
3. Open a [new issue](https://github.com/gander-tools/n8n-backup/issues/new)

---

**Built with ❤️ using Test-Driven Development**
