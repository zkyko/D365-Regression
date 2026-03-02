import { test, expect } from '@playwright/test';
import { readShipmentBuilderData } from '../utils/excel-reader';
import { SalesOrderListPage }      from '../Pages/SalesOrderListPage';
import { SalesOrderPage }          from '../Pages/SalesOrderPage';
import { MCROrderRecapPage }       from '../Pages/MCROrderRecapPage';
import { CandidateForShippingPage } from '../Pages/CandidateForShippingPage';
import { GroupingPage }            from '../Pages/GroupingPage';
import { ShipmentBuilderPage }     from '../Pages/ShipmentBuilderPage';
import { ShipmentsPage }           from '../Pages/ShipmentsPage';

/**
 * Shipment Builder Test Suite
 *
 * Scenarios covered:
 *   21  (P0) — Create shipment from a website-type SO (like Scenario 2)
 *   30  (P0) — WMS picks/ships shipment from Scenario 21   ⚠️ EXTERNAL (Korber WMS)
 *   35  (P0) — WMS picks/ships from Scenario 26            ⚠️ EXTERNAL (Korber WMS)
 *   36  (P0) — WMS picks/ships from Scenario 27            ⚠️ EXTERNAL (Korber WMS)
 *   37  (P0) — WMS picks/ships from Scenario 28            ⚠️ EXTERNAL (Korber WMS)
 *   38  (P0) — Invoice shipment from Scenario 20
 *   39  (P0) — Invoice shipment from Scenario 21
 *   40  (P0) — Invoice shipment from Scenario 22
 *   41  (P0) — Invoice shipment from Scenario 23
 *   42  (P0) — Invoice shipment from Scenario 24
 *   43  (P0) — Invoice shipment from Scenario 25
 *   44  (P0) — Invoice shipment from Scenario 26
 *   45  (P0) — Invoice shipment from Scenario 27
 *   46  (P0) — Invoice shipment from Scenario 28
 *   89  (P1) — Small art, FedEx ground, third party → verify Korber
 *   90  (P1) — Large art, LTL, not in stock → verify Korber
 *   91  (P1) — Art + furniture, LTL, third party → verify Korber
 *   117 (P0) — Cancel shipment → re-shipment → release to Korber
 *
 * Strategy for "from Scenario X" tests:
 *   Each test creates its own fresh SO of the same type as the referenced scenario.
 *   This ensures tests are independent and runnable in any order.
 *
 * Test data: test-data/ShipmentBuilder.xlsx → sheet "ShipmentBuilder"
 */

const testData = readShipmentBuilderData('ShipmentBuilder.xlsx');

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 21 — Create shipment from website SO (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 21 — Create shipment from website SO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '21').entries()) {
    test(`Scenario 21 Row ${index + 1} — Create shipment [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const cfsPage    = new CandidateForShippingPage(page);
      const grpPage    = new GroupingPage(page);
      const sbPage     = new ShipmentBuilderPage(page);

      await page.goto('/');

      // PREREQUISITE: Create a website SO (same type as Scenario 2)
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);

      // TODO: Set Order Source = WEB, Ship Complete = Yes (Scenario 2 TODO 1)
      // await soPage.setSellOptions('WEB', 'Yes');

      await soPage.enterItemNumber(data.ItemNumber);
      await soPage.setShipType(data.ShipType);

      // TODO: Complete → MCR → select existing CC → Submit
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.selectExistingCreditCard(data.ExistingCC);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // STEPS: Candidate for shipping → Today filter
      await cfsPage.navigate();
      // TODO: Filter by today (Scenario 2 TODO 3)
      // await cfsPage.filterByToday('Requested ship date');

      // Grouping
      await grpPage.navigate();
      await grpPage.run();

      // Shipment Builder → create shipment
      await sbPage.navigate();
      const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();

      // VERIFICATION: Koerber status should be "Released"
      await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus);

      console.log(`✓ Scenario 21 Row ${index + 1}: Shipment created. SO: ${salesOrderNumber}, GRP: ${grpNumber}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 30 — WMS picks/ships shipment from Scenario 21  ⚠️ EXTERNAL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 30 — WMS pick/ship from S21 (P0) ⚠️ WMS External', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '30').entries()) {
    test(`Scenario 30 Row ${index + 1} — Verify WMS sent pick/ship to D365 [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // ⚠️ EXTERNAL SYSTEM (Korber WMS):
      // Korber performs the physical pick and ship. D365 receives the confirmation.
      // This test can only VERIFY that D365 received the WMS confirmation correctly.
      //
      // TODO (D365 side only):
      // 1. Navigate to the shipment that was created in Scenario 21
      // 2. Verify shipment status = "Shipped" (after Korber sends confirmation)
      // 3. Verify picking list shows as completed
      //
      // The actual WMS pick/ship trigger CANNOT be automated here.

      console.warn('⚠ Scenario 30 — PARTIAL: Korber WMS is external. Only D365 status verification is automatable.');
      console.warn('  After Korber processes the pick/ship, verify D365 SO/Shipment status reflects it.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIOS 35–37 — WMS picks/ships from Scenarios 26–28  ⚠️ EXTERNAL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenarios 35–37 — WMS pick/ship (P0) ⚠️ WMS External', () => {
  for (const scenarioId of ['35', '36', '37']) {
    test(`Scenario ${scenarioId} — WMS pick/ship verification`, async ({ page }) => {
      await page.goto('/');
      // ⚠️ EXTERNAL SYSTEM (Korber WMS) — same approach as Scenario 30
      console.warn(`⚠ Scenario ${scenarioId} — PARTIAL: Korber WMS is external. D365 status verification only.`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIOS 38–46 — Invoice shipments from Scenarios 20–28 (P0)
// Each test: create fresh SO → full shipment builder flow → invoice
// ═══════════════════════════════════════════════════════════════════════════
for (const scenarioId of ['38', '39', '40', '41', '42', '43', '44', '45', '46']) {
  test.describe(`Scenario ${scenarioId} — Invoice shipment (P0)`, () => {
    for (const [index, data] of testData.filter(r => r.ScenarioID === scenarioId).entries()) {
      test(`Scenario ${scenarioId} Row ${index + 1} — Invoice [${data.CustomerAccount}]`, async ({ page }) => {
        const soListPage = new SalesOrderListPage(page);
        const soPage     = new SalesOrderPage(page);
        const mcrPage    = new MCROrderRecapPage(page);
        const cfsPage    = new CandidateForShippingPage(page);
        const grpPage    = new GroupingPage(page);
        const sbPage     = new ShipmentBuilderPage(page);
        const shipPage   = new ShipmentsPage(page);

        await page.goto('/');

        // PREREQUISITE: Create fresh SO of the appropriate type
        await soListPage.navigate();
        await soListPage.clickNew();
        await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
        await soPage.enterItemNumber(data.ItemNumber);
        await soPage.setShipType(data.ShipType);

        // TODO: Complete → MCR → payment → Submit
        // const submitBtn = await soPage.clickComplete();
        // await mcrPage.addCreditCard(data.CreditCard); // or selectExistingCC
        // await mcrPage.submit(submitBtn);

        const salesOrderNumber = await soPage.captureSalesOrderNumber();

        await soPage.goToLinesTab();
        await soPage.reserveAllSubLines(data.ItemNumber, 0);
        await soPage.confirmNow();

        // Candidate for shipping → Grouping → Shipment Builder
        await cfsPage.navigate();
        await cfsPage.filterBySalesOrder(salesOrderNumber);

        await grpPage.navigate();
        await grpPage.run();

        await sbPage.navigate();
        const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
        await sbPage.createShipment();

        // Pick and pack flow
        // TODO: click sales order link back from shipment builder (Scenario 2 TODO 4)
        // await sbPage.clickSalesOrderLink();
        // await shipPage.pickAndPack();

        // POST PACKING SLIP + INVOICE
        // TODO: uncomment after pick/pack is resolved
        // await shipPage.postPackingSlip();
        // await shipPage.invoice();

        // VERIFICATION: Document Status = Invoice
        // TODO: uncomment after invoice is done
        // await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);

        console.log(`✓ Scenario ${scenarioId} Row ${index + 1}: Invoice flow set up. SO: ${salesOrderNumber}`);
        console.warn(`⚠ Scenario ${scenarioId} — INCOMPLETE: pick/pack + invoice steps pending Scenario 2 TODO 4 resolution.`);
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 89 — Small art, FedEx ground, third party carrier (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 89 — Small art FedEx ground shipment (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '89').entries()) {
    test(`Scenario 89 Row ${index + 1} — Small art parcel FedEx [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const sbPage     = new ShipmentBuilderPage(page);

      await page.goto('/');

      // STEPS: Create SO with small art item (parcel-eligible)
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber); // must be small art item

      // TODO: Set delivery terms to "Third party" and carrier to "FedEx Ground"
      // These may be on the Header tab or a Delivery section
      // await soPage.setDeliveryTerms('ThirdParty');
      // await soPage.setCarrier('FedExGround');

      // TODO: Complete → MCR → payment → Submit
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard);
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // Create shipment
      await sbPage.navigate();
      const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();

      // VERIFICATION: Check Korber status (parcel items may have different status)
      await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus);

      console.log(`✓ Scenario 89 Row ${index + 1}: Small art shipment created. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 89 — INCOMPLETE: delivery terms / carrier locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 90 — Large art, LTL, not in stock (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 90 — Large art LTL not in stock (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '90').entries()) {
    test(`Scenario 90 Row ${index + 1} — Large art LTL [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // STEPS: Create SO with large art item (LTL), item NOT in stock
      // TODO: Create SO with out-of-stock large art item
      // TODO: Set delivery terms = Third party, carrier = LTL
      // Create shipment and check Korber behavior for out-of-stock item

      console.warn('⚠ Scenario 90 — INCOMPLETE (P1): Large art LTL, out of stock item.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 91 — Art + furniture, LTL, third party (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 91 — Art + furniture LTL third party (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '91').entries()) {
    test(`Scenario 91 Row ${index + 1} — Art + furniture LTL [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // STEPS: Create SO with both art and furniture items (multi-line)
      // TODO: Create SO with 2 lines (art item + furniture item)
      // TODO: Set delivery terms = Third party, carrier = LTL
      // Create shipment and check Korber

      console.warn('⚠ Scenario 91 — INCOMPLETE (P1): Art + furniture multi-line LTL.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 117 — Cancel shipment → re-create on new shipment → release to Korber (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 117 — Cancel shipment and re-create (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '117').entries()) {
    test(`Scenario 117 Row ${index + 1} — Cancel + re-create shipment [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const cfsPage    = new CandidateForShippingPage(page);
      const grpPage    = new GroupingPage(page);
      const sbPage     = new ShipmentBuilderPage(page);

      await page.goto('/');

      // PREREQUISITE: Create SO → run through to Shipment Builder (create shipment)
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);
      await soPage.setShipType(data.ShipType);

      // TODO: Complete + MCR payment
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.submit(submitBtn);

      const salesOrderNumber = await soPage.captureSalesOrderNumber();
      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      await cfsPage.navigate();
      // TODO: filter by today or by SO number
      await grpPage.navigate();
      await grpPage.run();
      await sbPage.navigate();
      await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();

      // STEP: Cancel the shipment
      // TODO: Find cancel shipment button on the Shipment Builder or Shipments page
      // Likely: Action Pane → "Shipments" tab → "Cancel shipment"
      // await sbPage.cancelShipment(); // TODO: add this method to ShipmentBuilderPage.ts

      // STEP: Put the SO on a new shipment and release to Korber
      // After cancelling, the SO should be available again in Candidate for Shipping
      // Re-run: Candidate for shipping → Grouping → Shipment Builder → Create shipment
      // TODO: navigate back and re-run CFS → Grouping → SB
      // await cfsPage.navigate();
      // await grpPage.navigate();
      // await grpPage.run();
      // await sbPage.navigate();
      // await sbPage.selectGrpRow(data.CustomerAccount);
      // await sbPage.createShipment();
      // await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus);

      console.log(`✓ Scenario 117 Row ${index + 1}: Cancel/re-create shipment set up. SO: ${salesOrderNumber}`);
      console.warn('⚠ Scenario 117 — INCOMPLETE (P0): cancelShipment() method not yet added to ShipmentBuilderPage.ts');
      console.warn('  TODO: Add cancelShipment() to Pages/ShipmentBuilderPage.ts');
    });
  }
});
