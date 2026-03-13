import { test, expect } from '@playwright/test';
import { readScenarios39Data } from '../utils/excel-reader';
import { SalesOrderListPage } from '../Pages/SalesOrderListPage';
import { SalesOrderPage } from '../Pages/SalesOrderPage';
import { MCROrderRecapPage } from '../Pages/MCROrderRecapPage';
import { GroupingPage } from '../Pages/GroupingPage';
import { ShipmentBuilderPage } from '../Pages/ShipmentBuilderPage';
import { ShipmentsPage } from '../Pages/ShipmentsPage';
import type { Page } from '@playwright/test';

/**
 * Scenarios 3–9 — Order Entry (O2C Standard + Account payment variants)
 *
 * All test values are read from test-data/Scenarios-3-9.xlsx (sheet "Scenarios3-9").
 * Edit the Excel file to change customers, items, payment details, or expected
 * values — no code changes needed.
 *
 * Flow (all scenarios):
 *   All Sales Orders → New → Customer → Item(s) + Qty → Header (Ship Type)
 *   → Complete → Payment (CC iframe OR on-account AR) → Submit
 *   → Re-open SO → Reserve all non-Canceled lines
 *   → Confirm Now → Sales order confirmation
 *   → Candidate for Shipping → Grouping → Shipment Builder → Create shipment
 *   → Shipments → Pick & pack → Post packing slip → Invoice
 *   → Reload SO → Verify Document Status
 *
 * Payment method variants:
 *   CC      (Scenarios 3, 6) — credit card entered via nested iframe tokenization form
 *   Account (Scenarios 4, 5, 7, 8, 9) — on-account tender type "AR"
 *
 * Bundle / multi-item notes:
 *   Scenario 5       — single bundle item (106045-201); bundle parent row is Canceled,
 *                       reservation iterates all rows and skips Canceled status.
 *   Scenarios 7 & 8  — two items (first regular, second bundle); same skip logic applies.
 *   Non-bundle items — all rows are reservable (none Canceled).
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCC(paymentMethod: string): boolean {
  return /^cc|credit/i.test((paymentMethod || '').trim());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function waitForShellUnblocked(page: Page): Promise<void> {
  const blocker = page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
  const visible = await blocker.isVisible({ timeout: 2_000 }).catch(() => false);
  if (visible) await blocker.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
}

/**
 * Reserve all non-Canceled order lines on the current Lines tab view.
 *
 * Handles single items, bundle-only, and mixed multi-item + bundle scenarios:
 * - Rows with Line status = "Canceled" (bundle parents) are skipped.
 * - All other rows (Open order / regular lines / bundle sub-lines) are reserved.
 *
 * Must be called after soPage.goToLinesTab() is already active.
 */
async function reserveAllNonCanceledLines(page: Page): Promise<void> {
  const orderLinesGrid = page.locator('[role="grid"][aria-label="Order lines"]');
  await orderLinesGrid.waitFor({ state: 'visible', timeout: 15_000 });

  const allRows = orderLinesGrid.locator('[role="row"]:has([role="gridcell"])');
  await expect(allRows.first()).toBeVisible({ timeout: 15_000 });

  const totalRows = await allRows.count();
  console.log(`ℹ Order line rows: ${totalRows}`);

  for (let i = 0; i < totalRows; i++) {
    const row = allRows.nth(i);

    const statusInput = row.locator('input[aria-label="Line status"]');
    const status = await statusInput.inputValue().catch(() => '');

    if (status === 'Canceled') {
      console.log(`⏭ Row ${i} — Canceled bundle parent, skipping`);
      continue;
    }

    console.log(`👉 Row ${i} — Status: "${status || 'Open order'}", reserving`);
    await row.scrollIntoViewIfNeeded();
    await row.click();
    await page.waitForTimeout(1_000);

    // Inventory → Reservation
    const inventoryBtn = page.locator('button[name="ButtonLineInventory"]');
    await expect(inventoryBtn).toBeEnabled({ timeout: 8_000 });
    await inventoryBtn.click();

    // Wait for the Reservation dropdown item to appear before clicking it
    const reservationMenuItem = page.locator('button[name="buttonLineInventReservation"]');
    await reservationMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await reservationMenuItem.click();
    await page.waitForLoadState('networkidle');

    // Wait for the Reservation form (Reserve lot button signals it's fully loaded)
    const reserveLotBtn = page.locator('button[id*="ALCReserveLot"]');
    await reserveLotBtn.waitFor({ state: 'visible', timeout: 15_000 });

    // Click Reserve lot (silently does nothing if no on-hand stock is available)
    await reserveLotBtn.click();
    await page.waitForTimeout(800);

    // Return to Sales Order lines via Back button
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
}

/**
 * Navigate back to a specific Sales Order by filtering the All Sales Orders list.
 * Returns after the SO detail form is loaded.
 */
async function openSalesOrderFromList(
  page: Page,
  soListPage: SalesOrderListPage,
  salesOrderNumber: string,
): Promise<void> {
  await soListPage.navigate();
  await page.waitForLoadState('networkidle');

  // Type the SO number into the quick-filter box and press Enter
  const filterCombo = page.getByRole('combobox', { name: 'Filter' }).first();
  await filterCombo.waitFor({ state: 'visible', timeout: 10_000 });
  await filterCombo.click();
  await page.keyboard.press('Control+a');
  await filterCombo.fill(salesOrderNumber);
  // Wait for the quickFilter dropdown to appear, then press Enter to select the "Sales order" column option
  await page.waitForTimeout(400);
  await filterCombo.press('Enter');
  // Wait for the dropdown to fully close before clicking grid cells
  await page.locator('.quickFilter-dropdown').waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(500);

  // The SO number cell is a readonly textbox with aria-label="Sales order" and value=SO number
  const soCell = page.locator(`input[aria-label="Sales order"][value="${salesOrderNumber}"]`);
  await soCell.waitFor({ state: 'visible', timeout: 15_000 });
  await soCell.click();
  await page.waitForLoadState('networkidle');
}

// ─── Test data ────────────────────────────────────────────────────────────────

const testData = readScenarios39Data('Scenarios-3-9.xlsx');

// ─── Tests ────────────────────────────────────────────────────────────────────

for (const [index, data] of testData.entries()) {
  test.describe(
    `Scenario ${data.ScenarioID} — Row ${index + 1} (${data.CustomerAccount})`,
    () => {
      test(
        `O2C [${isCC(data.PaymentMethod) ? 'CC' : 'Account'}] ` +
          `${data.CustomerAccount} / ${data.ItemNumber}` +
          `${data.ItemNumber2 ? ' + ' + data.ItemNumber2 : ''}`,
        async ({ page }) => {
          test.setTimeout(10 * 60 * 1_000); // 10 minutes

          const soListPage = new SalesOrderListPage(page);
          const soPage     = new SalesOrderPage(page);
          const mcrPage    = new MCROrderRecapPage(page);
          const grpPage    = new GroupingPage(page);
          const sbPage     = new ShipmentBuilderPage(page);
          const shipPage   = new ShipmentsPage(page);

          // ══════════════════════════════════════════════════════════════════
          // STEP 1: Navigate to All Sales Orders → New
          // ══════════════════════════════════════════════════════════════════
          await page.goto('/');
          await soListPage.navigate();
          await soListPage.clickNew();

          // ══════════════════════════════════════════════════════════════════
          // STEP 2: Customer account
          // ══════════════════════════════════════════════════════════════════
          await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
          await waitForShellUnblocked(page);

          // ══════════════════════════════════════════════════════════════════
          // STEP 3: Line items
          // Quantity is passed to enterItemNumber so it is set before Save.
          // For bundle items the qty set is best-effort (before explosion).
          // ══════════════════════════════════════════════════════════════════
          await soPage.goToLinesTab();
          await soPage.enterItemNumber(data.ItemNumber, data.Quantity || '1');

          // Second item (Scenarios 7 & 8: multi-item orders containing a bundle)
          if (data.ItemNumber2) {
            // After saving item 1, D365 leaves the cursor in the Lines grid.
            // enterItemNumber will target the next available item number combobox.
            // If D365 does not auto-create a new empty row, the new-line toolbar
            // button provides a fallback.
            const newLineBtn = page
              .locator('[data-dyn-form-name="SalesLine"] button[name="SystemDefinedNewButton"]')
              .first();
            if (await newLineBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await newLineBtn.click();
              await page.waitForTimeout(500);
            }
            await soPage.enterItemNumber(data.ItemNumber2, data.Quantity2 || '1');
          }

          // ══════════════════════════════════════════════════════════════════
          // STEP 4: Ship Type (Header tab)
          // ══════════════════════════════════════════════════════════════════
          await soPage.setShipType(data.ShipType || 'Auto Ship');

          // Capture SO number before Complete (may already be assigned)
          let salesOrderNumber = await soPage.captureSalesOrderNumber();

          // ══════════════════════════════════════════════════════════════════
          // STEP 5: Complete → opens MCR Order Recap dialog
          // ══════════════════════════════════════════════════════════════════
          const mcrSubmitBtn = await soPage.clickComplete();

          // ══════════════════════════════════════════════════════════════════
          // STEP 6: Payment
          // ══════════════════════════════════════════════════════════════════
          await mcrPage.ensurePaymentsExpanded();

          if (isCC(data.PaymentMethod)) {
            // ── Credit card via nested iframe tokenization form ──────────────
            await mcrPage.addCreditCard({
              name    : data.CC_Name,
              number  : data.CC_Number,
              cvv     : data.CC_CVV,
              expMonth: data.CC_ExpMonth,
              expYear : data.CC_ExpYear,
              zip     : data.CC_Zip,
              address : data.CC_Address,
            });
          } else {
            // ── On-account tender (AR or custom tender code) ─────────────────
            await mcrPage.addAccountPayment(data.TenderType || 'AR');
          }

          // ══════════════════════════════════════════════════════════════════
          // STEP 7: Submit MCR Order Recap
          // ══════════════════════════════════════════════════════════════════
          await mcrPage.submit(mcrSubmitBtn);
          await waitForShellUnblocked(page);

          salesOrderNumber = (await soPage.captureSalesOrderNumber()) || salesOrderNumber;
          if (!salesOrderNumber) {
            throw new Error('Could not capture Sales Order number after MCR submit.');
          }
          console.log(`✓ Sales Order: ${salesOrderNumber}`);

          // ══════════════════════════════════════════════════════════════════
          // STEP 8: Re-open SO from the All Sales Orders list
          // ══════════════════════════════════════════════════════════════════
          await openSalesOrderFromList(page, soListPage, salesOrderNumber);

          // ══════════════════════════════════════════════════════════════════
          // STEP 9: Reserve all non-Canceled order lines
          // Canceled = bundle parent (automatically skipped).
          // ══════════════════════════════════════════════════════════════════
          await soPage.goToLinesTab();
          await reserveAllNonCanceledLines(page);

          // ══════════════════════════════════════════════════════════════════
          // STEP 10: Confirm Now → Sales order confirmation view
          // ══════════════════════════════════════════════════════════════════
          await soPage.confirmNow();
          await page
            .getByText('Operation completed')
            .waitFor({ state: 'visible', timeout: 10_000 })
            .catch(() => {});
          await soPage.viewOrderConfirmation();

          // ══════════════════════════════════════════════════════════════════
          // STEP 11: Candidate for Shipping
          // Run the CFS batch job filtered to the current SO, then navigate to
          // CFS Orders list and poll until the SO appears.
          // The "Records to include" filter persists between runs so we must
          // update it to the current SO number each time.
          // ══════════════════════════════════════════════════════════════════
          await page.getByRole('button', { name: 'Search', exact: true }).click();
          await page.getByRole('textbox', { name: 'Search for a page' }).fill('candidate for shipping');
          await page.waitForTimeout(1_200);
          await page.getByRole('textbox', { name: 'Search for a page' }).press('Enter');
          await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

          // Expand "Records to include" section
          const recordsBtn = page.getByRole('button', { name: 'Records to include' });
          await recordsBtn.waitFor({ state: 'visible', timeout: 30_000 });
          await recordsBtn.click();
          await page.waitForTimeout(500);

          // Open the Query Designer to set / update the Sales order filter criteria
          // Note: the Filter button's accessible name has a leading icon character (" Filter"),
          // so exact: true would fail — use substring match (no exact flag).
          const filterBtn = page.getByRole('button', { name: 'Filter' });
          await filterBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await filterBtn.click();
          await page.waitForTimeout(500);

          // Update the Criteria combobox to the current SO number
          const criteriaCombo = page.getByRole('combobox', { name: 'Criteria' });
          await criteriaCombo.waitFor({ state: 'visible', timeout: 10_000 });
          await criteriaCombo.click();
          await page.keyboard.press('Control+a');
          await page.keyboard.type(salesOrderNumber);
          await page.keyboard.press('Tab');
          await page.waitForTimeout(300);

          // OK — closes Query Designer and returns to CFS dialog
          await page.getByRole('button', { name: 'OK' }).first().click();
          await page.waitForTimeout(500);

          // OK — runs the CFS batch job
          await page.getByRole('button', { name: 'OK' }).first().click();
          await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
          await page.waitForTimeout(2_000);

          // Navigate to the CFS Orders list
          await page.getByRole('button', { name: 'Search', exact: true }).click();
          await page
            .getByRole('textbox', { name: 'Search for a page' })
            .fill('candidate for shipping orders');
          await page.waitForTimeout(1_200);
          await page.getByRole('textbox', { name: 'Search for a page' }).press('Enter');
          await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

          // Poll until SO row appears (up to ~90 s)
          const cfsRow = page.getByRole('row').filter({ hasText: salesOrderNumber }).first();
          let cfsFound = false;
          for (let i = 0; i < 15; i++) {
            if (await cfsRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
              cfsFound = true;
              break;
            }
            console.log(`CFS refresh attempt ${i + 1} — ${salesOrderNumber} not yet visible`);
            await page.getByRole('button', { name: 'Refresh' }).click();
            await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
            await page.waitForTimeout(3_000);
          }
          if (!cfsFound) {
            throw new Error(
              `${salesOrderNumber} did not appear in Candidate for Shipping Orders after polling.`,
            );
          }
          await cfsRow.getByRole('checkbox', { name: 'Select or unselect row' }).click();

          // ══════════════════════════════════════════════════════════════════
          // STEP 12: Grouping — creates a GRP number for the order
          // ══════════════════════════════════════════════════════════════════
          await grpPage.navigate();
          await grpPage.run();

          // ══════════════════════════════════════════════════════════════════
          // STEP 13: Shipment Builder → Create shipment
          // ══════════════════════════════════════════════════════════════════
          await sbPage.navigate();
          const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
          await sbPage.createShipment();

          if (data.ExpectedKoerberStatus) {
            await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus);
          }

          // ══════════════════════════════════════════════════════════════════
          // STEP 14: Shipments → Pick & pack → Post packing slip → Invoice
          // ══════════════════════════════════════════════════════════════════
          await shipPage.navigate();
          await shipPage.filterAndSelect(grpNumber, data.CustomerAccount);
          await shipPage.pickAndPack();
          await shipPage.postPackingSlip();
          await shipPage.invoice();

          // ══════════════════════════════════════════════════════════════════
          // STEP 15: Navigate back to SO → verify Document Status
          // ══════════════════════════════════════════════════════════════════
          await openSalesOrderFromList(page, soListPage, salesOrderNumber);

          if (data.ExpectedDocumentStatus) {
            await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);
          }

          console.log(
            `✓ Scenario ${data.ScenarioID} Row ${index + 1} complete — ` +
              `SO ${salesOrderNumber}, GRP ${grpNumber}`,
          );
        },
      );
    },
  );
}
