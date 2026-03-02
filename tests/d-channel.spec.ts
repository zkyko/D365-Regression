import { test, expect } from '@playwright/test';
import { readDChannelData } from '../utils/excel-reader';
import { DChannelOrderPage } from '../Pages/DChannelOrderPage';
import { SalesOrderPage }    from '../Pages/SalesOrderPage';
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
 * ─── IMPORTANT: D Channel is an entirely new POM area ────────────────────────
 * ALL methods in DChannelOrderPage.ts are stubbed with TODO comments.
 * Before any test in this file can run, the DChannelOrderPage locators must
 * be confirmed by navigating D365 with Playwright MCP.
 *
 * See: Pages/DChannelOrderPage.ts → HOW TO FIND LOCATORS section.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Test data: test-data/DChannel.xlsx → sheet "DChannel"
 */

const testData = readDChannelData('DChannel.xlsx');

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 58 — Manual D channel, customer carries freight, deposit required (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 58 — Manual D channel, customer freight, deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '58').entries()) {
    test(`Scenario 58 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage  = new DChannelOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);

      await page.goto('/');

      // TODO: Create new D channel order
      // await dcPage.navigate();
      // await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO);

      // TODO: Set freight terms — customer carries
      // await dcPage.setFreightTerms('CustomerCarries');

      // TODO: Enter item number (direct delivery item)
      // Item should auto-set direct delivery flag on the line

      // TODO: Set ship window
      // await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);

      // TODO: Add LCL fee charge
      // await dcPage.addCharge('LCL', data.LCLFee);

      // TODO: Complete order (deposit required — check MCR dialog)
      // const submitBtn = await dcPage.clickComplete(); // or similar
      // Handle deposit in MCR if needed

      // TODO: Confirm order → verify linked PO is created
      // await dcPage.confirmOrder();

      // TODO: Navigate to linked PO and verify status
      // const poNumber = await dcPage.navigateToLinkedPO();
      // await dcPage.verifyPOStatus(data.ExpectedPOStatus);

      console.warn('⚠ Scenario 58 — INCOMPLETE: DChannelOrderPage locators not yet confirmed. See Pages/DChannelOrderPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 59 — Manual D channel, FH carries freight, deposit required (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 59 — Manual D channel, FH freight, deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '59').entries()) {
    test(`Scenario 59 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Same as Scenario 58 but:
      //   - FreightTerms = FH carries (not customer)
      //   - Add freight charges (not LCL)

      // await dcPage.navigate();
      // await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO);
      // await dcPage.setFreightTerms('FHCarries');
      // await dcPage.setShipWindow(data.ShipWindowFrom, data.ShipWindowTo);
      // await dcPage.addCharge('FREIGHT', data.FreightCharge);
      // (Complete + confirm same as S58)

      console.warn('⚠ Scenario 59 — INCOMPLETE: DChannelOrderPage locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 60 — Manual D channel, customer carries freight, NO deposit (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 60 — Manual D channel, customer freight, no deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '60').entries()) {
    test(`Scenario 60 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Same pattern — customer carries freight, transportation charge, no deposit
      // await dcPage.addCharge('TRANS', data.TransportationCharge);

      console.warn('⚠ Scenario 60 — INCOMPLETE: DChannelOrderPage locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 61 — Manual D channel, FH carries freight, NO deposit (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 61 — Manual D channel, FH freight, no deposit (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '61').entries()) {
    test(`Scenario 61 Row ${index + 1} — [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');
      // TODO: FH carries freight, freight charges, no deposit
      console.warn('⚠ Scenario 61 — INCOMPLETE: DChannelOrderPage locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 62 — EDI D channel, FH carries freight, deposit required ⚠️ EDI
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 62 — EDI D channel FH freight deposit (P0) ⚠️ EDI External', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '62').entries()) {
    test(`Scenario 62 Row ${index + 1} — EDI order [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // ⚠️ EDI EXTERNAL: The 850 EDI order arrives from a trading partner.
      // Cannot trigger EDI from D365 UI.
      //
      // TODO (D365 side only):
      // Given a known EDI 850 order already imported to D365:
      // 1. Find the order in All Sales Orders by customer + date
      // 2. Verify freight terms = FH carries
      // 3. Verify deposit is set
      // 4. Verify ship window is populated
      // 5. Proceed with standard confirm + PO verification

      console.warn('⚠ Scenario 62 — PARTIAL (EDI external). D365 verification only after EDI import.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 63 — EDI D channel, customer carries freight, no deposit ⚠️ EDI
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 63 — EDI D channel customer freight no deposit (P0) ⚠️ EDI External', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '63').entries()) {
    test(`Scenario 63 Row ${index + 1} — EDI order [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');
      // ⚠️ EDI EXTERNAL — same approach as Scenario 62
      console.warn('⚠ Scenario 63 — PARTIAL (EDI external). D365 verification only after EDI import.');
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
      await page.goto('/');

      // TODO: Steps:
      // 1. Set up item at item master for direct delivery (container-specific)
      //    This may require going to Item master first — separate POM may be needed
      // 2. Create a W channel order with this item
      // 3. Verify direct delivery flag is set at the item line
      // 4. Try to click "Complete" — it should be blocked/greyed out or show an error

      // TODO: Add verifyCompleteButtonDisabled() or similar check
      // await expect(page.locator('button[name="CompleteSales"]')).toBeDisabled();

      console.warn('⚠ Scenario 64 — INCOMPLETE: Container item setup + Complete block verification needed.');
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
      await page.goto('/');

      // TODO:
      // 1. Create D channel SO with 2 lines (each item from different vendor)
      // 2. Verify line 0 has VendorAccount1
      // 3. Verify line 1 has VendorAccount2

      // await dcPage.createNewOrder(data.CustomerAccount, data.CustomerPO);
      // Add 2 items from different vendors
      // await dcPage.verifyLineVendorAccount(0, data.VendorAccount1);
      // await dcPage.verifyLineVendorAccount(1, data.VendorAccount2);

      console.warn('⚠ Scenario 65 — INCOMPLETE: Multi-vendor D channel locators not yet confirmed.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 66 — Post packing slip on delivery confirmation (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 66 — Post packing slip on delivery confirmation (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '66').entries()) {
    test(`Scenario 66 Row ${index + 1} — D channel packing slip [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create D channel SO (like Scenario 59) and confirm it
      // When vendor confirms delivery, post the packing slip

      // TODO: Navigate to confirmed D channel SO
      // await dcPage.postPackingSlip();

      console.warn('⚠ Scenario 66 — INCOMPLETE: D channel post packing slip.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 67 — Change qty on Scenario 59's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 67 — Change quantity on D channel order (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '67').entries()) {
    test(`Scenario 67 Row ${index + 1} — Qty change [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create same type of order as Scenario 59
      // (FH carries freight, deposit required, freight charges)
      // Then change the quantity

      // TODO: Create S59-type order first
      // await dcPage.updateLineQuantity(0, data.NewQuantity);

      // TODO: Verify the linked PO quantity also updated
      // await dcPage.navigateToLinkedPO();
      // Check PO line quantity matches new SO quantity

      console.warn('⚠ Scenario 67 — INCOMPLETE: D channel quantity change.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 68 — Update price on Scenario 59's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 68 — Update price on D channel order (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '68').entries()) {
    test(`Scenario 68 Row ${index + 1} — Price update [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Create S59-type order, then update price
      // await dcPage.updateLinePrice(0, data.NewPrice);

      console.warn('⚠ Scenario 68 — INCOMPLETE: D channel price update.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 69 — Add SO line after PO created (customer carries freight) (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 69 — Add SO line after PO created customer freight (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '69').entries()) {
    test(`Scenario 69 Row ${index + 1} — Add line after PO [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Create S58-type order (customer carries freight, deposit)
      // Confirm the order (PO is auto-created at this point)
      // Then add a new SO line
      // Note: Adding line after PO may trigger a PO update dialog

      // await dcPage.addOrderLine(data.NewItemNumber);
      // Handle any "update PO?" confirmation dialog

      console.warn('⚠ Scenario 69 — INCOMPLETE: Add SO line after PO created.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 70 — Add SO line after PO created (FH carries freight) (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 70 — Add SO line after PO created FH freight (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '70').entries()) {
    test(`Scenario 70 Row ${index + 1} — Add line after PO FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Same as Scenario 69 but FH carries freight (S59-type order)

      console.warn('⚠ Scenario 70 — INCOMPLETE: Add SO line after PO, FH freight.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 71 — Apply deposit from Scenario 58 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 71 — Apply deposit S58 type (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '71').entries()) {
    test(`Scenario 71 Row ${index + 1} — Apply deposit [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create S58-type order (deposit required)
      // Then apply the deposit payment

      // TODO: Find and use deposit flow
      // await dcPage.applyDeposit(data.DepositAmount);

      console.warn('⚠ Scenario 71 — INCOMPLETE: Deposit apply flow not yet implemented.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 72 — Apply deposit from Scenario 59 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 72 — Apply deposit S59 type (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '72').entries()) {
    test(`Scenario 72 Row ${index + 1} — Apply deposit FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');
      // TODO: Same as Scenario 71 but S59-type
      console.warn('⚠ Scenario 72 — INCOMPLETE: Deposit apply flow (FH carries freight).');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 73 — Cancel D channel SO → allocations don't stick + PO cancels (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 73 — Cancel D channel SO allocations + PO cancel (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '73').entries()) {
    test(`Scenario 73 Row ${index + 1} — Cancel + verify alloc + PO [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create any D channel order and confirm it
      // STEPS: Cancel the SO
      // await dcPage.cancelOrder();

      // VERIFICATION:
      // 1. SO is cancelled
      // 2. Allocations on all lines are 0 (don't stick)
      // 3. Related PO status = Cancelled

      // await dcPage.verifyNoAllocationsOnLine(0);
      // const poNumber = await dcPage.navigateToLinkedPO();
      // await dcPage.verifyPOStatus('Cancelled');

      console.warn('⚠ Scenario 73 — INCOMPLETE: D channel cancel + PO cancel verification.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 74 — Cancel one line from Scenario 69's order (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 74 — Cancel one SO line allocations release (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '74').entries()) {
    test(`Scenario 74 Row ${index + 1} — Cancel line [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create S69-type order (with multiple lines, after PO created)
      // STEPS: Cancel one line
      // await dcPage.cancelOrderLine(data.LineIndexToCancel ?? 1);
      // await dcPage.verifyNoAllocationsOnLine(data.LineIndexToCancel ?? 1);

      console.warn('⚠ Scenario 74 — INCOMPLETE: Cancel line + allocation release.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 75 — Cancel SO from Scenario 63 (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 75 — Cancel EDI D channel SO allocations release (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '75').entries()) {
    test(`Scenario 75 Row ${index + 1} — Cancel EDI SO [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');
      // ⚠️ EDI prerequisite: Need EDI order from Scenario 63 type
      // TODO: Find the EDI order and cancel it, verify allocations
      console.warn('⚠ Scenario 75 — INCOMPLETE: Cancel EDI D channel SO.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 120 — Change address on S58 order → verify flows to PO (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 120 — Change SO address flows to PO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '120').entries()) {
    test(`Scenario 120 Row ${index + 1} — Address change [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // PREREQUISITE: Create S58-type order and confirm (PO auto-created)
      // STEPS: Change delivery address on SO
      // await dcPage.changeDeliveryAddress(data.NewName, data.NewStreet, data.NewCity, data.NewState, data.NewZip);

      // VERIFICATION: Navigate to linked PO and verify address updated (name + address)
      // await dcPage.navigateToLinkedPO();
      // await dcPage.verifyPODeliveryAddress(data.NewName, data.NewStreet);

      console.warn('⚠ Scenario 120 — INCOMPLETE: Address change flows to PO.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 121 — Change address on S59 order → verify flows to PO (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 121 — Change address S59 type flows to PO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '121').entries()) {
    test(`Scenario 121 Row ${index + 1} — Address change FH [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');
      // TODO: Same as Scenario 120 but S59-type order
      console.warn('⚠ Scenario 121 — INCOMPLETE: Address change S59 type flows to PO.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 122 — Create and process SO + PO for SKU without variant (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 122 — SO + PO for SKU without variant (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '122').entries()) {
    test(`Scenario 122 Row ${index + 1} — No variant SKU [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Create D channel SO with a SKU that has no product variant
      // Confirm order → verify PO created correctly
      // Process through to packing slip / invoice

      console.warn('⚠ Scenario 122 — INCOMPLETE: SKU without variant D channel flow.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 123 — Create and process SO + PO for SKU with variant (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 123 — SO + PO for SKU with variant → vendor per variant (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '123').entries()) {
    test(`Scenario 123 Row ${index + 1} — Variant SKU vendor default [${data.CustomerAccount}]`, async ({ page }) => {
      const dcPage = new DChannelOrderPage(page);
      await page.goto('/');

      // TODO: Create D channel SO with a SKU that HAS product variants
      // Each variant should default to the correct vendor at the SO line level
      // Verify: each line's vendor account matches the variant's configured vendor

      // Also covers the "unlinked SO and PO through BW" variant from the second S123 row

      console.warn('⚠ Scenario 123 — INCOMPLETE: Variant SKU vendor defaulting + BW flow.');
    });
  }
});
