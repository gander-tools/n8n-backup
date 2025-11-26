# n8n-backup Development Roadmap

> **Status**: Project in planning phase
>
> This document outlines all planned features and implementation tasks for the n8n-backup CLI utility. Items are listed in a logical dependency order but may be implemented in parallel where possible.

## Overview

This roadmap covers the complete feature set for n8n-backup, a CLI utility for comprehensive backup, restore, and synchronization of n8n workflows, credentials, and tags via REST API. All backups are versioned and stored in PocketBase with full audit trails.

---

## Core Infrastructure

### 1. PocketBase Schema and Setup

**Description**: Design and implement the complete PocketBase database schema to store all backup data, metadata, and audit information.

**Components**:
- `versions` table: Stores backup metadata, timestamps, profile references, run configuration, summary metrics
- `workflows` table: Stores workflow data with `version_id` foreign key, includes per-object report fields
- `credentials` table: Stores encrypted credential data with `version_id` foreign key, includes per-object report fields
- `tags` table: Stores tag data with `version_id` foreign key, includes per-object report fields
- `audits` table: Complete audit trail for all operations, linked by `version_id`
- `profiles` table: n8n instance configurations with encrypted API keys

**Requirements**:
- All tables properly indexed by `version_id` (except `profiles`)
- Credentials must be encrypted at rest in PocketBase
- Support for CRUD operations via PocketBase SDK
- Schema versioning for future migrations

### 2. PocketBase Client Service

**Description**: Build a service layer for all PocketBase interactions, providing CRUD operations and query builders.

**Features**:
- Connection management and authentication
- Create/read/update/delete operations for all tables
- Query builder for complex filtering
- Transaction support where available
- Error handling and retry logic
- Connection pooling and optimization

**Options**:
- `--pb-url <url>`: PocketBase instance URL
- `--pb-auth <token>`: Authentication token/credentials

### 3. n8n API Client Service

**Description**: Implement REST API client for all n8n interactions, handling authentication, retries, and rate limiting.

**Features**:
- Fetch workflows, credentials, tags, and audit data
- Push data during restore operations
- Version detection and compatibility checking
- Rate limiting and throttling
- Retry logic with exponential backoff
- Request/response logging for audit
- Metrics collection (API requests, retries, response times)

**Options**:
- `--api-timeout <ms>`: Request timeout in milliseconds
- `--api-retries <count>`: Maximum retry attempts
- `--api-retry-delay <ms>`: Initial retry delay

### 4. Configuration Management

**Description**: Handle all configuration loading, validation, and defaults for CLI operations.

**Features**:
- Load configuration from file, environment variables, and CLI flags
- Configuration validation with clear error messages
- Support for multiple configuration profiles
- Default value resolution
- Configuration file discovery (project root, home directory, etc.)
- Schema validation using TypeScript types

**Configuration file**: `n8n-backup.config.json` or `.n8n-backuprc`

---

## Profile Management System

### 5. Profile Storage and Encryption

**Description**: Implement secure profile management in PocketBase with encrypted API key storage.

**Features**:
- Store n8n instance profiles (URL, API key, name, metadata)
- Encrypt API keys before storage
- Support for multiple profiles
- One default profile required, only one allowed
- Profile validation and health checks

**Data fields**:
- `id`: Unique identifier (UUID)
- `name`: Display name (unique)
- `url`: n8n instance URL
- `api_key`: Encrypted API key
- `is_default`: Default profile flag
- `created_at`, `updated_at`: Timestamps
- `metadata`: Additional JSON metadata

### 6. Profile Management Commands

**Description**: CLI commands for managing n8n instance profiles.

**Command**: `n8n-backup profiles <subcommand>`

**Subcommands**:

#### `profiles add`
Create a new profile.

**Options**:
- `--name <name>`: Profile name (required)
- `--url <url>`: n8n instance URL (required)
- `--api-key <key>`: API key (required, will be encrypted)
- `--set-default`: Set as default profile
- `--metadata <json>`: Additional metadata

#### `profiles list`
List all configured profiles.

**Options**:
- `--format <format>`: Output format (table, json, yaml)
- `--show-urls`: Display instance URLs

#### `profiles show <name>`
Display detailed information about a profile.

**Options**:
- `--show-key`: Display decrypted API key (requires confirmation)

#### `profiles update <name>`
Update an existing profile.

**Options**:
- `--name <new-name>`: Rename profile
- `--url <url>`: Update URL
- `--api-key <key>`: Update API key
- `--metadata <json>`: Update metadata

#### `profiles delete <name>`
Delete a profile.

**Options**:
- `--force`: Skip confirmation prompt

#### `profiles set-default <name>`
Set a profile as the default.

#### `profiles test <name>`
Test profile connectivity and API access.

**Output**:
- Connection status
- n8n version detected
- API access verification
- Available resources count

---

## Backup Functionality

### 7. Basic Backup Command

**Description**: Core backup functionality to create full snapshots of n8n instance data.

**Command**: `n8n-backup backup`

**Features**:
- Fetch all workflows via n8n REST API
- Fetch all credentials via n8n REST API
- Fetch all tags via n8n REST API
- Fetch audit data if available
- Create new version record in PocketBase
- Store all data with `version_id` reference
- Generate per-object reports
- Create audit record for the operation
- Generate comprehensive summary report

**Options**:
- `--profile <name>`: Profile to use (default: default profile)
- `--output <dir>`: Directory for JSON report output
- `--verbose`: Enable detailed logging
- `--dry-run`: Preview operation without saving data

**Output**:
- New `version_id` created
- Count of workflows, credentials, tags backed up
- Per-object status reports
- Operation metrics (duration, API calls, etc.)
- JSON summary report

### 8. Backup Validation and Error Handling

**Description**: Validate backup data integrity and handle errors gracefully.

**Features**:
- Validate JSON structure from n8n API
- Check for required fields in workflows/credentials/tags
- Detect and report API errors
- Continue on individual object failures (never fail mid-operation)
- Track skipped objects with reasons
- Generate detailed error reports
- Rollback version record if critical failure occurs

**Error categories**:
- API connection errors
- Authentication failures
- Malformed data responses
- Rate limiting
- Timeout errors
- Partial data errors

### 9. Backup Metadata and Metrics

**Description**: Collect and store comprehensive metadata about each backup operation.

**Metadata fields**:
- `version_id`: Unique version identifier (UUID)
- `profile_id`: Source profile reference
- `timestamp`: Backup creation time (ISO 8601)
- `n8n_version`: Source n8n version (full semver)
- `cli_version`: n8n-backup CLI version
- `run_config`: Command options used (JSON)
- `duration_ms`: Total operation duration
- `api_requests`: Total API calls made
- `api_retries`: Total retry attempts
- `average_response_time_ms`: Average API response time

**Metrics tracked**:
- `workflows_total`: Total workflows found
- `workflows_backed_up`: Successfully backed up
- `workflows_skipped`: Skipped with reason
- `workflows_errors`: Failed with errors
- `credentials_total`, `credentials_backed_up`, etc.
- `tags_total`, `tags_backed_up`, etc.
- `warnings_count`: Non-critical warnings
- `errors_count`: Critical errors encountered

### 10. Per-Object Report Generation

**Description**: Generate detailed status reports for each backed up object.

**Report fields** (for workflows, credentials, tags):
- `resource_type`: Object type (workflow, credential, tag)
- `resource_id`: n8n object ID
- `status`: Operation status (success, skipped, error)
- `message`: Human-readable status message
- `skip_reason`: Reason if skipped (empty, error, validation_failed, duplicate, etc.)
- `error_details`: Full error information if failed
- `timestamp`: When operation occurred

**Storage**: Reports stored as JSON in respective table columns (`workflow_report`, `credential_report`, `tag_report`)

---

## Restore Functionality

### 11. Basic Restore Command

**Description**: Restore data from a specific backup version to a target n8n instance.

**Command**: `n8n-backup restore <version_id>`

**Features**:
- Load version data from PocketBase
- Validate n8n version compatibility
- Fetch workflows, credentials, tags for the version
- Push data to target n8n instance via REST API
- Always run in ignore-errors mode
- Generate per-object reports
- Update version metadata with restore information
- Create audit record

**Options**:
- `--profile <name>`: Target profile (default: default profile)
- `--dry-run`: Preview changes without applying
- `--verbose`: Enable detailed logging
- `--output <dir>`: Directory for report output

**Requirements**:
- Exact minor version match between source and target n8n
- If version mismatch: abort operation, no data modified
- Continue on individual object failures
- Report all skipped/errored objects

### 12. Version Validation

**Description**: Strict version compatibility checking before restore operations.

**Validation rules**:
- Compare `n8n_version` from backup metadata with target instance version
- Require exact minor version match (e.g., 1.2.x matches 1.2.y)
- Major version must match exactly
- Patch version can differ
- Abort if mismatch detected

**Version check process**:
1. Fetch target n8n version via API
2. Parse semver from backup metadata
3. Compare major and minor versions
4. If mismatch: display error, exit with code 1
5. If match: proceed with restore

**Error messages**:
- Clear explanation of version mismatch
- Source and target versions displayed
- Recommended actions (update n8n, use different backup)

### 13. Restore Conflict Resolution

**Description**: Handle conflicts when restoring data to an instance with existing workflows/credentials/tags.

**Default strategy**: Source-wins (authoritative backup)

**Conflict scenarios**:
- Object exists with same ID: Update existing object
- Object doesn't exist: Create new object
- Object exists with different data: Overwrite with backup data
- Object in target but not in backup: Leave unchanged

**Options**:
- `--strategy <strategy>`: Conflict resolution strategy (future feature)
  - `source-wins`: Backup data overwrites target (default)
  - `target-wins`: Keep target data, skip backup object
  - `update-existing`: Only update existing objects
  - `add-missing`: Only create new objects
  - `merge`: Attempt intelligent merge (complex)

### 14. Restore Error Handling

**Description**: Always-on error handling that never fails mid-operation.

**Error handling rules**:
- Never hard-fail during restore operation
- Continue processing remaining objects on failure
- Track all errors with full details
- Generate per-object error reports
- Update summary metrics with error counts
- Complete operation even with errors

**Error categories**:
- API authentication failures
- Network/connection errors
- Rate limiting
- Validation errors
- Permission errors
- Data format errors

**Error reporting**:
- Per-object status (success, skipped, error)
- Error messages and stack traces
- Timestamp of failure
- Full context for debugging

### 15. Restore Metrics and Reporting

**Description**: Comprehensive reporting for restore operations.

**Metrics tracked**:
- `objects_total`: Total objects to restore
- `objects_restored`: Successfully restored
- `objects_updated`: Existing objects updated
- `objects_created`: New objects created
- `objects_skipped`: Skipped with reason
- `objects_errors`: Failed with errors
- `duration_ms`: Total operation duration
- `api_requests`: API calls made
- `api_retries`: Retry attempts

**Reports generated**:
- Per-object status reports
- Summary JSON report
- Audit record
- Console output with progress

---

## Sync Functionality

### 16. Basic Sync Command

**Description**: Combined backup and restore operation between two profiles.

**Command**: `n8n-backup sync --source <profile> --target <profile>`

**Features**:
- Backup from source profile
- Restore to target profile
- Single atomic operation
- Version validation between source and target
- Same ignore-errors behavior as restore
- Comprehensive reporting

**Options**:
- `--source <name>`: Source profile (required, authoritative)
- `--target <name>`: Target profile (required)
- `--backup`: Create backup of target before sync
- `--dry-run`: Preview operation without changes
- `--verbose`: Detailed logging
- `--output <dir>`: Report output directory

**Process flow**:
1. Validate both profiles exist
2. Create backup from source
3. Validate version compatibility with target
4. Optionally backup target (if `--backup` flag)
5. Restore source backup to target
6. Generate comprehensive reports
7. Create audit records for both operations

### 17. Sync with Pre-Backup

**Description**: Create safety backup of target instance before sync.

**Flag**: `--backup`

**Behavior**:
- Before restoring to target, create full backup of target
- New version record created for target backup
- If sync fails, target backup available for rollback
- Both backups (source and target) tracked in audit

**Use case**: Safe synchronization with ability to rollback

### 18. Sync Merge Strategies

**Description**: Advanced conflict resolution strategies for sync operations.

**Options**:
- `--strategy <strategy>`: Merge strategy (default: source-wins)
  - `source-wins`: Source is authoritative, overwrites target
  - `target-wins`: Keep target data, skip source changes
  - `update-existing`: Only update objects that exist in both
  - `add-missing`: Only add objects missing in target
  - `merge-smart`: Intelligent merge based on timestamps (complex)
  - `manual`: Generate conflict report, require manual resolution

**Conflict detection**:
- Compare object IDs between source and target
- Detect modifications (different data, same ID)
- Identify additions (in source, not in target)
- Identify deletions (in target, not in source)

**Future enhancement**: Interactive conflict resolution

### 19. Sync Dry-Run Mode

**Description**: Preview sync operation without making changes.

**Flag**: `--dry-run`

**Features**:
- Simulate complete sync operation
- Generate full report of planned changes
- Show conflicts and resolution decisions
- Display metrics and object counts
- No data modified in target
- No version records created
- Useful for planning and validation

**Report includes**:
- Objects to be created
- Objects to be updated
- Objects to be skipped
- Conflicts detected
- Estimated operation duration

---

## Reporting and Auditing

### 20. Comprehensive Audit System

**Description**: Complete audit trail for all operations stored in PocketBase.

**Audit record fields**:
- `audit_id`: Unique identifier (UUID)
- `version_id`: Reference to version (if applicable)
- `operation_type`: backup, restore, sync, profile_create, etc.
- `profile_id`: Profile involved (source/target)
- `timestamp`: Operation timestamp (ISO 8601)
- `user`: User who ran operation (system user)
- `cli_version`: n8n-backup version
- `command`: Full CLI command executed
- `options`: Command options (JSON)
- `status`: success, partial_success, failed
- `duration_ms`: Operation duration
- `metrics`: Operation metrics (JSON)
- `errors`: Error summary (JSON)
- `warnings`: Warning summary (JSON)

**Audit triggers**:
- Every backup operation
- Every restore operation
- Every sync operation
- Profile creation/modification/deletion
- Configuration changes
- Cleanup operations

### 21. Version Report Summary

**Description**: Central JSON summary report for each backup/restore/sync operation.

**Report structure**:
```json
{
  "version_id": "uuid",
  "operation": "backup|restore|sync",
  "status": "success|partial_success|failed",
  "timestamp": "ISO 8601",
  "profile": {
    "id": "uuid",
    "name": "profile name",
    "url": "n8n instance URL"
  },
  "n8n_version": "semver",
  "cli_version": "semver",
  "duration_ms": 1234,
  "metrics": {
    "workflows": {
      "total": 10,
      "processed": 10,
      "created": 5,
      "updated": 3,
      "skipped": 1,
      "errors": 1
    },
    "credentials": { /* same structure */ },
    "tags": { /* same structure */ },
    "api": {
      "requests": 25,
      "retries": 2,
      "average_response_time_ms": 150
    }
  },
  "warnings": [
    {
      "message": "Warning description",
      "details": "Additional context"
    }
  ],
  "errors": [
    {
      "message": "Error description",
      "details": "Full error information"
    }
  ]
}
```

**Storage**:
- Stored in PocketBase `versions` table
- Written to disk as JSON file (if `--output` specified)
- Displayed in console (formatted)

### 22. Console Output Formatting

**Description**: Human-readable progress and summary display in terminal.

**Features**:
- Real-time progress indicators
- Color-coded status messages (success=green, warning=yellow, error=red)
- Progress bars for long operations
- Summary tables with metrics
- ASCII art for visual separation
- Responsive layout for different terminal widths

**Output modes**:
- `--verbose`: Detailed per-object logging
- Default: Summary with progress
- `--quiet`: Minimal output (errors only)
- `--ci`: CI-friendly output (no colors, machine-readable)

### 23. JSON Report Export

**Description**: Export detailed reports as JSON files for external processing.

**Flag**: `--output <directory>`

**Files generated**:
- `version-summary-{version_id}.json`: Central summary report
- `workflows-report-{version_id}.json`: Per-workflow details
- `credentials-report-{version_id}.json`: Per-credential details
- `tags-report-{version_id}.json`: Per-tag details
- `audit-{version_id}.json`: Full audit record

**Use cases**:
- Integration with external monitoring systems
- Custom reporting and analytics
- Compliance and audit requirements
- CI/CD pipeline integration

---

## Selective Backup Features

### 24. Filter by Object IDs

**Description**: Backup only specific workflows, credentials, or tags by ID.

**Options**:
- `--workflow-ids <id,id,...>`: Comma-separated workflow IDs
- `--credential-ids <id,id,...>`: Comma-separated credential IDs
- `--tag-ids <id,id,...>`: Comma-separated tag IDs

**Example**:
```bash
n8n-backup backup --workflow-ids wf1,wf2,wf3 --profile prod
```

**Behavior**:
- Only specified objects are backed up
- Dependencies (credentials used by workflows) automatically included
- Warning if specified ID not found
- Report shows filtered vs total counts

### 25. Filter by Tags

**Description**: Backup workflows that have specific tags.

**Options**:
- `--tags <tag,tag,...>`: Comma-separated tag names
- `--tag-match <mode>`: Tag matching mode
  - `any`: Workflow has any of the specified tags (default)
  - `all`: Workflow has all specified tags
  - `exact`: Workflow has exactly these tags (no more, no less)

**Example**:
```bash
n8n-backup backup --tags production,critical --tag-match all
```

**Behavior**:
- Filter workflows by tag presence
- Include all credentials used by filtered workflows
- Include the tags themselves
- Report shows filter criteria and match counts

### 26. Filter by Date Range

**Description**: Backup workflows modified within a specific date range.

**Options**:
- `--modified-after <date>`: ISO 8601 date or relative (e.g., "7d", "2024-01-01")
- `--modified-before <date>`: ISO 8601 date or relative
- `--created-after <date>`: Filter by creation date
- `--created-before <date>`: Filter by creation date

**Example**:
```bash
n8n-backup backup --modified-after 7d --profile prod
```

**Relative date formats**:
- `7d`: 7 days ago
- `2w`: 2 weeks ago
- `3m`: 3 months ago
- `1y`: 1 year ago

**Behavior**:
- Filter based on n8n metadata timestamps
- Include dependent credentials
- Report shows date range and match counts

### 27. Filter by Workflow Status

**Description**: Backup only active or inactive workflows.

**Options**:
- `--workflow-status <status>`: Filter by status
  - `active`: Only active workflows
  - `inactive`: Only inactive workflows
  - `all`: All workflows (default)

**Example**:
```bash
n8n-backup backup --workflow-status active
```

### 28. Combined Filters

**Description**: Support combining multiple filters with AND/OR logic.

**Options**:
- `--filter-mode <mode>`: How to combine filters
  - `and`: All filters must match (default)
  - `or`: Any filter can match

**Example**:
```bash
n8n-backup backup \
  --tags production \
  --modified-after 30d \
  --workflow-status active \
  --filter-mode and
```

**Behavior**:
- Apply filters in order
- Track filter match statistics
- Report shows filter pipeline and results

### 29. Selective Restore

**Description**: Restore only specific objects from a backup version.

**Options**:
- `--workflow-ids <id,id,...>`: Restore only these workflows
- `--credential-ids <id,id,...>`: Restore only these credentials
- `--tag-ids <id,id,...>`: Restore only these tags
- `--include-dependencies`: Auto-include required credentials (default: true)

**Example**:
```bash
n8n-backup restore <version_id> --workflow-ids wf1,wf2 --profile staging
```

**Use cases**:
- Restore single workflow to production
- Selective migration between environments
- Disaster recovery of specific components

---

## Differential Backup

### 30. Differential Backup Detection

**Description**: Calculate and store differences between current state and last backup.

**Command**: `n8n-backup backup --differential`

**Features**:
- Compare current n8n state with last full backup
- Detect added, modified, and removed objects
- Store only changes (with reference to full backup)
- Generate differential report

**Diff detection logic**:
- Compare object IDs: new IDs = added
- Compare object data: same ID, different data = modified
- Missing IDs: in last backup but not current = removed

**Storage**:
- Full backup always stored
- Diff metadata stored in version record
- Diff report generated and stored

### 31. Differential Report

**Description**: Detailed report of changes between backups.

**Report structure**:
```json
{
  "base_version_id": "uuid",
  "current_version_id": "uuid",
  "timestamp": "ISO 8601",
  "summary": {
    "workflows": {
      "added": 2,
      "modified": 5,
      "removed": 1,
      "unchanged": 10
    },
    "credentials": { /* same */ },
    "tags": { /* same */ }
  },
  "changes": [
    {
      "resource_type": "workflow",
      "resource_id": "wf123",
      "change_type": "modified",
      "changes": [
        {
          "field": "nodes",
          "old_value": "...",
          "new_value": "..."
        }
      ]
    }
  ]
}
```

**Use cases**:
- Track workflow evolution over time
- Identify what changed between versions
- Audit trail for compliance
- Troubleshooting after changes

### 32. Restore from Differential

**Description**: Restore using differential backup with automatic base resolution.

**Command**: `n8n-backup restore <diff_version_id> --use-differential`

**Process**:
1. Load differential version metadata
2. Identify base version reference
3. Load base version data
4. Apply differential changes
5. Restore merged result to target

**Requirements**:
- Base version must exist in PocketBase
- Differential version must reference valid base
- Version compatibility checked for both versions

---

## Advanced Output and UX

### 33. CI-Friendly Output Mode

**Description**: Machine-readable output optimized for CI/CD pipelines.

**Flag**: `--ci`

**Features**:
- No colored output (plain text)
- No progress bars or interactive elements
- Structured JSON logs
- Predictable exit codes
- Consistent format for parsing
- Timestamps on all messages

**Exit codes**:
- `0`: Success
- `1`: Failure (errors, version mismatch, etc.)
- `2`: Partial success (some objects failed)
- `3`: Configuration error
- `4`: Connection error

**Example output**:
```json
{"level":"info","timestamp":"2025-01-15T10:30:00Z","message":"Starting backup operation"}
{"level":"info","timestamp":"2025-01-15T10:30:01Z","message":"Fetching workflows","count":10}
{"level":"warn","timestamp":"2025-01-15T10:30:02Z","message":"Workflow skipped","id":"wf123","reason":"validation_failed"}
{"level":"info","timestamp":"2025-01-15T10:30:10Z","message":"Backup completed","version_id":"uuid"}
```

### 34. Interactive Mode

**Description**: Interactive prompts for user-friendly operation.

**Features**:
- Interactive profile selection
- Confirmation prompts for destructive operations
- Progress indicators with ETA
- Real-time statistics display
- Color-coded status messages
- Helpful hints and suggestions

**Prompts**:
- Profile selection menu
- Confirmation before restore
- Conflict resolution choices (future)
- Cleanup confirmation

**UI elements**:
- Spinners for API calls
- Progress bars for batch operations
- Summary tables
- ASCII art headers

### 35. Multiple Output Formats

**Description**: Support various output formats for reports.

**Option**: `--format <format>`

**Supported formats**:
- `json`: Machine-readable JSON (default for `--ci`)
- `yaml`: Human-readable YAML
- `table`: ASCII table format (default for terminal)
- `csv`: Comma-separated values (for metrics)
- `html`: HTML report with styling (future)

**Example**:
```bash
n8n-backup backup --format yaml --output ./reports
```

**Per-format features**:
- JSON: Complete data, parseable
- YAML: Human-readable, hierarchical
- Table: Console-friendly, aligned columns
- CSV: Excel-compatible, metrics only

### 36. Progress Tracking and ETA

**Description**: Real-time progress indicators with estimated time remaining.

**Features**:
- Progress percentage for batch operations
- ETA calculation based on current throughput
- Speed metrics (objects/second)
- Elapsed time display
- Visual progress bars

**Display modes**:
- Spinner: For indeterminate operations
- Progress bar: For batch processing
- Multi-line progress: For parallel operations

**Example output**:
```
Backing up workflows... ████████░░ 80% (8/10) | ETA: 5s | 2.5 obj/s
```

---

## Logging System

### 37. Configurable Log Levels

**Description**: Fine-grained control over CLI logging verbosity.

**Option**: `--log-level <level>`

**Levels**:
- `debug`: Detailed debugging information (very verbose)
- `info`: General informational messages (default)
- `warn`: Warning messages only
- `error`: Error messages only
- `silent`: No output (except critical errors)

**Example**:
```bash
n8n-backup backup --log-level debug
```

**Behavior**:
- Log level affects CLI output only
- Audit records always contain full information
- PocketBase data always complete regardless of log level

### 38. Structured Logging

**Description**: JSON-structured logs for machine parsing and analysis.

**Flag**: `--structured-logs`

**Format**:
```json
{
  "level": "info",
  "timestamp": "2025-01-15T10:30:00.123Z",
  "operation": "backup",
  "version_id": "uuid",
  "message": "Workflow backed up successfully",
  "context": {
    "workflow_id": "wf123",
    "workflow_name": "My Workflow",
    "duration_ms": 150
  }
}
```

**Use cases**:
- Integration with log aggregation systems (ELK, Splunk)
- Automated monitoring and alerting
- Performance analysis
- Debugging in production environments

### 39. Log File Output

**Description**: Write logs to file in addition to console.

**Option**: `--log-file <path>`

**Features**:
- Append mode (doesn't overwrite existing logs)
- Automatic log rotation (size-based or time-based)
- Separate log files per operation (optional)
- Configurable log format for files

**Example**:
```bash
n8n-backup backup --log-file /var/log/n8n-backup/backup.log
```

**Log rotation**:
- `--log-max-size <mb>`: Rotate when file exceeds size
- `--log-max-age <days>`: Delete logs older than age
- `--log-max-files <count>`: Keep only N most recent log files

### 40. Separate Audit and CLI Logging

**Description**: Independent logging configuration for CLI output vs audit records.

**Principle**: Lower CLI log level does not truncate audit/PocketBase data.

**CLI logging**:
- Controlled by `--log-level`
- Affects console/file output only
- For user visibility and troubleshooting

**Audit logging**:
- Always complete and detailed
- Stored in PocketBase
- For compliance and retrospective analysis
- Not affected by CLI log level

**Rationale**: Users may want quiet CLI output but still need full audit trails for later investigation.

---

## Retention Policies

### 41. Version Retention Configuration

**Description**: Configure how many backup versions to retain.

**Configuration**:
- Global retention policy (applies to all profiles)
- Per-profile retention policy (overrides global)
- Retention rules:
  - Keep last N versions
  - Keep versions newer than date
  - Keep versions by tag
  - Unlimited (default)

**Config file** (`n8n-backup.config.json`):
```json
{
  "retention": {
    "global": {
      "keep_last": 10,
      "keep_days": 30
    },
    "profiles": {
      "production": {
        "keep_last": 50,
        "keep_days": 90
      }
    }
  }
}
```

**Retention rules evaluation**:
- Keep version if it matches ANY rule (OR logic)
- Most protective rule wins
- Manual cleanup can override policies

### 42. Version Tagging

**Description**: Tag specific versions to protect them from cleanup.

**Command**: `n8n-backup versions tag <version_id> <tag>`

**Features**:
- Tag versions with custom labels
- Protected tags (e.g., "keep", "production", "release")
- List versions by tag
- Search and filter by tag

**Protected tags**:
- `keep`: Never delete automatically
- `milestone`: Important version to preserve
- `release`: Production release backup

**Examples**:
```bash
n8n-backup versions tag <version_id> keep
n8n-backup versions tag <version_id> production-2025-01-15
```

### 43. Automatic Retention Enforcement

**Description**: Automatically apply retention policies during backup operations.

**Flag**: `--auto-cleanup`

**Behavior**:
- After successful backup, evaluate retention policies
- Identify versions eligible for deletion
- Delete versions outside retention window
- Never delete tagged versions
- Generate cleanup report

**Safety measures**:
- Never delete during critical operations
- Always keep most recent version
- Require confirmation for large cleanups
- Log all deletions to audit

---

## Cleanup Functionality

### 44. Manual Cleanup Command

**Description**: Explicitly clean up old backup versions.

**Command**: `n8n-backup cleanup`

**Features**:
- List versions eligible for deletion
- Dry-run mode to preview deletions
- Apply retention policies manually
- Delete specific versions
- Delete by date range
- Protect tagged versions

**Options**:
- `--dry-run`: Preview deletions without removing data
- `--keep-last <count>`: Keep N most recent versions
- `--older-than <date>`: Delete versions older than date
- `--profile <name>`: Clean up specific profile only
- `--force`: Skip confirmation prompts
- `--exclude-tags <tag,tag>`: Don't delete versions with these tags

**Examples**:
```bash
# Preview cleanup
n8n-backup cleanup --dry-run

# Delete versions older than 90 days
n8n-backup cleanup --older-than 90d

# Keep only last 10 versions for production profile
n8n-backup cleanup --profile production --keep-last 10
```

### 45. Orphaned Data Cleanup

**Description**: Detect and clean up orphaned records in PocketBase.

**Command**: `n8n-backup cleanup --orphaned`

**Orphaned data detection**:
- Workflows without valid `version_id`
- Credentials without valid `version_id`
- Tags without valid `version_id`
- Audit records without valid `version_id`

**Safety**:
- Always dry-run first to review orphaned data
- Confirm before deletion
- Export orphaned data before cleanup (optional)
- Log all deletions

### 46. Cleanup Reporting

**Description**: Detailed reports for cleanup operations.

**Report includes**:
- Versions deleted (with IDs and dates)
- Space reclaimed (approximate size)
- Objects removed (workflows, credentials, tags)
- Orphaned records cleaned
- Errors encountered
- Duration of cleanup operation

**Output formats**:
- Console summary
- JSON report (with `--output`)
- Audit record in PocketBase

---

## Version Management

### 47. List Versions Command

**Description**: List all backup versions with filtering and sorting.

**Command**: `n8n-backup versions list`

**Options**:
- `--profile <name>`: Filter by profile
- `--since <date>`: Show versions since date
- `--until <date>`: Show versions until date
- `--tag <tag>`: Filter by tag
- `--status <status>`: Filter by status (success, partial, failed)
- `--format <format>`: Output format (table, json, yaml)
- `--limit <count>`: Limit number of results
- `--sort <field>`: Sort by field (timestamp, size, duration)
- `--order <asc|desc>`: Sort order (default: desc)

**Display fields**:
- Version ID
- Profile name
- Timestamp
- n8n version
- Status
- Object counts (workflows, credentials, tags)
- Duration
- Tags

**Example**:
```bash
n8n-backup versions list --profile prod --since 30d --format table
```

### 48. Show Version Details

**Description**: Display detailed information about a specific version.

**Command**: `n8n-backup versions show <version_id>`

**Options**:
- `--format <format>`: Output format (default: table)
- `--include-reports`: Show per-object reports
- `--include-audit`: Show full audit record

**Information displayed**:
- Version metadata
- Profile information
- n8n version
- CLI version used
- Operation metrics
- Summary statistics
- Warnings and errors
- Per-object reports (if requested)
- Full audit trail (if requested)

### 49. Compare Versions

**Description**: Compare two backup versions to see differences.

**Command**: `n8n-backup versions compare <version_id_1> <version_id_2>`

**Features**:
- Side-by-side comparison
- Detect added/modified/removed objects
- Highlight differences
- Generate diff report

**Output**:
- Summary of differences
- Per-object comparison
- Detailed diff for modified objects
- Export as JSON/HTML report

**Example**:
```bash
n8n-backup versions compare v1 v2 --format html --output diff-report.html
```

### 50. Export Version Data

**Description**: Export backup version data to external formats.

**Command**: `n8n-backup versions export <version_id>`

**Options**:
- `--format <format>`: Export format
  - `json`: Complete JSON export (default)
  - `zip`: Compressed archive with JSON files
  - `tar.gz`: Compressed tarball
  - `sql`: SQL dump (for direct database import)
- `--output <path>`: Output file path
- `--include-reports`: Include per-object reports
- `--include-audit`: Include audit records

**Use cases**:
- Backup to external storage
- Migration to different systems
- Compliance exports
- Disaster recovery

---

## Encryption and Signing

### 51. Backup Encryption

**Description**: Encrypt backup data at rest using GPG or cloud KMS.

**Options**:
- `--encrypt`: Enable encryption
- `--encryption-key <key>`: GPG key ID or KMS key ARN
- `--encryption-method <method>`: Encryption method
  - `gpg`: GPG/PGP encryption (local keys)
  - `kms-aws`: AWS KMS
  - `kms-gcp`: Google Cloud KMS
  - `kms-azure`: Azure Key Vault

**Example**:
```bash
n8n-backup backup --encrypt --encryption-method gpg --encryption-key user@example.com
```

**Encryption scope**:
- All workflow data
- All credential data
- All tag data
- Metadata (optional)

**Key management**:
- Support for multiple recipients (GPG)
- Key rotation support
- Automatic key discovery
- Key validation before encryption

### 52. Backup Signing

**Description**: Cryptographically sign backups to ensure integrity and authenticity.

**Options**:
- `--sign`: Enable signing
- `--signing-key <key>`: GPG key ID for signing
- `--signature-format <format>`: Signature format
  - `detached`: Separate signature file (default)
  - `inline`: Signature included in data
  - `cleartext`: Human-readable signed text

**Example**:
```bash
n8n-backup backup --sign --signing-key user@example.com
```

**Signature verification**:
- Automatic signature verification during restore
- Display signer information
- Warn if signature invalid
- Option to require valid signature (`--require-signature`)

### 53. Encrypted Restore

**Description**: Restore from encrypted backup versions.

**Command**: `n8n-backup restore <version_id>`

**Features**:
- Automatic encryption detection
- Decrypt using configured key
- Support for multiple decryption methods
- Verify signature if present

**Options**:
- `--decryption-key <key>`: Explicit decryption key
- `--require-signature`: Fail if signature missing or invalid
- `--trust-key <key>`: Trust specific signing key

**Key sources**:
- GPG keyring
- Environment variables
- Configuration file
- Interactive prompt

### 54. Key Management Commands

**Description**: Manage encryption and signing keys.

**Command**: `n8n-backup keys <subcommand>`

**Subcommands**:

#### `keys add`
Add encryption/signing key to configuration.

**Options**:
- `--key-id <id>`: Key identifier
- `--key-type <type>`: gpg, kms-aws, kms-gcp, kms-azure
- `--purpose <purpose>`: encrypt, sign, both

#### `keys list`
List configured keys.

#### `keys test <key_id>`
Test key accessibility and validity.

#### `keys remove <key_id>`
Remove key from configuration.

---

## Testing Infrastructure

### 55. Unit Test Suite

**Description**: Comprehensive unit tests for all services and utilities.

**Coverage requirements**:
- Minimum: 80% (enforced in CI/CD)
- Target: 90%+
- All code paths tested (happy, sad, edge cases)

**Test structure**:
- `tests/unit/services/`: Service layer tests
- `tests/unit/utils/`: Utility function tests
- `tests/unit/types/`: Type validation tests

**Testing approach**:
- TDD methodology (write tests first)
- Isolated tests (no external dependencies)
- Mock API calls and PocketBase operations
- Fast execution (< 10 seconds for full suite)

### 56. Integration Test Suite

**Description**: Integration tests using Docker containers for n8n and PocketBase.

**Test scenarios**:
- Full backup and restore cycle
- Sync between profiles
- Version validation
- Error handling
- Profile management
- Cleanup operations

**Test environment**:
- Docker Compose setup with n8n and PocketBase
- Test data fixtures
- Automated setup and teardown
- Isolated test databases

**Execution**:
```bash
bun test:integration
```

### 57. End-to-End Test Suite

**Description**: Full CLI command testing in realistic scenarios.

**Test scenarios**:
- Complete user workflows
- Multi-step operations
- Error recovery
- CLI output validation
- Report generation

**Test approach**:
- Spawn CLI process
- Capture stdout/stderr
- Validate exit codes
- Verify PocketBase data
- Check generated reports

### 58. Test Coverage Reporting

**Description**: Generate and track test coverage metrics.

**Features**:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage
- Coverage trends over time

**Tools**:
- Bun built-in coverage
- HTML coverage reports
- CI/CD integration
- Coverage badges

**Commands**:
```bash
bun test --coverage
bun test:coverage:html
```

---

## CI/CD Pipeline

### 59. Automated Testing in CI

**Description**: Run all tests automatically on every push and pull request.

**GitHub Actions workflow**:
- Install dependencies
- Run format check
- Run linter
- Run type checker
- Run unit tests with coverage
- Run integration tests (if Docker available)
- Upload coverage reports
- Enforce minimum coverage threshold

**Triggers**:
- Push to main branch
- Pull request opened/updated
- Manual workflow dispatch

### 60. Automated Build

**Description**: Build distributable binary on successful tests.

**Build steps**:
- Compile TypeScript to JavaScript
- Bundle dependencies
- Create standalone executable
- Optimize for production
- Generate source maps

**Outputs**:
- Compiled JavaScript in `dist/`
- Standalone binary
- Source maps

**Commands**:
```bash
bun run build
```

### 61. Automated Release

**Description**: Automatically publish new versions on git tag.

**Workflow**:
1. Developer creates git tag (e.g., `v1.2.3`)
2. Push tag to GitHub
3. CI/CD detects tag
4. Run full test suite
5. Build production artifacts
6. Publish to npm
7. Create GitHub release with binaries
8. Generate changelog
9. Update documentation

**Semantic versioning**:
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

**Example**:
```bash
git tag v1.2.3
git push origin v1.2.3
```

### 62. Pre-Commit Hooks (Lefthook)

**Description**: Local git hooks to enforce code quality before commits.

**Hooks configured**:

**pre-commit**:
- Format check (Biome)
- Lint check (Biome)
- Type check (TypeScript)

**pre-push**:
- Run unit tests
- Check test coverage

**Installation**:
```bash
bun run prepare
```

**Behavior**:
- Block commit/push if checks fail
- Provide clear error messages
- Suggest fixes

**Note**: Hooks are local only, not enforced in CI/CD (which has its own steps).

---

## Documentation

### 63. README Documentation

**Description**: Comprehensive README with quick start, usage examples, and feature overview.

**Sections**:
- Project overview
- Features list
- Quick start guide
- Installation instructions
- Basic usage examples
- Command reference
- Architecture overview
- Development setup
- Contributing guidelines
- License information

**Format**: GitHub-flavored Markdown with badges, code examples, and links.

### 64. CLI Help System

**Description**: Built-in help accessible via `--help` flag.

**Features**:
- Command-specific help
- Option descriptions
- Usage examples
- Default values
- Related commands

**Examples**:
```bash
n8n-backup --help
n8n-backup backup --help
n8n-backup restore --help
```

### 65. API Documentation (JSDoc)

**Description**: Complete API documentation for all public functions and types.

**Standards**:
- JSDoc comments for all exported functions
- Type definitions documented
- Parameter descriptions
- Return value descriptions
- Example usage
- Related functions

**Generation**:
- TypeDoc for HTML documentation
- Published to GitHub Pages
- Versioned documentation

### 66. Contributing Guide

**Description**: Guidelines for external contributors.

**File**: `CONTRIBUTING.md`

**Contents**:
- Code of conduct
- How to set up development environment
- TDD workflow
- Code style guidelines
- Commit message conventions
- Pull request process
- Testing requirements
- Documentation requirements

### 67. Changelog

**Description**: Maintain detailed changelog of all versions.

**File**: `CHANGELOG.md`

**Format**: Keep a Changelog standard

**Sections per version**:
- Added: New features
- Changed: Changes to existing features
- Deprecated: Features to be removed
- Removed: Features removed
- Fixed: Bug fixes
- Security: Security fixes

**Generation**: Automated from git commits and PR descriptions.

### 68. Migration Guides

**Description**: Version migration guides for breaking changes.

**Location**: `docs/migrations/`

**Contents**:
- Breaking changes description
- Migration steps
- Code examples (before/after)
- CLI command changes
- Configuration changes
- Troubleshooting

**Naming**: `v1-to-v2.md`, `v2-to-v3.md`, etc.

---

## Additional Features

### 69. Configuration Wizard

**Description**: Interactive setup wizard for first-time users.

**Command**: `n8n-backup init`

**Wizard steps**:
1. Welcome and introduction
2. Check prerequisites (Bun, n8n, PocketBase)
3. Configure PocketBase connection
4. Create first profile
5. Test connectivity
6. Set default profile
7. Configure retention policies (optional)
8. Enable encryption (optional)
9. Create first backup
10. Summary and next steps

**Output**: `n8n-backup.config.json` generated

### 70. Health Check Command

**Description**: Verify system health and configuration.

**Command**: `n8n-backup health`

**Checks performed**:
- PocketBase connectivity
- PocketBase schema validation
- Profile configurations
- n8n instance connectivity (all profiles)
- API key validity
- Disk space for backups
- Permission checks
- Encryption key availability

**Output**:
- Overall health status (healthy, degraded, unhealthy)
- Per-check results
- Warnings and recommendations
- Troubleshooting suggestions

### 71. Shell Completion

**Description**: Auto-completion for Bash, Zsh, Fish shells.

**Command**: `n8n-backup completion <shell>`

**Features**:
- Complete command names
- Complete subcommand names
- Complete option names
- Complete profile names (dynamic)
- Complete version IDs (dynamic)

**Installation**:
```bash
# Bash
n8n-backup completion bash > /etc/bash_completion.d/n8n-backup

# Zsh
n8n-backup completion zsh > ~/.zsh/completion/_n8n-backup

# Fish
n8n-backup completion fish > ~/.config/fish/completions/n8n-backup.fish
```

### 72. Notification System

**Description**: Send notifications on backup/restore completion.

**Options**:
- `--notify <method>`: Notification method
  - `email`: Send email notification
  - `slack`: Post to Slack channel
  - `webhook`: HTTP POST to webhook URL
  - `discord`: Post to Discord channel

**Configuration**:
```json
{
  "notifications": {
    "email": {
      "smtp_host": "smtp.example.com",
      "smtp_port": 587,
      "from": "backup@example.com",
      "to": ["admin@example.com"]
    },
    "slack": {
      "webhook_url": "https://hooks.slack.com/..."
    }
  }
}
```

**Notification triggers**:
- Backup completed
- Restore completed
- Sync completed
- Operation failed
- Warnings threshold exceeded
- Low disk space

### 73. Metrics Export

**Description**: Export operation metrics to monitoring systems.

**Supported systems**:
- Prometheus (metrics endpoint)
- StatsD (UDP metrics)
- InfluxDB (direct write)
- CloudWatch (AWS)

**Metrics exported**:
- Operation duration
- Object counts
- Success/failure rates
- API call metrics
- Error rates
- PocketBase storage usage

**Configuration**:
```json
{
  "metrics": {
    "prometheus": {
      "enabled": true,
      "port": 9090,
      "path": "/metrics"
    }
  }
}
```

### 74. Web UI (Future)

**Description**: Optional web interface for managing backups (built on PocketBase data).

**Features**:
- View all backup versions
- Visualize diff between versions
- Trigger backup/restore operations
- Manage profiles
- Configure retention policies
- View audit logs
- Generate reports

**Technology**:
- SvelteKit (PocketBase native framework)
- Real-time updates via PocketBase realtime
- Authentication via PocketBase auth

**Access**: Optional separate package/deployment

### 75. Scheduled Backups (Cron)

**Description**: Schedule automatic backups using cron syntax.

**Command**: `n8n-backup schedule add`

**Options**:
- `--cron <expression>`: Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
- `--profile <name>`: Profile to backup
- `--options <json>`: Additional backup options

**Examples**:
```bash
# Daily backup at 2 AM
n8n-backup schedule add --cron "0 2 * * *" --profile prod

# Hourly backup during business hours
n8n-backup schedule add --cron "0 9-17 * * *" --profile dev
```

**Implementation**:
- Store schedules in PocketBase
- Background service to execute scheduled backups
- Systemd service or cron integration
- Email notifications on success/failure

---

## Summary

This roadmap represents the complete vision for the n8n-backup CLI utility. Implementation will focus on delivering value incrementally, starting with core backup/restore functionality and progressively adding advanced features based on user feedback and requirements.

**Total Features**: 75 distinct implementation tasks

**Core Priorities**:
1. Infrastructure and data model (items 1-4)
2. Profile management (items 5-6)
3. Basic backup functionality (items 7-10)
4. Basic restore functionality (items 11-15)
5. Reporting and auditing (items 20-23)
6. Testing infrastructure (items 55-58)
7. CI/CD pipeline (items 59-62)
8. Documentation (items 63-68)

**Extended Priorities**:
- Sync functionality (items 16-19)
- Selective backup (items 24-29)
- Differential backup (items 30-32)
- Advanced UX (items 33-36)
- Logging system (items 37-40)
- Retention and cleanup (items 41-46)
- Encryption and signing (items 51-54)
- Additional features (items 69-75)

All features will be developed following strict TDD methodology, maintaining 80%+ test coverage, and adhering to code quality standards enforced by Biome linting and formatting.
