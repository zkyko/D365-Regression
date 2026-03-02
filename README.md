# D365 Regression Testing with Playwright

This project contains automated regression tests for D365 using Playwright and TypeScript.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see the browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests with UI mode
```bash
npm run test:ui
```

### View test report
```bash
npm run test:report
```

### Generate code (record tests)
```bash
npm run codegen
```

## Project Structure

```
D365-Regression/
├── tests/               # Test files
│   └── example.spec.ts  # Sample test file
├── playwright.config.ts # Playwright configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies
└── .gitignore         # Git ignore rules
```

## Writing Tests

Create new test files in the `tests/` directory with the `.spec.ts` extension.

Example:
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## Configuration

- **Browser settings**: Edit `playwright.config.ts` to configure which browsers to run tests in
- **Base URL**: Uncomment and set the `baseURL` in `playwright.config.ts` for your D365 environment
- **Timeouts**: Adjust timeouts in `playwright.config.ts` as needed

## Debugging

- Use `test.only()` to run a single test
- Use `test.skip()` to skip a test
- Use `await page.pause()` in your test to pause execution

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test](https://playwright.dev/docs/api/class-test)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
