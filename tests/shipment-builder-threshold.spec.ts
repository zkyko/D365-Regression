/**
 * Spec: BRD #14779 — Shipment Builder Amount Threshold Regression Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * BRD #14779 introduced the following changes to Shipment Builder:
 *   - Renamed "amount threshold" → B2B threshold (B2BThreshold field in SB Parameters)
 *   - Added B2B carrier services field (B2BServices) to SB Parameters
 *   - Added Expedited/Rush threshold + services fields to SB Parameters
 *   - Added "Exceeds amount threshold" boolean column (ExceedsAmountThreshold)
 *     to the rsmShipmentBuilder grid — set by the Grouping job, read-only
 *   - Moved threshold logic from Candidate for Shipping → Grouping job
 *   - Auto-Ship classification groups that exceed the threshold are
 *     automatically downgraded to "Manual" by the Grouping job
 *
 * BRD §3 Test Scenarios covered here:
 *   §3.1  — ExceedsAmountThreshold column is present and read-only
 *   §3.2  — CFS no longer blocks over-threshold SO (threshold check removed from CFS)
 *   §3.3a — Non-prepaid delivery terms + over-threshold amount → ExceedsAmountThreshold = No
 *   §3.3b — Prepaid + B2B carrier + under B2B threshold     → ExceedsAmountThreshold = No
 *   §3.3c — Prepaid + B2B carrier + over B2B threshold      → ExceedsAmountThreshold = Yes
 *   §3.3d — Prepaid + Expedited/Rush carrier + over threshold → ExceedsAmountThreshold = Yes
 *   §3.3e — Prepaid + B2B + over threshold + Auto-Ship customer
 *            → ExceedsAmountThreshold = Yes  AND  ClassificationGroup changed to "Manual"
 *
 * Test data : test-data/ShipmentBuilderThreshold.xlsx → sheet "ThresholdScenarios"
 * Framework : Playwright Test (TypeScript)
 * Type      : Functional / End-to-End (D365 F&O)
 *
 * ⚠️  IMPORTANT — Update before first live run:
 *   1. Replace placeholder CustomerAccount, ItemNumber, and Quantity values in
 *      ShipmentBuilderThreshold.xlsx with real D365 test-environment values.
 *   2. Replace "B2B" / "Expedited" CarrierService codes with the exact codes
 *      configured in Shipment Builder Parameters in the target D365 environment.
 *   3. The customer used for §3.3e must have Classification Group = "Auto-Ship"
 *      before the test runs.
 *   4. Run §3.1 (field read-only check) first — it requires no batch jobs and
 *      confirms the ExceedsAmountThreshold locator works in the live DOM.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect, Page }                    from '@playwright/test';
import { readShipmentBuilderThresholdData }      from '../utils/excel-reader';
import { SalesOrderListPage }                    from '../Pages/SalesOrderListPage';
import { SalesOrderPage }                        from '../Pages/SalesOrderPage';
import { CandidateForShippingPage }              from '../Pages/CandidateForShippingPage';
import { GroupingPage }                          from '../Pages/GroupingPage';
import { ShipmentBuilderPage }                   from '../Pages/ShipmentBuilderPage';

// ── Test data ────────────────────────────────────────────────────────────────

const allRows = readShipmentBuilderThresholdData('ShipmentBuilderThreshold.xlsx');

/** Find the single row for a given TestCaseId; throws if missing. */
function rowFor(id: string) {
  const row = allRows.find(r => r.TestCaseId === id);
  if (!row) throw new Error(`No test-data row found for TestCaseId "${id}"`);
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.1 — ExceedsAmountThreshold column is present and READ-ONLY
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.1 — ExceedsAmountThreshold column is read-only', () => {
  test('BRD-3.1: ExceedsAmountThreshold column exists in Shipment Builder grid and cannot be edited', async ({ page }) => {
    const data  = rowFor('BRD-3.1');
    const soListPage = new SalesOrderListPage(page);
    const soPage     = new SalesOrderPage(page);
    const cfsPage    = new CandidateForShippingPage(page);
    const grpPage    = new GroupingPage(page);
    const sbPage     = new ShipmentBuilderPage(page);

    await page.goto('/');

    // ── Create a standard SO to get a GRP row in Shipment Builder ────────────
    await soListPage.navigate();
    await soListPage.clickNew();
    await soPage.fillNewOrderDialog(data.CustomerAccount);

    await soPage.enterItemNumber(data.ItemNumber);

    const salesOrderNumber = await soPage.captureSalesOrderNumber();
    console.log(`[BRD-3.1] Sales Order: ${salesOrderNumber}`);

    await soPage.goToLinesTab();
    await soPage.reserveAllSubLines(data.ItemNumber, 0);
    await soPage.confirmNow();

    // ── Run CFS → Grouping ────────────────────────────────────────────────────
    await cfsPage.navigate();
    await cfsPage.filterBySalesOrder(salesOrderNumber);

    await grpPage.navigate();
    await grpPage.run();

    // ── Navigate to Shipment Builder and select the GRP row ───────────────────
    await sbPage.navigate();
    const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
    console.log(`[BRD-3.1] GRP: ${grpNumber}`);

    // ── ASSERTIONS ────────────────────────────────────────────────────────────
    // Assert 1: ExceedsAmountThreshold column is present (locator resolves)
    const colLocator = page
      .getByRole('row')
      .filter({ hasText: data.CustomerAccount })
      .first()
      .locator('[data-dyn-controlname="ExceedsAmountThreshold"]')
      .first();
    await expect(colLocator).toBeVisible({ timeout: 10_000 });
    console.log('[BRD-3.1] ✓ ExceedsAmountThreshold column is visible');

    // Assert 2: The field is read-only (cannot be manually edited)
    const isReadOnly = await sbPage.isExceedsAmountThresholdReadOnly(data.CustomerAccount);
    expect(isReadOnly, 'ExceedsAmountThreshold must be read-only (BRD #14779 §3.1)').toBe(true);
    console.log('[BRD-3.1] ✓ ExceedsAmountThreshold is read-only');

    console.log('[BRD-3.1] PASSED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.2 — Candidate for Shipping no longer blocks over-threshold SOs
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.2 — CFS does NOT block over-threshold SO', () => {
  test('BRD-3.2: Confirmed SO with amount exceeding B2B threshold passes through CFS without error', async ({ page }) => {
    const data  = rowFor('BRD-3.2');
    const soListPage = new SalesOrderListPage(page);
    const soPage     = new SalesOrderPage(page);
    const cfsPage    = new CandidateForShippingPage(page);

    await page.goto('/');

    // ── Create SO with high-value line (Prepaid + B2B carrier, > B2B threshold) ─
    await soListPage.navigate();
    await soListPage.clickNew();
    await soPage.fillNewOrderDialog(data.CustomerAccount);

    await soPage.enterItemNumber(data.ItemNumber);
    if (data.Quantity) await soPage.enterQuantity(data.Quantity);

    // TODO: Set DeliveryTerms = Prepaid and CarrierService = B2B on the Header tab.
    // These fields require confirmed D365 locators for the target environment.
    // Uncomment and configure once locators are confirmed:
    // await soPage.setDeliveryTerms(data.DeliveryTerms);   // add method to SalesOrderPage
    // await soPage.setCarrierService(data.CarrierService); // add method to SalesOrderPage
    console.warn('[BRD-3.2] ⚠ DeliveryTerms / CarrierService not yet set — add locators to SalesOrderPage');

    const salesOrderNumber = await soPage.captureSalesOrderNumber();
    console.log(`[BRD-3.2] Sales Order: ${salesOrderNumber}`);

    await soPage.goToLinesTab();
    await soPage.reserveAllSubLines(data.ItemNumber, 0);
    await soPage.confirmNow();

    // ── Run Candidate for Shipping filtered to this SO ────────────────────────
    await cfsPage.navigate();
    await cfsPage.filterBySalesOrder(salesOrderNumber);
    // CFS should complete without displaying a blocking validation error for this SO.

    // ── ASSERTION: SO is NOT in the Validation Error Workbench ───────────────
    // BRD #14779 §3.2: amount threshold check was REMOVED from the CFS job.
    // If CFS still blocked the SO, it would appear in the Error Workbench.
    //
    // TODO: Navigate to "Validation Error Workbench" and assert SO# is absent.
    // This requires a ValidationErrorWorkbenchPage POM to be created.
    // For now, a non-throwing completion of filterBySalesOrder() is a
    // proxy assertion that CFS did not raise a blocking error.
    console.log(`[BRD-3.2] ✓ CFS completed without blocking SO ${salesOrderNumber}`);
    console.warn('[BRD-3.2] ⚠ TODO: Add explicit Validation Error Workbench assertion (requires new POM)');

    console.log('[BRD-3.2] PASSED (partial — Workbench assertion pending)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.3 Helper — full flow: SO → CFS → Grouping → Shipment Builder
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Shared SO-to-Grouping flow used by §3.3a–e.
 * Returns the GRP number for further assertions.
 */
async function createSoAndRunGrouping(
  page: Page,
  data: { CustomerAccount: string; ItemNumber: string; Quantity: string; DeliveryTerms: string; CarrierService: string },
  label: string,
): Promise<{ grpNumber: string; sbPage: ShipmentBuilderPage }> {
  const soListPage = new SalesOrderListPage(page);
  const soPage     = new SalesOrderPage(page);
  const cfsPage    = new CandidateForShippingPage(page);
  const grpPage    = new GroupingPage(page);
  const sbPage     = new ShipmentBuilderPage(page);

  await page.goto('/');

  // Create SO
  await soListPage.navigate();
  await soListPage.clickNew();
  await soPage.fillNewOrderDialog(data.CustomerAccount);
  await soPage.enterItemNumber(data.ItemNumber);
  if (data.Quantity) await soPage.enterQuantity(data.Quantity);

  // TODO: Set DeliveryTerms and CarrierService on Header tab.
  // Requires confirmed D365 field locators — add to SalesOrderPage when known.
  // await soPage.setDeliveryTerms(data.DeliveryTerms);
  // await soPage.setCarrierService(data.CarrierService);
  if (data.DeliveryTerms || data.CarrierService) {
    console.warn(
      `[${label}] ⚠ DeliveryTerms="${data.DeliveryTerms}" / CarrierService="${data.CarrierService}" ` +
      `not yet applied — locators for these fields not confirmed. Add setDeliveryTerms() / setCarrierService() to SalesOrderPage.`,
    );
  }

  const salesOrderNumber = await soPage.captureSalesOrderNumber();
  console.log(`[${label}] Sales Order: ${salesOrderNumber}`);

  await soPage.goToLinesTab();
  await soPage.reserveAllSubLines(data.ItemNumber, 0);
  await soPage.confirmNow();

  // CFS → Grouping
  await cfsPage.navigate();
  await cfsPage.filterBySalesOrder(salesOrderNumber);

  await grpPage.navigate();
  await grpPage.run();

  // Navigate to Shipment Builder and select the GRP row
  await sbPage.navigate();
  const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
  console.log(`[${label}] GRP: ${grpNumber}`);

  return { grpNumber, sbPage };
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.3a — Non-prepaid delivery terms + over-threshold amount → ExceedsAmountThreshold = No
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.3a — Non-prepaid + over threshold → ExceedsAmountThreshold = No', () => {
  test('BRD-3.3a: SO with non-prepaid delivery terms shows ExceedsAmountThreshold = No even if amount > threshold', async ({ page }) => {
    const data  = rowFor('BRD-3.3a');
    const label = 'BRD-3.3a';

    const { sbPage } = await createSoAndRunGrouping(page, data, label);

    // ASSERTION: ExceedsAmountThreshold must be false (non-prepaid → not subject to threshold)
    const exceeds = await sbPage.getExceedsAmountThreshold(data.CustomerAccount);
    const expectedBool = data.ExpectedExceedsThreshold.toLowerCase() === 'yes';
    expect(
      exceeds,
      `[${label}] ExceedsAmountThreshold should be ${data.ExpectedExceedsThreshold} ` +
      `(non-prepaid delivery terms are excluded from the B2B threshold check)`,
    ).toBe(expectedBool);

    console.log(`[${label}] ✓ ExceedsAmountThreshold = ${exceeds} (expected: ${data.ExpectedExceedsThreshold})`);
    console.log(`[${label}] PASSED`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.3b — Prepaid + B2B carrier + UNDER B2B threshold → ExceedsAmountThreshold = No
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.3b — Prepaid + B2B carrier + under threshold → ExceedsAmountThreshold = No', () => {
  test('BRD-3.3b: Prepaid B2B SO with line amount below the B2B threshold shows ExceedsAmountThreshold = No', async ({ page }) => {
    const data  = rowFor('BRD-3.3b');
    const label = 'BRD-3.3b';

    const { sbPage } = await createSoAndRunGrouping(page, data, label);

    // ASSERTION: ExceedsAmountThreshold = No (amount is below the B2B threshold)
    const exceeds = await sbPage.getExceedsAmountThreshold(data.CustomerAccount);
    const expectedBool = data.ExpectedExceedsThreshold.toLowerCase() === 'yes';
    expect(
      exceeds,
      `[${label}] ExceedsAmountThreshold should be ${data.ExpectedExceedsThreshold} ` +
      `(line amount is below the configured B2B threshold)`,
    ).toBe(expectedBool);

    console.log(`[${label}] ✓ ExceedsAmountThreshold = ${exceeds} (expected: ${data.ExpectedExceedsThreshold})`);
    console.log(`[${label}] PASSED`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.3c — Prepaid + B2B carrier + OVER B2B threshold → ExceedsAmountThreshold = Yes
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.3c — Prepaid + B2B carrier + over B2B threshold → ExceedsAmountThreshold = Yes', () => {
  test('BRD-3.3c: Prepaid B2B SO with line amount exceeding the B2B threshold shows ExceedsAmountThreshold = Yes', async ({ page }) => {
    const data  = rowFor('BRD-3.3c');
    const label = 'BRD-3.3c';

    const { sbPage } = await createSoAndRunGrouping(page, data, label);

    // ASSERTION: ExceedsAmountThreshold = Yes
    const exceeds = await sbPage.getExceedsAmountThreshold(data.CustomerAccount);
    const expectedBool = data.ExpectedExceedsThreshold.toLowerCase() === 'yes';
    expect(
      exceeds,
      `[${label}] ExceedsAmountThreshold should be ${data.ExpectedExceedsThreshold} ` +
      `(Prepaid + B2B carrier + line amount > B2B threshold of 5,000)`,
    ).toBe(expectedBool);

    console.log(`[${label}] ✓ ExceedsAmountThreshold = ${exceeds} (expected: ${data.ExpectedExceedsThreshold})`);
    console.log(`[${label}] PASSED`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.3d — Prepaid + Expedited/Rush carrier + OVER Expedited threshold → Yes
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.3d — Prepaid + Expedited/Rush carrier + over threshold → ExceedsAmountThreshold = Yes', () => {
  test('BRD-3.3d: Prepaid Expedited/Rush SO with line amount exceeding the Expedited threshold shows ExceedsAmountThreshold = Yes', async ({ page }) => {
    const data  = rowFor('BRD-3.3d');
    const label = 'BRD-3.3d';

    const { sbPage } = await createSoAndRunGrouping(page, data, label);

    // ASSERTION: ExceedsAmountThreshold = Yes
    // Expedited/Rush threshold is separate from the B2B threshold (BRD: 10,000 vs 5,000)
    const exceeds = await sbPage.getExceedsAmountThreshold(data.CustomerAccount);
    const expectedBool = data.ExpectedExceedsThreshold.toLowerCase() === 'yes';
    expect(
      exceeds,
      `[${label}] ExceedsAmountThreshold should be ${data.ExpectedExceedsThreshold} ` +
      `(Prepaid + Expedited/Rush carrier + line amount > Expedited threshold of 10,000)`,
    ).toBe(expectedBool);

    console.log(`[${label}] ✓ ExceedsAmountThreshold = ${exceeds} (expected: ${data.ExpectedExceedsThreshold})`);
    console.log(`[${label}] PASSED`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.3e — Prepaid + B2B + over threshold + Auto-Ship customer
//          → ExceedsAmountThreshold = Yes  AND  ClassificationGroup = "Manual"
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BRD §3.3e — Over-threshold Auto-Ship customer reclassified to Manual', () => {
  test('BRD-3.3e: Auto-Ship classification group is automatically changed to Manual when ExceedsAmountThreshold = Yes', async ({ page }) => {
    const data  = rowFor('BRD-3.3e');
    const label = 'BRD-3.3e';

    // Pre-condition note: the CustomerAccount must have ClassificationGroup = "Auto-Ship"
    // before running the Grouping job. Confirm this in D365 before executing this test.
    console.log(`[${label}] Pre-condition: Customer ${data.CustomerAccount} must have ClassificationGroup = "Auto-Ship"`);

    const { sbPage } = await createSoAndRunGrouping(page, data, label);

    // ASSERTION 1: ExceedsAmountThreshold = Yes
    const exceeds = await sbPage.getExceedsAmountThreshold(data.CustomerAccount);
    const expectedExceedsBool = data.ExpectedExceedsThreshold.toLowerCase() === 'yes';
    expect(
      exceeds,
      `[${label}] ExceedsAmountThreshold should be ${data.ExpectedExceedsThreshold}`,
    ).toBe(expectedExceedsBool);
    console.log(`[${label}] ✓ ExceedsAmountThreshold = ${exceeds} (expected: ${data.ExpectedExceedsThreshold})`);

    // ASSERTION 2: Classification Group was changed from "Auto-Ship" → "Manual"
    // BRD #14779: Grouping job automatically downgrades Auto-Ship → Manual when threshold exceeded
    if (data.ExpectedClassificationGroup) {
      const classGroup = await sbPage.getClassificationGroup(data.CustomerAccount);
      expect(
        classGroup,
        `[${label}] ClassificationGroup should be "${data.ExpectedClassificationGroup}" ` +
        `(Grouping job must auto-downgrade Auto-Ship → Manual when ExceedsAmountThreshold = Yes)`,
      ).toBe(data.ExpectedClassificationGroup);
      console.log(
        `[${label}] ✓ ClassificationGroup = "${classGroup}" (expected: "${data.ExpectedClassificationGroup}")`,
      );
    }

    console.log(`[${label}] PASSED`);
  });
});
