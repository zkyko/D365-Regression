/**
 * Shipment Builder — Batch Job Infrastructure Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * O2C alignment:
 *   These tests exercise the two batch jobs that appear as supporting steps in
 *   virtually every O2C scenario (Sc. 1–9, 21–46, 89–91, 117, etc.).
 *   They are not numbered O2C scenarios themselves, but validating them in
 *   isolation guards the infrastructure that the full E2E tests depend on.
 *
 *   "Shipment Builder | Candidate for Shipping Batch Job"
 *     Step 7 of every O2C flow: release sales orders to the warehouse by
 *     running the Candidate for Shipping dialog without a specific SO filter.
 *     (Converted from TC-7938-run-candidate-for-shipping-batch-job.spec.js)
 *
 *   "Shipment Builder | Grouping Batch Job"
 *     Step 8 of every O2C flow: group released orders before creating a
 *     shipment in Shipment Builder.
 *     (Converted from TC-7940-run-grouping-job.spec.js)
 *
 * Key improvements over the original JS smoke tests:
 *   - Uses the existing CandidateForShippingPage and GroupingPage POMs instead
 *     of loose `page.locator('row')` selectors.
 *   - Removes BrowserStack-specific session-naming code (not needed in TS pack).
 *   - Deterministic navigation via the project's BasePage.navigateTo() pattern.
 *   - Correct TypeScript types throughout.
 *
 * Run:
 *   npx playwright test tests/batch-jobs.spec.ts --headed --workers=1
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CandidateForShippingPage } from '../Pages/CandidateForShippingPage';
import { GroupingPage }              from '../Pages/GroupingPage';

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Shipment Builder | Batch Job Infrastructure', () => {

  /**
   * Shipment Builder | Candidate for Shipping Batch Job
   *
   * Verifies the Candidate for Shipping page is reachable and the batch
   * process can be triggered without a specific SO filter (runs against all
   * pending orders whose requested ship date is today).
   *
   * This mirrors Step 7 in every O2C scenario 1–9, 21–46, 89–91, 117.
   */
  test('Shipment Builder | Candidate for Shipping Batch Job', async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const cfsPage = new CandidateForShippingPage(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ── 1. Navigate to Candidate for Shipping ─────────────────────────────────
    await cfsPage.searchCandidateForShipping();

    // ── 2. Run the batch (filter by today's date, no SO-specific filter) ──────
    // filterCandidateForShipping runs the Records-to-include → Filter → OK flow.
    // Passing an empty string skips the SO-number input and uses date-only filtering.
    await cfsPage.filterCandidateForShipping('');

    // ── 3. Verify the page loaded (grid or "no records" state are both valid) ──
    const pageLoaded = await page
      .locator('[data-dyn-form-name*="Candidate"], [aria-label*="Candidate for shipping"]')
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    // A successful navigation is the core assertion; the grid may be empty in
    // a clean environment but the page must be reachable.
    expect(
      pageLoaded,
      'Candidate for Shipping page should be visible after navigation',
    ).toBe(true);

    console.log('✓ Candidate for Shipping batch job triggered and page verified.');
  });

  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Shipment Builder | Grouping Batch Job
   *
   * Verifies the Grouping dialog is reachable and the OK button (which
   * triggers the grouping job) can be clicked without error.
   *
   * This mirrors Step 8 in every O2C scenario 1–9, 21–46, 89–91, 117.
   */
  test('Shipment Builder | Grouping Batch Job', async ({ page }) => {
    test.setTimeout(2 * 60_000);

    const groupingPage = new GroupingPage(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ── 1. Navigate to Grouping dialog ────────────────────────────────────────
    await groupingPage.navigate();

    // ── 2. Verify the dialog opened ───────────────────────────────────────────
    const okBtn = page.getByRole('button', { name: 'OK' }).first();
    await expect(okBtn).toBeVisible({ timeout: 15_000 });
    console.log('✓ Grouping dialog opened successfully.');

    // ── 3. Run the grouping job ────────────────────────────────────────────────
    await groupingPage.run();

    // ── 4. Verify we're back on a stable D365 page (no error dialog) ──────────
    const errorDialog = page.locator('[role="dialog"]').filter({ hasText: /error/i });
    const hasError = await errorDialog.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasError, 'No error dialog should appear after running Grouping job').toBe(false);

    console.log('✓ Grouping batch job executed without error.');
  });

});
