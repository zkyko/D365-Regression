import { chromium } from '@playwright/test';
import * as readline from 'readline';

async function globalSetup() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to D365 login page
  await page.goto('https://fourhands-test.sandbox.operations.dynamics.com/?cmp=FH&mi=DefaultDashboard');

  console.log('\n========================================');
  console.log('Please login to D365 in the browser...');
  console.log('Press ENTER when you are logged in and ready to save the session');
  console.log('========================================\n');

  // Wait for user to press Enter
  await waitForEnter();

  // Save the authentication state
  await context.storageState({ path: 'auth.json' });
  console.log('\n✓ Authentication state saved to auth.json\n');

  await browser.close();
}

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

globalSetup();
