# Test Suite - TDD Methodology

This project follows **Test-Driven Development (TDD)** principles with a minimum of **80% test coverage** as specified in the PRD.

## TDD Cycle

We strictly follow the Red-Green-Refactor cycle:

```
┌─────────────────────────────────────────┐
│  1. 🔴 RED: Write a failing test        │
│  2. 🟢 GREEN: Write minimal code to pass│
│  3. 🔵 REFACTOR: Improve the code       │
└─────────────────────────────────────────┘
```

## Test Structure

### Unit Tests (`tests/unit/`)
- **Fast**: Execute in milliseconds
- **Isolated**: No external dependencies
- **Focused**: Test individual functions/classes
- **Coverage**: Aim for 90%+ coverage

### Integration Tests (`tests/integration/`)
- **Realistic**: Test component interactions
- **External Dependencies**: Uses Docker for n8n and PocketBase
- **Slower**: May take seconds to execute
- **Coverage**: Focus on critical paths

## Running Tests

```bash
# Run unit tests (default, fast)
bun test
# or
bun test:unit

# Run with coverage (unit tests)
bun test:coverage

# Run in watch mode (for TDD)
bun test:watch

# Run integration tests (requires PocketBase)
bun test:integration

# Run ALL tests (unit + integration)
bun test:all

# Run ALL tests with coverage
bun test:coverage:all
```

**⚠️ Note:** Default `bun test` runs only unit tests to avoid timeout when PocketBase is not running.

**📖 For detailed setup instructions, see [TESTING.md](./TESTING.md)**

## Coverage Requirements

As per PRD requirements:
- **Minimum**: 80% test coverage
- **Target**: 90%+ test coverage
- **CI/CD**: Automated coverage reporting

## Test Scenarios

Each feature must have tests for:
- ✅ **Happy path**: Normal, expected usage
- ❌ **Sad path**: Error handling and edge cases
- 🔍 **Edge cases**: Boundary conditions and special inputs

## Example TDD Workflow

1. **Write Test First**
   ```typescript
   test('should backup workflows', () => {
     const result = backupWorkflows(config);
     expect(result.success).toBe(true);
   });
   ```

2. **Run Test (Should Fail)**
   ```bash
   bun test
   # ❌ backupWorkflows is not defined
   ```

3. **Write Minimal Implementation**
   ```typescript
   function backupWorkflows(config: Config): Result {
     return { success: true };
   }
   ```

4. **Run Test (Should Pass)**
   ```bash
   bun test
   # ✅ All tests passed
   ```

5. **Refactor and Improve**
   - Add error handling
   - Improve code structure
   - Add more test cases

## CI/CD Integration

Tests run automatically on every:
- Commit (via Lefthook pre-push hook)
- Push (via GitHub Actions)
- Pull Request

## Best Practices

- Write tests before implementation
- Keep tests simple and readable
- One assertion per test (when possible)
- Use descriptive test names
- Mock external dependencies in unit tests
- Clean up test data after integration tests
- Maintain test independence (no test should depend on another)

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [TDD Best Practices](https://testdriven.io/)
- Project PRD: `.claude/PRD.md`
