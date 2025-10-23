# Test Suite for FluentUI Compat Webpack Plugin

This directory contains a comprehensive test suite for the FluentUI Compat Webpack Plugin, emphasizing modern testing patterns and practices.

## Test Structure

### Unit Tests

#### `index.test.ts`
Core unit tests for the `FluentUICompatPlugin` class:
- Constructor initialization and option handling
- Webpack hook registration (both Webpack 4 and 5)
- Import request rewriting logic
- Custom mapping configurations
- Verbose logging behavior
- Edge cases and error handling

#### `importRewriteLoader.test.ts` (in index.test.ts)
Tests for the Babel-based import rewrite loader:
- Mapped vs unmapped import handling
- Import splitting (mixed mapped/unmapped)
- Aliased imports
- Default and namespace imports
- TypeScript support
- Complex multi-import scenarios

### Integration Tests

#### `integration.test.ts`
End-to-end integration tests:
- Multiple import pattern combinations
- Custom mapping configurations
- Edge case scenarios
- Path preservation for relative/absolute imports
- Node core module handling

#### `webpack-compilation.test.ts`
Plugin integration with webpack infrastructure:
- Loader path resolution
- Configuration option passing
- Multiple plugin instances
- File extension matching
- Webpack rule prepending behavior
- Verbose logging integration

### Snapshot Tests

#### `loader-snapshots.test.ts`
Snapshot tests for code transformations:
- Simple and complex import transformations
- Mixed import scenarios
- TypeScript code with type annotations
- JSX/TSX transformations
- Real-world component examples
- Custom mapping snapshots

These snapshots ensure that code transformations remain consistent across changes and provide a visual reference for expected behavior.

### Error Handling Tests

#### `error-handling.test.ts`
Comprehensive error and edge case handling:
- Invalid syntax handling
- Empty/whitespace input
- Malformed imports
- Missing/null options
- Unicode characters
- Performance edge cases
- Large file handling
- TypeScript-specific edge cases

### Smoke Tests

#### `smoke.test.ts`
Basic sanity checks to ensure the test environment is functioning correctly.

## Test Coverage

Current coverage metrics:
- **Statements**: 100%
- **Branches**: 90.76%
- **Functions**: 100%
- **Lines**: 100%

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- index.test.ts

# Run with coverage
npm test -- --coverage

# Update snapshots
npm test -- -u

# Run tests matching a pattern
npm test -- -t "should rewrite"
```

## Modern Testing Patterns Used

### 1. **Snapshot Testing**
Captures exact code transformation output for regression testing. Snapshots are stored in `__snapshots__/` directory.

### 2. **Comprehensive Mocking**
Uses Jest's built-in mocking for:
- Webpack compiler and factory hooks
- Console output for verbose logging tests
- File system operations (where appropriate)

### 3. **Descriptive Test Organization**
Tests are organized with clear describe blocks and descriptive test names that explain both the scenario and expected behavior.

### 4. **Edge Case Coverage**
Extensive testing of edge cases including:
- Empty inputs
- Malformed data
- Unicode characters
- Performance boundaries
- Error conditions

### 5. **Type Safety**
All tests are written in TypeScript with proper type checking enabled, ensuring type safety even in test code.

### 6. **Modern Jest APIs**
- Uses Jest 30.x APIs
- Proper cleanup with `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
- `clearMocks`, `resetMocks`, `restoreMocks` enabled in config
- No legacy fake timers

### 7. **Performance Testing**
Includes basic performance assertions to ensure the plugin remains fast even with large inputs or many mappings.

### 8. **Documentation**
Each test file includes JSDoc comments explaining the purpose and scope of the tests.

## Test Data

### Fixtures
Test fixtures (when needed) are created dynamically in tests and cleaned up afterwards to avoid polluting the repository.

### Snapshots
Snapshot files are committed to the repository and should be reviewed carefully when updated.

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Add unit tests** for new functions/methods
3. **Add integration tests** for new workflows
4. **Add snapshot tests** if code transformation is involved
5. **Test error cases** - ensure graceful handling
6. **Update this README** if adding new test categories

## Testing Philosophy

This test suite follows these principles:

1. **Comprehensive Coverage**: Aim for 100% statement coverage and high branch coverage
2. **Fast Execution**: Tests should complete quickly (<10 seconds for full suite)
3. **Isolated Tests**: Each test should be independent and not rely on others
4. **Clear Intent**: Test names should clearly describe what is being tested
5. **Maintainable**: Tests should be easy to understand and update
6. **Realistic**: Tests should reflect real-world usage patterns

## CI/CD Integration

Tests are designed to run in CI/CD environments:
- No external dependencies required
- Deterministic output
- Snapshot testing configured for CI
- Clear error messages
- Exit codes properly set

## Troubleshooting

### Snapshot Mismatches
If snapshots fail after intentional changes:
```bash
npm test -- -u
```

### TypeScript Errors
Ensure the project is built before running tests:
```bash
npm run build
```

### Coverage Thresholds
Coverage thresholds are disabled by default. To enforce thresholds, update `jest.config.js`.

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)
