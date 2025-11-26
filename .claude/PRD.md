# PRD: n8n-backup

## 1. Product Overview

**Project name:** n8n-backup  
**NPM package:** @gander-tools/n8n-backup  
**License:** GNU GPL 3  
**Repo:** https://github.com/gander-tools/n8n-backup  
**Runtime:** Bun >=1.3, TypeScript >=5.9  
**Distribution:** Public, free for anyone

A CLI utility in TypeScript for Bun, enabling full backup and restore of n8n workflows, credentials, and tags via REST API only. Backups are stored in PocketBase, with strict versioning. Every operation generates a full audit and metadata report. Designed for cross-env use with minimal requirements.

---

## 2. MVP Functional Requirements

### 2.1 Main Commands

#### n8n-backup backup
- Full snapshot via REST API from n8n (workflows, credentials, tags, audit)
- Persisted in PocketBase: every backup creates a new record in `versions` and domain tables referenced by `version_id`
- Generates per-object reports (`workflow_report`, `credential_report`, `tag_report`) with status, message, and skip reason if any
- Always triggers a corresponding audit record
- JSON summary report per operation (version_report_summary)

#### n8n-backup restore <version_id>
- Restores data from a selected version (from `versions`) to target n8n instance
- Strict minor version match between n8n source/target required; if mismatch, operation aborts (no changes)
- Always runs with ignore-errors (never hard-fails; all errors/objects skipped are reported)
- Per-object reports for restored/skipped/errored items
- Updates version_report_summary and new audit record

#### n8n-backup sync --sourceprofile --targetprofile [--backup]
- Performs both backup from source profile and restore into target profile as a single operation (same logic/validation as restore)
- Sync uses same minor version compatibility check
- Source profile is authoritative; conflicts resolved as in restore (by strategy)
- Optionally supports --backup to create snapshot before sync
- All errors/operations always reported (never fails hard)

### 2.2 Data Storage

- All data stored in PocketBase
- Version table: metadata, run config, summary, metrics
- Domain tables: workflows, credentials, tags, audit, profiles
- Per-object report fields in workflows, credentials, tags (status, message, skip reason)
- Audit table: always updated per backup/restore/sync

### 2.3 Profiles

- Profiles stored as records in PocketBase (`profiles`)
- Each has URL, API Key (encrypted), display name, default flag
- CLI: `--profile <id|name>` for explicit selection, fallback to default
- Always at least one profile required, only one default allowed

### 2.4 Reporting

- Central JSON version_report_summary: operation, status, timestamp, metrics (records processed/skipped/created/updated/errors/warnings, apiRequests, apiRetries, averageResponseTime etc.)
- Per-object detailed reports (workflow_report, credential_report, tag_report): resource type, ID, status, message, skip reason
- All skipped/errored objects are recorded

---

## 3. Data Model PocketBase

### 3.1 Table Structure

- **versions:** uuid, timestamp, profile, run config, summary metrics, options
- **workflows:** version_id, workflow_id, workflow_data, workflow_report
- **credentials:** version_id, credential_id, credential_data, credential_report
- **tags:** version_id, tag_id, tag_data, tag_report
- **audits:** version_id, audit_data
- **profiles:** uuid, name, url, api_key (encrypted), default flag

All tables indexed by version_id as foreign key except `profiles`.

---

## 4. Process Flow

1. Read profile from PocketBase (by flag or default)
2. Create new backup version record (metadata)
3. Fetch workflows, credentials, tags, audit from n8n API
4. Write data (domain tables) in PocketBase with version_id
5. Record per-object skip/errored reports
6. Update central version_report_summary
7. Always write audit

Restore: Read version records from PocketBase and push to n8n via REST, validate minor version/ignore-errors, always update reports/audit.

Sync: Backup from source profile, restore to target profile. Minor version must match, skip/errored tracked and reported identically.

---

## 5. Architecture / code structure

Layered code:  
- **commands:** CLI entry points (backup.ts, restore.ts, sync.ts)  
- **services:** Business logic – api-client, pocketbase-client, config, backup.service, restore.service, audit.service, report.service  
- **types:** TypeScript structure – config, pocketbase, n8n, report  
- **tests/unit:** Fast unit tests (no external dependencies)  
- **tests/integration:** Run against Dockerized n8n/PocketBase

Mandatory architecture: No browser integration, no deprecated APIs, all code TypeScript (Node.js/Bun only).

---

## 6. Non-functional Requirements

- **Runtime:** Bun >=1.3
- **Language:** TypeScript >=5.9
- **Lint/format:** Biome (linter and formatter) mandatory local + CI
- **Testing:** bun test, min 80% test coverage; unit + integration; happy/sad/edge paths
- **CI/CD:** Steps – lint, format-check, test w/coverage, build, release (GitHub + npm) on git tag
- **Semantic versioning:** MAJOR.MINOR.PATCH; automatic binary/npm publishing
- **Git hooks:** Lefthook (local only) for format, lint, tests (not in CI/CD)

---

## 7. Disclaimer

No built-in security or encryption beyond passworded/encrypted credentials in PocketBase.  
User is fully responsible for:  
- Securely storing config and API keys  
- PocketBase access control  
- Preventing unauthorized access  
- Data protection compliance

---

## 8. Test Workflow

- bun install dependencies  
- biome lint/format  
- bun test (unit/integration, min 80%)  
- bun build  
- Commit via lefthook (format/lint/test enforced)  
- release via git tag (CI auto-publish)

---

## 9. Restore Scenarios

### 9.1 Version Validation

Restore only proceeds when n8n minor version matches exactly.  
If mismatch, abort and exit; no data modified.

### 9.2 Always Ignore Errors

All operations run in ignore-errors mode:  
- Errors are reported (never kill operation mid-run)
- Skipped objects have recorded IDs and reasons
- All errors/warnings are tallied in version_report_summary

---

## 10. Minimum PocketBase Specification

- Tables: versions, workflows, credentials, tags, audits, profiles
- App requires CRUD access to all tables
- Credentials must be encrypted in PocketBase
- Access configured via config.json

---

## 11. Acceptance Criteria for MVP

- Working backup and restore commands; sync in future phases
- PocketBase tables match schema above
- n8n version validation and error reporting
- Profiles via PocketBase, --profile and default support
- Test coverage >= 80%, lint/format passed in CI
- Lefthook hooks for local dev only
- Visible disclaimer (README, --help, startup)
- Documentation: README.md, CONTRIBUTING.md, PocketBase schema
- Semantic versioning, auto-release for npm/GitHub

---

## 12. Planned Extensions / Future Roadmap

### 12.1 Sync Command

- Sync = full backup from source profile + restore to target in one step
- Strict minor version validation applies (like restore)
- Source profile is authoritative for conflicts
- CLI will allow selection of merge strategies in future (source-wins, target-wins, update-existing, add-missing, only-selected)
- Try-dry-run mode (`sync --dry-run`) required for safe planning (full report, no data changed)

### 12.2 Selective Backup

- Future flags for selective backup: filter by ID, tags, date range
- Use cases: only update existing, only create missing, only backup specified IDs/tags, sandbox migrations.

### 12.3 Differential Backup

- Diff always calculated against last full backup version  
- Central diff report: added/updated/removed objects, referenced by type + ID

### 12.4 Advanced Output / UX

- Profile for CI (`--ci`): no color, progress bar, JSON logs for easy parsing  
- Default profile: human-centric, colors, readable progress, clean summary  
- Output configuration planned; future web UI (based on PocketBase data)

### 12.5 Logging Levels

- Configurable log-level for CLI and PocketBase/audit separately  
- Lower log-level in CLI does **not** truncate reports/audits in PocketBase (audit always complete for retrospective analysis)

### 12.6 Retention Policy

- MVP: keep last X versions or unlimited  
- Future: configurable retention, per global/per-profile  
- Policy will be stored in config; CLI `cleanup` command for manual purge  
- No auto-cleanup; deletion is always explicit to protect backups

### 12.7 Cleanup Command

- Only manual, explicit cleanup via command (e.g. `n8n-backup cleanup`)  
- No loose records deleted during backup/restore/sync

### 12.8 Security Considerations

- No recommendations enforced; current state is "user fully responsible"
- No best practices section
- Strict disclaimer – all ops at user's risk, credentials are encrypted in base, but all API/data management outside scope

### 12.9 Encryption and Signing

- Extending backup tool to support encryption/signing of backup sets (e.g. GPG or cloud KMS integration) is a top priority after MVP  
- Future roadmap will specify compatible schema upfront to avoid breaking changes later

---

## 13. References

1. n8n API Documentation: https://docs.n8n.io/api/api-reference  
2. Bun.sh Documentation: https://bun.com/docs  
3. TypeScript: https://www.typescriptlang.org  
4. Biome: https://biomejs.dev  
5. Lefthook: https://lefthook.dev  
6. GNU GPL 3 License: https://www.gnu.org/licenses/gpl-3.0.html  
7. GitHub Repo: https://github.com/gander-tools/n8n-backup
