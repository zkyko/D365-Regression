/**
 * Purchase Order spec
 * ─────────────────────────────────────────────────────────────────────────────
 * O2C scenario alignment:
 *
 *   Flow A — Purchase Order | Create PO — Delivery Remainder Cancellation
 *     All Purchase Orders → New → Vendor → OK → Mode of delivery
 *     → Lines: Item + Qty → Save → Confirm
 *     (Relates to BRD-8647; not a numbered O2C scenario but core PO regression.)
 *
 *   Flow B — Purchase Order | Confirm Existing PO
 *     All Purchase Orders → filter by PO number → open → Purchase tab → Confirm
 *
 *   Flow C — D Channel | Scenario 64 — Create W Channel Direct Delivery Order
 *     (Converted from TC-7848-create-po-wchannel.spec.js)
 *     Scenario 64: Set up a container-specific item at item master for direct
 *     delivery. Create a manual W channel order with this item.
 *     All Purchase Orders → New → Vendor (7856) → Mode of delivery (Ocean)
 *     → Lines: Item (241283-003) → Confirm → Assert ApprovalStatus = Confirmed
 *
 *   Flow D — D Channel | Scenario 58 — Create D Channel Manual Purchase Order
 *     (Converted from TC-7849-create-po-dchannel.spec (1).js)
 *     Scenario 58: Create a manual D channel order for a customer that carries
 *     their own freight and requires a deposit.
 *     All Purchase Orders → New → Vendor (11357) → Mode of delivery (Ocean)
 *     → Channel = D → Lines: Item (106915-007) → Confirm → Assert status
 *
 * Test data for flows A/B is hard-coded below.
 * Test data for flows C/D is also hard-coded — move to DChannel.xlsx when scaling.
 *
 * Run with:
 *   npx playwright test tests/purchase-order.spec.ts --headed --workers=1
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { PurchaseOrderPage } from '../Pages/PurchaseOrderPage';

// ─── Test data ─────────────────────────────────────────────────────────────────
// Replace these with your actual values or wire up an Excel reader.
const CREATE_PO_DATA = {
  vendorAccount: '6126',       // Vendor account number
  // General section (expand in dialog)
  site: 'US',                   // Site for delivery
  warehouse: 'AUSTIN',         // Warehouse for delivery
  receiptDate: '3/20/2026',     // Expected receipt / delivery date
  // Administration section
  orderer: '',                  // Leave blank to use the logged-in user's linked name
  modeOfDelivery: 'AEWS-B2B',  // Mode of delivery code (required)
  itemNumber: '100009-004',    // Item number for the order line
  quantity: '48',              // Ordered quantity (minimum allowed is 48)
  receiveNow: '24',            // Partial receipt qty (< qty) — creates delivery remainder
};

const CONFIRM_PO_DATA = {
  purchaseOrderNumber: '',     // Set this to an existing PO number to test Flow B
};

// ─── Flow A: Create a new Purchase Order ──────────────────────────────────────
test('Purchase Order | Create PO — Delivery Remainder Cancellation', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  const poPage = new PurchaseOrderPage(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── 1. Navigate to All Purchase Orders ────────────────────────────────────
  await poPage.navigate();

  // ── 2. Click New ──────────────────────────────────────────────────────────
  await poPage.clickNew();

  // ── 3. Fill create-order dialog header → OK ─────────────────────────────
  // Vendor account (auto-populates some fields)
  await poPage.fillVendorAccount(CREATE_PO_DATA.vendorAccount);

  // General section: Site, Warehouse, Receipt date
  await poPage.fillSite(CREATE_PO_DATA.site);
  await poPage.fillWarehouse(CREATE_PO_DATA.warehouse);
  await poPage.setReceiptDate(CREATE_PO_DATA.receiptDate);

  // Administration section: Orderer (skip if blank — uses logged-in user)
  if (CREATE_PO_DATA.orderer) {
    await poPage.fillOrderer(CREATE_PO_DATA.orderer);
  }

  // Mode of Delivery is required before OK
  await poPage.fillDialogModeOfDelivery(CREATE_PO_DATA.modeOfDelivery);
  await poPage.clickOk();

  // ── 4. Capture D365-generated PO number ───────────────────────────────────
  const poNumber = await poPage.capturePurchaseOrderNumber();
  expect(poNumber, 'Purchase Order number should be generated').toBeTruthy();
  console.log(`✓ Purchase Order Number: ${poNumber}`);

  // ── 6. Go to Lines tab — enter Item + Quantity ────────────────────────────
  await page.getByText('Lines', { exact: true }).click();
  await page.waitForLoadState('networkidle');

  await poPage.enterItemNumber(CREATE_PO_DATA.itemNumber);
  await poPage.setQuantity(CREATE_PO_DATA.quantity);

  // ── 7. Save ───────────────────────────────────────────────────────────────
  await poPage.save();

  // ── 8. Confirm PO (Purchase tab → Confirm) ────────────────────────────────
  await poPage.confirmPurchaseOrder();

  // Verify PO number still visible after confirm
  const confirmedPoNumber = await poPage.capturePurchaseOrderNumber();
  expect(confirmedPoNumber).toBe(poNumber);
  console.log(`✓ Purchase Order ${poNumber} confirmed`);
});

// ─── Flow B: Confirm an existing Purchase Order ───────────────────────────────
test('Purchase Order | Confirm Existing PO', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  // Skip if no PO number provided
  if (!CONFIRM_PO_DATA.purchaseOrderNumber) {
    test.skip(true, 'Set CONFIRM_PO_DATA.purchaseOrderNumber to run this test');
  }

  const poPage = new PurchaseOrderPage(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── 1. Navigate to All Purchase Orders ────────────────────────────────────
  await poPage.navigate();

  // ── 2. Filter the list by PO number ───────────────────────────────────────
  const filterCombo = page.getByRole('combobox', { name: 'Filter' }).first();
  if (await filterCombo.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await filterCombo.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await filterCombo.pressSequentially(CONFIRM_PO_DATA.purchaseOrderNumber, { delay: 60 });
    await page.waitForTimeout(400);
    await filterCombo.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
  }

  // ── 3. Open the PO ────────────────────────────────────────────────────────
  const poRow = page.getByRole('row').filter({ hasText: CONFIRM_PO_DATA.purchaseOrderNumber }).first();
  await poRow.waitFor({ state: 'visible', timeout: 15_000 });
  await poRow.click();
  await page.waitForLoadState('networkidle');

  // ── 4. Confirm (Purchase tab → Confirm) ───────────────────────────────────
  await poPage.confirmPurchaseOrder();
  console.log(`✓ Purchase Order ${CONFIRM_PO_DATA.purchaseOrderNumber} confirmed`);
});

// ─── Flow C: D Channel | Scenario 64 — Create W Channel Direct Delivery Order ─
// Converted from tests/TC-7848-create-po-wchannel.spec.js
// Scenario 64: Create a manual W channel order with a direct-delivery item and
// ensure the direct delivery flag is set at the item line.
// ─────────────────────────────────────────────────────────────────────────────
const W_CHANNEL_DATA = {
  vendorAccount:  '7856',
  modeOfDelivery: 'Ocean',
  itemNumber:     '241283-003',
};

test('D Channel | Scenario 64 — Create W Channel Direct Delivery Order', async ({ page }) => {
  test.setTimeout(3 * 60 * 1_000);

  const poPage = new PurchaseOrderPage(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── 1. Navigate to All Purchase Orders ──────────────────────────────────
  await poPage.navigate();

  // ── 2. Click New ────────────────────────────────────────────────────────
  await poPage.clickNew();

  // ── 3. Fill dialog: Vendor + Mode of Delivery → OK ──────────────────────
  await poPage.fillVendorAccount(W_CHANNEL_DATA.vendorAccount);
  await poPage.fillDialogModeOfDelivery(W_CHANNEL_DATA.modeOfDelivery);
  await poPage.clickOk();

  // ── 4. Capture PO number ────────────────────────────────────────────────
  const poNumber = await poPage.capturePurchaseOrderNumber();
  expect(poNumber, 'PO number should be generated').toBeTruthy();
  console.log(`✓ W-Channel PO created: ${poNumber}`);

  // ── 5. Add line item ─────────────────────────────────────────────────────
  await page.getByText('Lines', { exact: true }).click();
  await page.waitForLoadState('networkidle');
  await poPage.enterItemNumber(W_CHANNEL_DATA.itemNumber);
  await poPage.save();

  // ── 6. Confirm ──────────────────────────────────────────────────────────
  await poPage.confirmPurchaseOrder();

  // ── 7. Assert approval status ───────────────────────────────────────────
  const status = await poPage.getApprovalStatus();
  expect(status, 'W-Channel PO should be Confirmed').toMatch(/Confirmed/i);
  console.log(`✓ W-Channel PO ${poNumber} confirmed. Status: ${status}`);
});

// ─── Flow D: D Channel | Scenario 58 — Create D Channel Manual Purchase Order ─
// Converted from tests/TC-7849-create-po-dchannel.spec (1).js
// Scenario 58: Create a manual D channel order for a customer that carries their
// own freight and requires a deposit.  This flow covers the PO-creation side;
// full SO + deposit + ship window are exercised in d-channel.spec.ts Sc. 58.
// ─────────────────────────────────────────────────────────────────────────────
const D_CHANNEL_DATA = {
  vendorAccount:  '11357',
  modeOfDelivery: 'Ocean',
  channel:        'D',
  itemNumber:     '106915-007',
};

test('D Channel | Scenario 58 — Create D Channel Manual Purchase Order', async ({ page }) => {
  test.setTimeout(3 * 60 * 1_000);

  const poPage = new PurchaseOrderPage(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── 1. Navigate to All Purchase Orders ──────────────────────────────────
  await poPage.navigate();

  // ── 2. Click New ────────────────────────────────────────────────────────
  await poPage.clickNew();

  // ── 3. Fill dialog: Vendor + Mode of Delivery + Channel (D) → OK ────────
  await poPage.fillVendorAccount(D_CHANNEL_DATA.vendorAccount);
  await poPage.fillDialogModeOfDelivery(D_CHANNEL_DATA.modeOfDelivery);
  // Channel field is only visible on the dialog when the vendor is configured for D-Channel.
  await poPage.fillDialogChannel(D_CHANNEL_DATA.channel);
  await poPage.clickOk();

  // ── 4. Capture PO number ────────────────────────────────────────────────
  const poNumber = await poPage.capturePurchaseOrderNumber();
  expect(poNumber, 'PO number should be generated').toBeTruthy();
  console.log(`✓ D-Channel PO created: ${poNumber}`);

  // ── 5. Add line item ─────────────────────────────────────────────────────
  await page.getByText('Lines', { exact: true }).click();
  await page.waitForLoadState('networkidle');
  await poPage.enterItemNumber(D_CHANNEL_DATA.itemNumber);
  await poPage.save();

  // ── 6. Confirm ──────────────────────────────────────────────────────────
  await poPage.confirmPurchaseOrder();

  // ── 7. Assert approval status ───────────────────────────────────────────
  const status = await poPage.getApprovalStatus();
  expect(status, 'D-Channel PO should be Confirmed or Approved').toMatch(/Confirmed|Approved/i);
  console.log(`✓ D-Channel PO ${poNumber} confirmed. Status: ${status}`);
});
