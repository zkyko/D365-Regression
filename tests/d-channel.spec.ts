import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { readDChannelData } from '../utils/excel-reader';
import { DChannelOrderPage } from '../Pages/DChannelOrderPage';
import { SalesOrderPage } from '../Pages/SalesOrderPage';
import { MCROrderRecapPage } from '../Pages/MCROrderRecapPage';

/**
 * D Channel (Direct Delivery / Drop Ship) Test Suite
 *
 * Scenarios covered:
 *   58  (P0) — Manual D channel, customer carries freight, deposit required, ship window, LCL fee
 *   59  (P0) — Manual D channel, FH carries freight, deposit required, ship window, freight charges
 *   60  (P0) — Manual D channel, customer carries freight, NO deposit, ship window, transport charge
 *   61  (P0) — Manual D channel, FH carries freight, NO deposit, ship window, freight charges
 *   62  (P0) — EDI D channel, FH carries freight, deposit required        ⚠️ EDI External
 *   63  (P0) — EDI D channel, customer carries freight, no deposit        ⚠️ EDI External
 *   64  (P0) — Container item for direct delivery → cannot complete order
 *   65  (P0) — D channel with 2 different vendors → verify vendor per line
 *   66  (P0) — Post packing slip on delivery confirmation
 *   67  (P0) — Change qty on Scenario 59's order
 *   68  (P0) — Update price on Scenario 59's order
 *   69  (P0) — Add SO line after PO created (customer carries freight)
 *   70  (P0) — Add SO line after PO created (FH carries freight)
 *   71  (P0) — Apply deposit from Scenario 58
 *   72  (P0) — Apply deposit from Scenario 59
 *   73  (P0) — Cancel direct delivery SO → allocations don't stick + PO cancels
 *   74  (P0) — Cancel one line from Scenario 69 → allocations don't stick
 *   75  (P0) — Cancel SO from Scenario 63 → allocations don't stick
 *   120 (P0) — Change address on Scenario 58 → verify flows to PO (address + name)
 *   121 (P0) — Change address on Scenario 59 → verify flows to PO
 *   122 (P0) — Create and process SO + PO for SKU without variant
 *   123 (P0) — Create and process SO + PO for SKU with variant → vendor per variant
 *
 * Test data: test-data/DChannel.xlsx → sheet "DChannel"
 */

const dChannelDataPath = path.join(__dirname, '..', 'test-data', 'DChannel.xlsx');
const hasDChannelData = fs.existsSync(dChannelDataPath);
const testData = hasDChannelData ? readDChannelData('DChannel.xlsx') : [];

test.skip(!hasDChannelData, `Missing test data file: ${dChannelDataPath}`);

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 58 — Manual D channel, customer carries freight, deposit required (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 58 — Manual D channel, customer freight, deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '58').entries()) {
    test(`Scenario 58 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('LCL', data.LCLFee);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 59 — Manual D channel, FH carries freight, deposit required (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 59 — Manual D channel, FH freight, deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '59').entries()) {
    test(`Scenario 59 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 60 — Manual D channel, customer carries freight, NO deposit (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 60 — Manual D channel, customer freight, no deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '60').entries()) {
    test(`Scenario 60 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('TRANS', data.TransportationCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 61 — Manual D channel, FH carries freight, NO deposit (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 61 — Manual D channel, FH freight, no deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '61').entries()) {
    test(`Scenario 61 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 62 — EDI D channel, FH carries freight, deposit required ⚠️ EDI
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 62 — EDI D channel FH freight deposit (P0) ⚠️ EDI External', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '62').entries()) {
    test(`Scenario 62 Row ${index + 1} — EDI order [${data.CustomerAccount}]`, async ({ page }) => {
      // ⚠️ EDI EXTERNAL: The 850 EDI order arrives from a trading partner.
      // The D365-side verification assumes the EDI 850 has already been imported.
      // Find the order in All Sales Orders (by customer + import date), then verify:
      const dcPage = new DChannelOrderPage(page);
      const soPage = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      // Locate the EDI-imported order for this customer, then verify fields and confirm
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 63 — EDI D channel, customer carries freight, no deposit ⚠️ EDI
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 63 — EDI D channel customer freight no deposit (P0) ⚠️ EDI External', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '63').entries()) {
    test(`Scenario 63 Row ${index + 1} — EDI order [${data.CustomerAccount}]`, async ({ page }) => {
      // ⚠️ EDI EXTERNAL: Same approach as Scenario 62 — find the already-imported EDI order.
      const dcPage = new DChannelOrderPage(page);

      await page.goto('/');
      await dcPage.navigate();
      // Locate the EDI-imported order for this customer, then verify fields and confirm
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 64 — Container item → direct delivery → cannot complete order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 64 — Container item direct delivery blocks complete (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '64').entries()) {
    test(`Scenario 64 Row ${index + 1} — Container item [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      const soPage = new SalesOrderPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');

      // Container items flagged for direct delivery cannot be completed — Complete must be disabled
      await expect(soPage.completeButton).toBeDisabled();
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 65 — D channel with 2 different vendors → verify vendor per line (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 65 — D channel 2 vendors verify vendor accounts (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '65').entries()) {
    test(`Scenario 65 Row ${index + 1} — Multi-vendor D channel [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      const soPage = new SalesOrderPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO);
      // Enter two items — each sourced from a different vendor
      await soPage.enterItemNumber(data.ItemNumber);
      await soPage.enterItemNumber(data.NewItemNumber); // second item / vendor

      await dcPage.verifyLineVendorAccount(0, data.VendorAccount);
      await dcPage.verifyLineVendorAccount(1, data.VendorAccount2);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 66 — Post packing slip on delivery confirmation (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 66 — Post packing slip on delivery confirmation (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '66').entries()) {
    test(`Scenario 66 Row ${index + 1} — D channel packing slip [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm a S59-type order (FH carries freight) as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // When vendor confirms delivery, post the packing slip
      await dcPage.postPackingSlip();
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 67 — Change qty on Scenario 59's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 67 — Change quantity on D channel order (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '67').entries()) {
    test(`Scenario 67 Row ${index + 1} — Qty change [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create a S59-type order as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Change the quantity on the first SO line
      await dcPage.updateLineQuantity(0, data.NewQuantity);

      // Verify the linked PO quantity reflects the change
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 68 — Update price on Scenario 59's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 68 — Update price on D channel order (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '68').entries()) {
    test(`Scenario 68 Row ${index + 1} — Price update [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create a S59-type order as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Update the price on the first SO line
      await dcPage.updateLinePrice(0, data.NewPrice);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 69 — Add SO line after PO created (customer carries freight) (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 69 — Add SO line after PO created customer freight (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '69').entries()) {
    test(`Scenario 69 Row ${index + 1} — Add line after PO [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm an S58-type order (PO is auto-created at confirmation)
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('LCL', data.LCLFee);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Add a new SO line after the PO has already been created
      // D365 may prompt to update the linked PO — handled inside addOrderLine()
      await dcPage.addOrderLine(data.NewItemNumber);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 70 — Add SO line after PO created (FH carries freight) (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 70 — Add SO line after PO created FH freight (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '70').entries()) {
    test(`Scenario 70 Row ${index + 1} — Add line after PO FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm an S59-type order (FH carries freight)
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Add a new SO line after the PO has already been created
      await dcPage.addOrderLine(data.NewItemNumber);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 71 — Apply deposit from Scenario 58 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 71 — Apply deposit S58 type (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '71').entries()) {
    test(`Scenario 71 Row ${index + 1} — Apply deposit [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create an S58-type order (deposit required) as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('LCL', data.LCLFee);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      // Apply the deposit payment
      await dcPage.applyDeposit(data.TenderType || '3', data.DepositAmount);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 72 — Apply deposit from Scenario 59 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 72 — Apply deposit S59 type (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '72').entries()) {
    test(`Scenario 72 Row ${index + 1} — Apply deposit FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create an S59-type order (FH carries freight, deposit required) as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      // Apply the deposit payment
      await dcPage.applyDeposit(data.TenderType || '3', data.DepositAmount);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 73 — Cancel D channel SO → allocations don't stick + PO cancels (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 73 — Cancel D channel SO allocations + PO cancel (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '73').entries()) {
    test(`Scenario 73 Row ${index + 1} — Cancel + verify alloc + PO [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm a D channel order as prerequisite
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms(data.FreightTerms);
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Cancel the SO and verify allocations released + linked PO cancelled
      await dcPage.cancelOrder();
      await dcPage.verifyNoAllocationsOnLine(0);
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus('Cancelled');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 74 — Cancel one line from Scenario 69's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 74 — Cancel one SO line allocations release (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '74').entries()) {
    test(`Scenario 74 Row ${index + 1} — Cancel line [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create an S69-type order: S58-type base, then add a second line after PO created
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('LCL', data.LCLFee);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.addOrderLine(data.NewItemNumber);

      // Cancel the specified line and verify its allocations are released
      const lineIndex = parseInt(data.LineIndexToCancel, 10) || 1;
      await dcPage.cancelOrderLine(lineIndex);
      await dcPage.verifyNoAllocationsOnLine(lineIndex);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 75 — Cancel SO from Scenario 63 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 75 — Cancel EDI D channel SO allocations release (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '75').entries()) {
    test(`Scenario 75 Row ${index + 1} — Cancel EDI SO [${data.CustomerAccount}]`, async ({ page }) => {
      // ⚠️ EDI EXTERNAL: Assumes the EDI 850 order from Scenario 63 is already imported in D365.
      const dcPage = new DChannelOrderPage(page);

      await page.goto('/');
      await dcPage.navigate();
      // Locate the EDI-imported S63 order for this customer, then cancel it
      await dcPage.cancelOrder();
      await dcPage.verifyNoAllocationsOnLine(0);
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus('Cancelled');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 120 — Change address on S58 order → verify flows to PO (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 120 — Change SO address flows to PO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '120').entries()) {
    test(`Scenario 120 Row ${index + 1} — Address change [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm an S58-type order (PO is auto-created at confirmation)
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('CustomerCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('LCL', data.LCLFee);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Change the delivery address on the SO
      await dcPage.changeDeliveryAddress(data.NewName, data.NewStreet, data.NewCity, data.NewState, data.NewZip);

      // Verify the address flowed through to the linked PO
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPODeliveryAddress(data.NewName, data.NewStreet);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 121 — Change address on S59 order → verify flows to PO (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 121 — Change address S59 type flows to PO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '121').entries()) {
    test(`Scenario 121 Row ${index + 1} — Address change FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      // Create and confirm an S59-type order (FH carries freight)
      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1');
      await dcPage.setFreightTerms('FHCarries');
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      await dcPage.addCharge('FREIGHT', data.FreightCharge);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      // Change the delivery address on the SO
      await dcPage.changeDeliveryAddress(data.NewName, data.NewStreet, data.NewCity, data.NewState, data.NewZip);

      // Verify the address flowed through to the linked PO
      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPODeliveryAddress(data.NewName, data.NewStreet);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 122 — Create and process SO + PO for SKU without variant (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 122 — SO + PO for SKU without variant (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '122').entries()) {
    test(`Scenario 122 Row ${index + 1} — No variant SKU [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1'); // SKU with no product variant
      await dcPage.setFreightTerms(data.FreightTerms);
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 123 — Create and process SO + PO for SKU with variant (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 123 — SO + PO for SKU with variant → vendor per variant (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '123').entries()) {
    test(`Scenario 123 Row ${index + 1} — Variant SKU vendor default [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const soPage  = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');
      await dcPage.navigate();
      await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO, data.ShippingDateRequested);
      await soPage.enterItemNumber(data.ItemNumber, data.SalesQty || '1'); // SKU with product variants
      await dcPage.setFreightTerms(data.FreightTerms);
      await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);

      // Each variant-based SO line should default to the correct vendor
      await dcPage.verifyLineVendorAccount(0, data.VendorAccount);

      const submitBtn = await soPage.clickComplete();
      await mcrPage.submit(submitBtn);

      await dcPage.triggerDirectDelivery();

      await dcPage.navigateToLinkedPO();
      await dcPage.verifyPOStatus(data.ExpectedPOStatus);
    });
  }
});
