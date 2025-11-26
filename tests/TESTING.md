# Testing Guide

This guide explains how to run unit and integration tests for the n8n-backup project.

## Prerequisites

- **Bun** >= 1.3.0 (install via `npm install -g bun`)
- **PocketBase** (for integration tests only)
- **Docker** (optional, alternative to manual PocketBase setup)

## Quick Start

### Unit Tests

Unit tests run in isolation without external dependencies:

```bash
# Run all unit tests
bun test tests/unit/

# Run with coverage
bun test --coverage tests/unit/

# Watch mode (for TDD)
bun test --watch tests/unit/
```

### Integration Tests

Integration tests require a running PocketBase instance.

## Setting Up PocketBase for Integration Tests

Choose one of the following methods:

### Method 1: Download PocketBase Binary (Recommended)

**For Linux/macOS:**

```bash
# Download latest version
curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip -o pocketbase.zip

# For macOS (Apple Silicon)
# curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_darwin_arm64.zip -o pocketbase.zip

# For macOS (Intel)
# curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_darwin_amd64.zip -o pocketbase.zip

# Extract
unzip pocketbase.zip

# Make executable
chmod +x pocketbase

# Run PocketBase
./pocketbase serve --http=127.0.0.1:8090
```

**For Windows:**

```powershell
# Download from: https://github.com/pocketbase/pocketbase/releases/latest
# Extract pocketbase.exe
# Run:
.\pocketbase.exe serve --http=127.0.0.1:8090
```

**Create Admin Account:**

After starting PocketBase, open http://127.0.0.1:8090/_/ in your browser and create an admin account with:
- Email: `admin@test.local`
- Password: `testpassword123`

Or use the API:

```bash
curl -X POST http://127.0.0.1:8090/api/admins \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "testpassword123",
    "passwordConfirm": "testpassword123"
  }'
```

### Method 2: Docker Compose (Alternative)

If you have Docker installed:

```bash
# Start PocketBase in background
docker compose -f docker-compose.test.yml up -d pocketbase

# Check if it's running
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs -f pocketbase

# Stop when done
docker compose -f docker-compose.test.yml down
```

The Docker setup automatically creates the admin account with the test credentials.

### Method 3: Build from Source (Advanced)

If you have Go installed:

```bash
# Clone PocketBase repository
git clone --depth 1 --branch v0.34.0 https://github.com/pocketbase/pocketbase.git
cd pocketbase

# Build
go build

# Run
./pocketbase serve --http=127.0.0.1:8090
```

## Running Integration Tests

Once PocketBase is running:

```bash
# Run integration tests
bun test tests/integration/

# Run with specific configuration
POCKETBASE_URL=http://localhost:8090 \
POCKETBASE_ADMIN_EMAIL=admin@test.local \
POCKETBASE_ADMIN_PASSWORD=testpassword123 \
bun test tests/integration/
```

## Running All Tests

```bash
# Run both unit and integration tests
bun test

# With coverage
bun test --coverage
```

## Test Configuration

Integration tests use environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `POCKETBASE_URL` | `http://localhost:8090` | PocketBase server URL |
| `POCKETBASE_ADMIN_EMAIL` | `admin@test.local` | Admin email for auth |
| `POCKETBASE_ADMIN_PASSWORD` | `testpassword123` | Admin password |

## Troubleshooting

### PocketBase Connection Fails

**Error:** `PocketBase at http://localhost:8090 did not become ready`

**Solutions:**
1. Verify PocketBase is running: `curl http://localhost:8090/api/health`
2. Check if port 8090 is available: `lsof -i :8090` (Linux/macOS)
3. Make sure admin account exists (see setup instructions above)
4. Check PocketBase logs for errors

### Authentication Fails

**Error:** `PocketBase authentication failed`

**Solutions:**
1. Verify admin credentials match the test configuration
2. Create admin account if it doesn't exist (see setup instructions)
3. Reset PocketBase data: delete `pb_data` directory and recreate admin

### Tests Timeout

**Error:** `beforeEach/afterEach hook timed out`

**Solutions:**
1. Ensure PocketBase is fully started before running tests
2. Increase test timeout if needed
3. Check network connectivity to PocketBase

## Continuous Integration

The project uses GitHub Actions for CI/CD. The workflow:

1. **Pre-commit hooks** (Lefthook):
   - Format check (Biome)
   - Lint (Biome)
   - TypeCheck (TypeScript)

2. **Pre-push hooks** (Lefthook):
   - Unit tests only (integration tests run in CI)

3. **GitHub Actions** (on push/PR):
   - Format check
   - Lint
   - TypeCheck
   - Unit tests with coverage
   - Integration tests with Docker-based PocketBase
   - Build verification

## Test Structure

```
tests/
├── unit/                    # Fast, isolated tests
│   ├── index.test.ts
│   ├── types.test.ts
│   └── pocketbase-client.test.ts
├── integration/             # Tests with external dependencies
│   └── pocketbase-client.test.ts
├── README.md               # TDD methodology
└── TESTING.md             # This file
```

## Writing Tests

Follow TDD principles:

1. **🔴 RED**: Write a failing test first
2. **🟢 GREEN**: Write minimal code to pass
3. **🔵 REFACTOR**: Improve and optimize

See [tests/README.md](./README.md) for detailed TDD guidelines.

## Coverage Requirements

- **Minimum**: 80% (enforced in CI/CD)
- **Target**: 90%+
- Test all paths: happy, sad, and edge cases

Check coverage:

```bash
bun test --coverage
```

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Project PRD](./.claude/PRD.md)
