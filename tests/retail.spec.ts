import { test, expect } from '@playwright/test';
import { readRetailData } from '../utils/excel-reader';
import { SalesOrderListPage } from '../Pages/SalesOrderListPage';
import { SalesOrderPage }     from '../Pages/SalesOrderPage';
import { MCROrderRecapPage }  from '../Pages/MCROrderRecapPage';
import { ShipmentsPage }      from '../Pages/ShipmentsPage';
import { ShipmentBuilderPage } from '../Pages/ShipmentBuilderPage';

/**
 * Retail Sales Orders Test Suite
 *
 * Scenarios covered:
 *   92 (P0) — Retail SO → pick/pack OUTSIDE shipment builder → invoice
 *             Ensure inventory reflects correctly (cash and carry)
 *   93 (P0) — SO with in-stock item, today's ship date, ONE-TIME customer → create shipment
 *   94 (P0) — Retail SO → pick/pack outside shipment builder → apply existing account credit
 *
 * ─── KEY DIFFERENCE FROM REGULAR SOs ────────────────────────────────────────
 * Scenarios 92 and 94 pick/pack OUTSIDE the Shipment Builder flow.
 * This means the pick/pack is triggered directly from the Sales Order form
 * (not going through Candidate for Shipping → Grouping → Shipment Builder).
 *
 * TODO: Find the "Pick and pack" option directly on the SO Action Pane.
 * It may be under the "Pick and pack" tab on the ribbon, accessible without
 * going through the Shipment Builder.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Test data: test-data/Retail.xlsx → sheet "Retail"
 */

const testData = readRetailData('Retail.xlsx');

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 92 — Retail SO, pick/pack outside SB, invoice, verify inventory (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 92 — Retail SO pick/pack outside SB, invoice (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '92').entries()) {
    test(`Scenario 92 Row ${index + 1} — Retail cash and carry [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const shipPage   = new ShipmentsPage(page);

      await page.goto('/');

      // STEPS 1–5: Create retail SO
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // TODO: Set any retail-specific flags (retail channel, etc.)
      // Retail SOs may have a different channel type than W-channel SOs

      // Complete + MCR payment
      // TODO: MCR payment flow for retail
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard); // or existing CC
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      // Reserve the line
      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // STEP: Pick and pack DIRECTLY from SO form (NOT via Shipment Builder)
      // TODO: Find "Pick and pack" on the SO Action Pane
      // This is the KEY difference for retail — bypasses Shipment Builder
      // await shipPage.pickAndPack(); // may work if buttons are role-based
      // OR: await soPage.pickAndPackFromSO(); // TODO: add to SalesOrderPage.ts

      // STEP: Post packing slip + Invoice
      // await shipPage.postPackingSlip();
      // await shipPage.invoice();

      // VERIFICATION: Document Status = Invoice
      // await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);

      // VERIFICATION: Inventory reduced by the ordered quantity
      // TODO: Check inventory on-hand for the item
      // The physically available qty should have decreased by data.Quantity
      // May need to navigate to: Inventory management → On-hand inventory

      console.log(`✓ Scenario 92 Row ${index + 1}: Retail SO set up. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 92 — INCOMPLETE: Pick/pack directly from SO form (outside SB) locators needed.');
      console.warn('  TODO: Add pickAndPackFromSO() to Pages/SalesOrderPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 93 — SO with in-stock item, today ship date, one-time customer (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 93 — One-time customer SO create shipment (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '93').entries()) {
    test(`Scenario 93 Row ${index + 1} — One-time customer [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const sbPage     = new ShipmentBuilderPage(page);

      await page.goto('/');

      // NOTE: "One-time customer" in D365 is typically a generic catch-all customer account
      // with a different delivery name/address entered per order.
      // OR: It could be a specific customer type flag. Check with the business.
      //
      // TODO: Find the "one-time customer" setup:
      //   - May be a specific account like "ONEOFF" or "CASH"
      //   - Or the new SO dialog may have a "One-time customer" checkbox
      //   - Or it requires entering a delivery address override per order

      // STEPS: Create SO for one-time customer with in-stock item
      await soListPage.navigate();
      await soListPage.clickNew();

      // TODO: Handle one-time customer creation in the New SO dialog
      // await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      // If one-time customer needs a specific name/address, fill those here

      await soPage.enterItemNumber(data.ItemNumber);

      // TODO: Requested ship date should be TODAY
      // Verify this is already set or explicitly set it
      // await soPage.setRequestedShipDate('today');

      // Complete + MCR + Submit
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // Create shipment (goes through standard Shipment Builder)
      // CFS → Grouping → SB → Create shipment
      await sbPage.navigate();
      const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();

      console.log(`✓ Scenario 93 Row ${index + 1}: One-time customer SO + shipment. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 93 — INCOMPLETE: One-time customer setup locators needed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 94 — Retail SO, pick/pack outside SB, apply account credit (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 94 — Retail SO pick/pack outside SB + apply account credit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '94').entries()) {
    test(`Scenario 94 Row ${index + 1} — Retail + account credit [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const shipPage   = new ShipmentsPage(page);

      await page.goto('/');

      // PREREQUISITE: Customer must have existing on-account credit
      // (Set up via Scenario 80/81 or ensure credit exists in test data)

      // STEPS: Create retail SO
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // In MCR → select the existing on-account credit as payment
      // TODO: mcrPage.selectOnAccountPayment(data.CreditToApply)
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.selectOnAccountPayment(data.CreditToApply);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // Pick/pack directly from SO (not via Shipment Builder)
      // TODO: soPage.pickAndPackFromSO() — same as Scenario 92
      // await shipPage.postPackingSlip();
      // await shipPage.invoice();
      // await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);

      console.log(`✓ Scenario 94 Row ${index + 1}: Retail SO + account credit. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 94 — INCOMPLETE: On-account payment in MCR + pick/pack from SO form.');
    });
  }
});
