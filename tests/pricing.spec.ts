import { test, expect } from '@playwright/test';
import { readPricingData } from '../utils/excel-reader';
import { SalesOrderListPage }  from '../Pages/SalesOrderListPage';
import { SalesOrderPage }      from '../Pages/SalesOrderPage';
import { MCROrderRecapPage }   from '../Pages/MCROrderRecapPage';
import { PricingPage }         from '../Pages/PricingPage';

/**
 * Pricing Test Suite
 *
 * Scenarios covered:
 *   11  (P0) — Verify pricing is correct on a website SO (like Scenario 2)
 *   55  (P0) — Price override on SO line → ensure reason code prompt appears
 *   98  (P1) — Web order with MSA coupon → verify price
 *   99  (P1) — Web order with MSA coupon + Amber Lewis SKUs (no discount)
 *   100 (P2) — Web order with LTO item + coupon
 *   101 (P3) — Web order with hardmark → manually override price
 *   102 (P0) — 3 Wayfair orders → verify 850 EDI price  ⚠️ EDI — partial
 *   103 (P0) — 3 West Elm Lulu orders → verify price    ⚠️ EDI — partial
 *   104 (P0) — 3 Lumens orders → verify price           ⚠️ EDI — partial
 *   105 (P1) — Loyalty batch job when tier expires
 *   106 (P1) — Pricing correct on all customer documents
 *   107 (P0) — Move customer up a tier → pricing updates on new orders
 *   108 (P1) — Add coupon to existing order → price correct
 *
 * Test data: test-data/Pricing.xlsx → sheet "Pricing"
 *
 * ─── EXTERNAL SYSTEM NOTES ──────────────────────────────────────────────────
 * Scenarios 102–104 involve EDI 850 orders from Wayfair / West Elm / Lumens.
 * The EDI feed is external to D365. These tests verify D365 RECEIVED and
 * processed the order correctly — they do NOT trigger the EDI feed itself.
 * Those steps are commented out with ⚠️ EDI notes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const testData = readPricingData('Pricing.xlsx');

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 11 — Verify pricing is correct on a website-type SO
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 11 — Pricing verification on website SO (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '11').entries()) {
    test(`Scenario 11 Row ${index + 1} — Verify pricing [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const pricingPage = new PricingPage(page);

      await page.goto('/');

      // STEPS: Create a website SO (same type as Scenario 2)
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);

      // TODO: Set Order Source = WEB and Ship Complete = Yes (same as Scenario 2 TODO 1)
      // await soPage.setSellOptions('WEB', 'Yes');

      await soPage.enterItemNumber(data.ItemNumber);
      await soPage.setShipType(data.ShipType);

      // TODO: Complete → MCR → select existing CC → Submit
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.selectExistingCreditCard(data.ExistingCC);
      // await mcrPage.submit(submitBtn);

      // VERIFICATION: Check the pricing on the SO lines
      await soPage.goToLinesTab();

      // TODO: Verify unit price on line 0 matches expected
      // await pricingPage.verifyLinePrice(0, data.ExpectedPrice);

      // TODO: Check freight charges are showing correctly for expedited shipment
      // (Check charges section for minimum freight amount)

      console.log(`✓ Scenario 11 Row ${index + 1}: Pricing check set up for ${data.CustomerAccount}`);
      console.warn('⚠ Scenario 11 — INCOMPLETE: PricingPage locators not yet confirmed. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 55 — Price override → reason code prompt appears
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 55 — Price override with reason code (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '55').entries()) {
    test(`Scenario 55 Row ${index + 1} — Override price triggers reason code [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage  = new SalesOrderListPage(page);
      const soPage      = new SalesOrderPage(page);
      const mcrPage     = new MCROrderRecapPage(page);
      const pricingPage = new PricingPage(page);

      await page.goto('/');

      // STEPS 1–7: Create and confirm a standard SO
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await soPage.enterItemNumber(data.ItemNumber);

      // TODO: Complete → MCR → payment → Submit
      // const submitBtn = await soPage.clickComplete();
      // await mcrPage.addCreditCard(data.CreditCard);  // or selectExistingCC
      // await mcrPage.submit(submitBtn);

      // Reserve + Confirm
      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);
      await soPage.confirmNow();

      // STEPS 8–12: Override the price on the SO line
      // Price override typically only works on confirmed SOs (or sometimes before)
      // TODO: override price on line 0
      // await pricingPage.overrideLinePrice(0, data.OverridePrice);

      // VERIFICATION: Reason code prompt must appear
      // await pricingPage.verifyReasonCodePrompt();
      // await pricingPage.enterReasonCode(data.ReasonCode);

      // VERIFICATION: Final price matches override
      // await pricingPage.verifyLinePrice(0, data.ExpectedFinalPrice);

      console.log(`✓ Scenario 55 Row ${index + 1}: Price override test set up for ${data.CustomerAccount}`);
      console.warn('⚠ Scenario 55 — INCOMPLETE: PricingPage locators not yet confirmed. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 98 — Web order with MSA coupon
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 98 — Web order with MSA coupon (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '98').entries()) {
    test(`Scenario 98 Row ${index + 1} — MSA coupon pricing [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage  = new SalesOrderListPage(page);
      const soPage      = new SalesOrderPage(page);
      const pricingPage = new PricingPage(page);

      await page.goto('/');

      // TODO: Create web SO (imported from web order system or manual with WEB source)
      // await soListPage.navigate();
      // await soListPage.clickNew();
      // await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      // await soPage.enterItemNumber(data.ItemNumber);

      // TODO: Apply MSA coupon
      // await pricingPage.addCoupon(data.CouponCode);

      // TODO: Verify coupon applied and price is correct
      // await pricingPage.verifyCouponApplied(data.CouponCode);
      // await pricingPage.verifyLinePrice(0, data.ExpectedFinalPrice);

      console.warn('⚠ Scenario 98 — INCOMPLETE (P1): Web order with MSA coupon. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 99 — Web order with MSA coupon + Amber Lewis SKUs (no discount)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 99 — MSA coupon + Amber Lewis SKUs no discount (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '99').entries()) {
    test(`Scenario 99 Row ${index + 1} — MSA coupon + Amber Lewis [${data.CustomerAccount}]`, async ({ page }) => {
      const pricingPage = new PricingPage(page);

      await page.goto('/');

      // TODO: Create web SO with both MSA coupon item AND Amber Lewis SKU
      // Amber Lewis SKUs should NOT receive the MSA discount
      // TODO: Add coupon, verify Amber Lewis line is full price, other lines discounted

      console.warn('⚠ Scenario 99 — INCOMPLETE (P1): Amber Lewis SKU pricing. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 100 — Web order with LTO item + coupon (P2)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 100 — LTO item + coupon (P2)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '100').entries()) {
    test(`Scenario 100 Row ${index + 1} — LTO + coupon [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');
      // TODO: Create web SO with LTO item, add coupon, verify pricing
      console.warn('⚠ Scenario 100 — INCOMPLETE (P2): LTO + coupon pricing.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 101 — Web order with hardmark + manual price override (P3)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 101 — Hardmark + price override (P3)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '101').entries()) {
    test(`Scenario 101 Row ${index + 1} — Hardmark override [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');
      // TODO: Create web SO with hardmarked item, override price, verify
      console.warn('⚠ Scenario 101 — INCOMPLETE (P3): Hardmark pricing.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 102 — 3 Wayfair orders → verify 850 price  ⚠️ EDI EXTERNAL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 102 — Wayfair EDI orders pricing (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '102').entries()) {
    test(`Scenario 102 Row ${index + 1} — Wayfair 850 price [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // ⚠️ EDI EXTERNAL: The Wayfair 850 order arrives via EDI feed.
      // This test can only verify D365 RECEIVED and processed the order correctly.
      // It CANNOT trigger the EDI transmission.
      //
      // TODO: Given a known Wayfair EDI order already imported to D365:
      //   1. Find the order in All Sales Orders filtered by customer (Wayfair account)
      //   2. Navigate to the SO
      //   3. Verify the unit prices match the 850 EDI prices from data.ExpectedPrice

      // await soListPage.navigate();
      // Filter by Wayfair customer account + recent date
      // Open the order
      // Verify prices line by line

      console.warn('⚠ Scenario 102 — PARTIAL (EDI external). D365 verification only. See PLAN.md.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 103 — West Elm / Lulu orders  ⚠️ EDI EXTERNAL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 103 — West Elm Lulu EDI orders pricing (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '103').entries()) {
    test(`Scenario 103 Row ${index + 1} — West Elm/Lulu price [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');
      // ⚠️ EDI EXTERNAL — same approach as Scenario 102
      // TODO: Verify D365 received West Elm / Lulu orders with correct pricing
      console.warn('⚠ Scenario 103 — PARTIAL (EDI external). D365 verification only. See PLAN.md.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 104 — Lumens orders for trade account  ⚠️ EDI EXTERNAL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 104 — Lumens trade account EDI orders pricing (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '104').entries()) {
    test(`Scenario 104 Row ${index + 1} — Lumens trade price [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');
      // ⚠️ EDI EXTERNAL — same approach as Scenario 102
      // TODO: Verify D365 received Lumens orders with correct trade pricing
      console.warn('⚠ Scenario 104 — PARTIAL (EDI external). D365 verification only. See PLAN.md.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 105 — Loyalty batch job when tier expires (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 105 — Loyalty batch job tier expiry (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '105').entries()) {
    test(`Scenario 105 Row ${index + 1} — Tier expires [${data.CustomerAccount}]`, async ({ page }) => {
      const pricingPage = new PricingPage(page);
      await page.goto('/');

      // TODO: Set customer tier expiry date to today/past
      // Run loyalty batch job
      // Verify customer tier was downgraded
      // Verify pricing on new order reflects lower tier pricing

      // await pricingPage.updateCustomerLoyaltyTier(data.CustomerAccount, data.NewTier);
      // TODO: Trigger batch job — find "Loyalty" batch job in D365 batch processing

      console.warn('⚠ Scenario 105 — INCOMPLETE (P1): Loyalty batch job. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 106 — Pricing correct on all customer documents (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 106 — Pricing on all customer documents (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '106').entries()) {
    test(`Scenario 106 Row ${index + 1} — Document pricing [${data.CustomerAccount}]`, async ({ page }) => {
      await page.goto('/');

      // TODO: Create SO → confirm → verify price on:
      //   1. SO form itself (Lines tab)
      //   2. Sales order confirmation document
      //   3. Packing slip
      //   4. Invoice
      // All should show the same price

      console.warn('⚠ Scenario 106 — INCOMPLETE (P1): Document pricing validation.');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 107 — Customer tier upgrade → pricing updates on new orders (P0)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 107 — Customer tier upgrade updates pricing (P0)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '107').entries()) {
    test(`Scenario 107 Row ${index + 1} — Tier upgrade [${data.CustomerAccount}]`, async ({ page }) => {
      const pricingPage = new PricingPage(page);
      await page.goto('/');

      // TODO:
      // 1. Note current pricing on an SO for this customer (baseline)
      // 2. Move customer up a tier (updateCustomerLoyaltyTier)
      // 3. Create a new SO for the same item
      // 4. Verify the new SO uses the higher-tier price

      // await pricingPage.updateCustomerLoyaltyTier(data.CustomerAccount, data.NewTier);
      // Create new SO and verify price changed

      console.warn('⚠ Scenario 107 — INCOMPLETE (P0): Tier upgrade pricing. See Pages/PricingPage.ts');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 108 — Add coupon to existing order → price correct (P1)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Scenario 108 — Add coupon to existing order (P1)', () => {
  for (const [index, data] of testData.filter(r => r.ScenarioID === '108').entries()) {
    test(`Scenario 108 Row ${index + 1} — Add coupon to SO [${data.CustomerAccount}]`, async ({ page }) => {
      const soListPage  = new SalesOrderListPage(page);
      const soPage      = new SalesOrderPage(page);
      const pricingPage = new PricingPage(page);

      await page.goto('/');

      // TODO:
      // 1. Create SO (normal flow)
      // 2. Add coupon via PricingPage.addCoupon()
      // 3. Verify coupon applied and price updated correctly

      console.warn('⚠ Scenario 108 — INCOMPLETE (P1): Add coupon to existing SO. See Pages/PricingPage.ts');
    });
  }
});
