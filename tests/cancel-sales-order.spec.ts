/**
 * D Channel | Scenario 73 — Cancel Direct Delivery Sales Order
 * ─────────────────────────────────────────────────────────────────────────────
 * O2C Scenario 73:
 *   "Cancel Direct Delivery Sales Order.  Ensure Allocations do not stick
 *    and related PO cancels as well."
 *
 * Converted from:  tests/TC-7941-cancel-sales-order.spec.js
 * Language:        TypeScript (project POM conventions)
 *
 * Scope of this file:
 *   Covers the core cancel path (SO status → Cancelled) that is common to
 *   Sc. 73, 74, and 75.  D-Channel-specific verifications (allocation release,
 *   linked PO cancellation) will be added to tests/d-channel.spec.ts once
 *   the DChannelOrderPage.ts locators are confirmed in a live D365 session.
 *
 * Key improvement over the original JS version:
 *   - Deterministic: uses a SPECIFIC SO number (or creates a fresh, uncompleted
 *     SO) rather than picking the first row in the list.
 *   - Two modes:
 *       a) Supply an existing SO number in CANCEL_SO_DATA.salesOrderNumber
 *          → navigates directly to that SO and cancels it.
 *       b) Leave salesOrderNumber blank
 *          → creates a fresh uncompleted SO (no payment needed) and cancels it.
 *
 * Run:
 *   npx playwright test tests/cancel-sales-order.spec.ts --headed --workers=1
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect }         from '@playwright/test';
import { SalesOrderListPage }   from '../Pages/SalesOrderListPage';
import { SalesOrderPage }       from '../Pages/SalesOrderPage';

// ─── Test data ────────────────────────────────────────────────────────────────
const CANCEL_SO_DATA = {
  // Leave blank to auto-create a fresh SO for the cancel test.
  // Set to an existing SO number (e.g. 'SO000123456') to cancel a specific order.
  salesOrderNumber: '',

  // Used only when salesOrderNumber is blank (fresh SO creation):
  customerAccount:  '100001',   // A customer that can create an uncompleted SO
  itemNumber:       '100054-009',
  shipType:         'PREPAID',
};

// ─────────────────────────────────────────────────────────────────────────────

test.describe('D Channel | Scenario 73 — Cancel Direct Delivery Sales Order', () => {

  test('D Channel | Scenario 73 — Cancel Direct Delivery Sales Order and verify status = Cancelled', async ({ page }) => {
    test.setTimeout(5 * 60 * 1_000);

    const soListPage = new SalesOrderListPage(page);
    const soPage     = new SalesOrderPage(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    let targetSONumber = CANCEL_SO_DATA.salesOrderNumber;

    // ── MODE A: Navigate to a specific known SO ──────────────────────────────
    if (targetSONumber) {
      console.log(`ℹ Using provided SO: ${targetSONumber}`);
      await soListPage.navigate();
      await page.waitForLoadState('networkidle');

      const filterCombo = page.getByRole('combobox', { name: 'Filter' }).first();
      if (await filterCombo.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await filterCombo.click();
        await page.keyboard.press('Control+a');
        await filterCombo.fill(targetSONumber);
        await page.waitForTimeout(400);
        await filterCombo.press('Enter');
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(1_000);
      }

      const soCell = page.locator(`input[aria-label="Sales order"][value="${targetSONumber}"]`);
      await soCell.waitFor({ state: 'visible', timeout: 15_000 });
      await soCell.click();
      await page.waitForLoadState('networkidle');
    }
    // ── MODE B: Create a fresh uncompleted SO, then cancel it ────────────────
    else {
      console.log('ℹ No SO provided — creating a fresh uncompleted SO to cancel.');

      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(
        CANCEL_SO_DATA.customerAccount,
        `CANCEL-TEST-${Date.now()}`,
      );
      await page.waitForLoadState('networkidle');

      await soPage.enterItemNumber(CANCEL_SO_DATA.itemNumber);
      await soPage.setShipType(CANCEL_SO_DATA.shipType);

      // Capture the auto-generated SO number
      targetSONumber = await soPage.captureSalesOrderNumber();
      expect(targetSONumber, 'Fresh SO number should be generated').toBeTruthy();
      console.log(`✓ Fresh SO created: ${targetSONumber}`);

      // Save without completing — SO stays in "Open order" state (cancellable)
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForLoadState('networkidle');
    }

    // ── Read current status for logging ─────────────────────────────────────
    const statusBefore = await page
      .locator('[data-dyn-controlname="SalesTable_SalesStatus"] input, input[aria-label="Status"]')
      .first()
      .inputValue()
      .catch(() => 'unknown');
    console.log(`ℹ SO ${targetSONumber} status before cancel: "${statusBefore}"`);

    // ── Navigate to the Sell tab ─────────────────────────────────────────────
    await page.getByRole('button', { name: 'Sell' }).click();
    await page.waitForTimeout(500);

    // ── Click the Cancel order button ────────────────────────────────────────
    // In D365 F&O the button is typically on the Sell action-pane tab.
    // Control names: 'cancelSalesOrder' or labelled 'Cancel order'
    const cancelBtn = page
      .locator('button[name="cancelSalesOrder"], button[aria-label="Cancel order"]')
      .or(page.getByRole('button', { name: 'Cancel order', exact: true }))
      .first();

    await cancelBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // ── Confirm the cancellation dialog if it appears ───────────────────────
    const confirmDialog = page.locator('[role="dialog"]').first();
    if (await confirmDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const yesBtn = confirmDialog
        .getByRole('button', { name: 'Yes' })
        .or(confirmDialog.getByRole('button', { name: 'OK' }))
        .first();
      await yesBtn.click();
      await page.waitForLoadState('networkidle');
    }

    await page.waitForTimeout(2_000);

    // ── Verify status changed to Cancelled ───────────────────────────────────
    const statusAfter = await page
      .locator('[data-dyn-controlname="SalesTable_SalesStatus"] input, input[aria-label="Status"]')
      .first()
      .inputValue()
      .catch(() => '');

    expect(
      statusAfter,
      `SO ${targetSONumber} should show Cancelled status after cancel action`,
    ).toMatch(/Cancel/i);

    console.log(`✓ SO ${targetSONumber} cancelled successfully. New status: "${statusAfter}"`);
  });

});
