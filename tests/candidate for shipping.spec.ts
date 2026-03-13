/**
 * Smoke test: Candidate for Shipping for a known Sales Order.
 *
 * Flow (derived from test-1.spec.ts recording):
 *   1. Navigate to "Candidate for shipping" batch dialog via D365 search
 *   2. Click "Records to include" → click "OK" to run the batch
 *   3. Navigate to Candidate for Shipping Orders list
 *   4. Poll/Refresh until SO appears in the list (up to ~90s)
 *   5. Select the row checkbox
 *   6. Navigate to Grouping → click OK
 *
 * Run with:
 *   npx playwright test tests/cfs-smoke.spec.ts --headed --workers=1
 */
import { test, expect } from '@playwright/test';

const SALES_ORDER = 'SO000235137';

async function navigateViaSearch(page: import('@playwright/test').Page, query: string) {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const searchBox = page.getByRole('textbox', { name: 'Search for a page' });
  await searchBox.waitFor({ state: 'visible', timeout: 15_000 });
  await searchBox.fill(query);
  await page.waitForTimeout(1_200);
  await searchBox.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

test(`Candidate for Shipping — ${SALES_ORDER}`, async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── 1. Run the CFS batch ───────────────────────────────────────────────────
  await navigateViaSearch(page, 'candidate for shipping');

  const recordsToIncludeBtn = page.getByRole('button', { name: 'Records to include' });
  await recordsToIncludeBtn.waitFor({ state: 'visible', timeout: 30_000 });
  console.log('On Candidate for Shipping form');

  await recordsToIncludeBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1_000);

  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2_000);
  console.log('CFS batch submitted');

  // ── 2. Navigate to Candidate for Shipping Orders list ─────────────────────
  await navigateViaSearch(page, 'candidate for shipping orders');
  console.log('On Candidate for Shipping Orders list');

  // ── 3. Poll/Refresh until SO appears (up to ~90s, 15 refreshes × 6s) ──────
  const soRow = page.getByRole('row').filter({ hasText: SALES_ORDER }).first();
  let found = false;
  for (let i = 0; i < 15; i++) {
    if (await soRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      found = true;
      break;
    }
    console.log(`Refresh attempt ${i + 1} — ${SALES_ORDER} not yet visible`);
    await page.getByRole('button', { name: 'Refresh' }).click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3_000);
  }

  expect(found, `Expected ${SALES_ORDER} to appear in Candidate for Shipping Orders list after refreshing`).toBe(true);
  console.log(`✓ ${SALES_ORDER} found in list`);

  // ── 4. Select the row checkbox ────────────────────────────────────────────
  await soRow.getByRole('checkbox', { name: 'Select or unselect row' }).click();
  console.log('Row selected');

  // ── 5. Navigate to Grouping → OK ──────────────────────────────────────────
  await navigateViaSearch(page, 'grouping');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  console.log('✓ Grouping submitted — CFS smoke test complete');
});
