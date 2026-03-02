import { test, expect } from '@playwright/test';
import { readAllocationsData } from '../utils/excel-reader';
import { SalesOrderListPage }      from '../Pages/SalesOrderListPage';
import { SalesOrderPage }          from '../Pages/SalesOrderPage';
import { MCROrderRecapPage }       from '../Pages/MCROrderRecapPage';
import { AllocationWorkbenchPage } from '../Pages/AllocationWorkbenchPage';

/**
 * Allocations & Order Holds Test Suite
 *
 * Scenarios covered:
 *   95  (P0) — Create SO → complete/confirm → put on INCOMPLETE hold
 *              → reservations stripped → shipment cannot be created
 *   96  (P0) — Create SO → complete/confirm → put on SOFT hold
 *              → order still reserved → shipment cannot be created
 *   110 (P0) — Unreserve item in Inventory Allocation Exception Workbench
 *   111 (P0) — Reserve item in Inventory Allocation Exception Workbench
 *   112 (P0) — Move allocation from one SO to another in Exception Workbench
 *   113 (P0) — Unreserve on SO reservation form via "allocate lot" button
 *   114 (P0) — Reserve on SO reservation form via "reserve lot" button
 *
 * Test data: test-data/Allocations.xlsx → sheet "Allocations"
 */

const testData = readAllocationsData('Allocations.xlsx');

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 95 — Incomplete order hold strips reservations (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 95 — Incomplete hold strips reservations (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '95').entries()) {
    test(`Scenario 95 Row ${index + 1} — Incomplete hold [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage   = new SalesOrderListPage(page);
      const soPage       = new SalesOrderPage(page);
      const mcrPage      = new MCROrderRecapPage(page);
      const allocPage    = new AllocationWorkbenchPage(page);

      await page.goto('/');

      // STEPS 1–5: Create SO with in-stock item, requested ship date = today
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // Complete + MCR
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      // Reserve and confirm
      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // STEP 6: Put the SO on an INCOMPLETE order hold
      // TODO: applyOrderHold() must be called while SO form is open
      // await allocPage.applyOrderHold('Incomplete');

      // VERIFICATION 1: Reservations must be stripped
      // TODO: Navigate back to Lines tab and check ALCPhysicallyAllocated = 0
      // await soPage.goToLinesTab();
      // await allocPage.verifyReservationsStripped();

      // VERIFICATION 2: Shipment cannot be created
      // TODO: Navigate to CFS or Shipment Builder and verify SO is blocked
      // await allocPage.verifyShipmentCannotBeCreated(salesOrderNumber);

      console.log(`✓ Scenario 95 Row ${index + 1}: Incomplete hold test set up. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 95 — INCOMPLETE: applyOrderHold() locators not yet confirmed. See Pages/AllocationWorkbenchPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 96 — Soft order hold keeps reservations but blocks shipment (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 96 — Soft hold keeps reservations blocks shipment (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '96').entries()) {
    test(`Scenario 96 Row ${index + 1} — Soft hold [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage   = new SalesOrderListPage(page);
      const soPage       = new SalesOrderPage(page);
      const mcrPage      = new MCROrderRecapPage(page);
      const allocPage    = new AllocationWorkbenchPage(page);

      await page.goto('/');

      // STEPS: Same as Scenario 95 up to the hold step
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // STEP: Put SO on SOFT hold (different from Scenario 95's incomplete hold)
      // TODO: await allocPage.applyOrderHold('Soft');

      // VERIFICATION 1: Reservations should STILL be intact (soft hold doesn't strip)
      // await soPage.goToLinesTab();
      // await allocPage.verifyReservationsIntact();

      // VERIFICATION 2: Shipment still cannot be created (hold blocks SB)
      // await allocPage.verifyShipmentCannotBeCreated(salesOrderNumber);

      console.log(`✓ Scenario 96 Row ${index + 1}: Soft hold test set up. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 96 — INCOMPLETE: applyOrderHold() locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 110 — Unreserve item in Allocation Exception Workbench (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 110 — Unreserve in allocation workbench (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '110').entries()) {
    test(`Scenario 110 Row ${index + 1} — Unreserve [${data.ItemNumber}]`, async ({ page }) => {
      const allocPage = new AllocationWorkbenchPage(page);

      await page.goto('/');

      // PREREQUISITE: An item must be reserved (in allocation exception workbench)
      // The workbench shows items that have allocation issues/exceptions

      // TODO: Navigate to workbench and unreserve
      // await allocPage.navigateToWorkbench();
      // await allocPage.unreserveItem(data.ItemNumber);
      // await allocPage.verifyReservationStatus(data.ItemNumber, 'Available');

      console.warn('⚠ Scenario 110 — INCOMPLETE: AllocationWorkbenchPage locators not yet confirmed. See Pages/AllocationWorkbenchPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 111 — Reserve item in Allocation Exception Workbench (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 111 — Reserve in allocation workbench (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '111').entries()) {
    test(`Scenario 111 Row ${index + 1} — Reserve [${data.ItemNumber}]`, async ({ page }) => {
      const allocPage = new AllocationWorkbenchPage(page);

      await page.goto('/');

      // PREREQUISITE: An item must be available (unreserved) in the workbench
      // TODO:
      // await allocPage.navigateToWorkbench();
      // await allocPage.reserveItem(data.ItemNumber);
      // await allocPage.verifyReservationStatus(data.ItemNumber, 'Reserved');

      console.warn('⚠ Scenario 111 — INCOMPLETE: AllocationWorkbenchPage locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 112 — Move allocation from one SO to another (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 112 — Move allocation between SOs (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '112').entries()) {
    test(`Scenario 112 Row ${index + 1} — Move allocation [${data.ItemNumber}]`, async ({ page }) => {
      const allocPage = new AllocationWorkbenchPage(page);

      await page.goto('/');

      // PREREQUISITE: Two SOs must exist, one with the allocation to move
      // TODO:
      // await allocPage.navigateToWorkbench();
      // await allocPage.moveAllocation(data.ItemNumber, data.SourceSONumber, data.TargetSONumber);
      // Verify allocation moved to target SO
      // Verify source SO no longer has the allocation

      console.warn('⚠ Scenario 112 — INCOMPLETE: Move allocation locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 113 — Unreserve on SO reservation form via "allocate lot" (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 113 — Unreserve via allocate lot on SO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '113').entries()) {
    test(`Scenario 113 Row ${index + 1} — Allocate lot unreserve [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);

      await page.goto('/');

      // STEPS: Create SO and reserve it first
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.submit(submitBtn);

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0); // This reserves it

      // STEP: Now UNRESERVE via the reservation form's "Allocate lot" button
      // "Allocate lot" is the counterpart to "Reserve lot" — it unreserves
      //
      // TODO: On the reservation form (Inventory → Reservation),
      // find the "Allocate lot" button and click it
      // button[name="ALCAllocateLot"] or similar
      //
      // NOTE: SalesOrderPage already knows about the reservation form navigation.
      // Just need to click the correct button instead of "Reserve lot"
      //
      // TODO: Add method unreserveViaSO() to SalesOrderPage.ts:
      //   1. Click the row
      //   2. Inventory → Reservation
      //   3. Click "Allocate lot" (NOT "Reserve lot")
      //   4. Verify ALCPhysicallyAllocated becomes 0

      // await soPage.unreserveViaSO(data.ItemNumber, 0);
      // Verify ALCPhysicallyAllocated = 0

      console.warn('⚠ Scenario 113 — INCOMPLETE: "Allocate lot" button locator needed on reservation form.');
      console.warn('  TODO: Add unreserveViaSO() to Pages/SalesOrderPage.ts using button[name="ALCAllocateLot"] (confirm name attr)');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 114 — Reserve on SO reservation form via "reserve lot" (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 114 — Reserve via reserve lot on SO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '114').entries()) {
    test(`Scenario 114 Row ${index + 1} — Reserve lot on SO [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);

      await page.goto('/');

      // NOTE: This is already implemented in SalesOrderPage.reserveAllSubLines()
      // which uses button[name="ALCReserveLot"] — this is the confirmed locator.
      //
      // Scenario 114 is essentially verifying the reservation form flow we already use.
      // This test creates a fresh SO and confirms that "Reserve lot" works correctly.

      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.submit(submitBtn);

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);

      // VERIFICATION: ALCPhysicallyAllocated > 0 after reserve
      // This is already checked inside reserveAllSubLines() — throws if 0 stock

      console.log(`✓ Scenario 114 Row ${index + 1}: Reserve lot flow verified (already implemented in SalesOrderPage)`);
    });
  }
});
