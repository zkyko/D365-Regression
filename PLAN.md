# O2C Regression Suite — Master Plan

## Overview
Full Order-to-Cash (O2C) regression suite for D365 FO (Dynamics 365 Finance & Operations).
All tests use Playwright + TypeScript. Page Object Model pattern throughout.

**Auth file:** `auth.json` (pre-authenticated session)
**Base URL:** configured in `playwright.config.ts`
**Test data:** `test-data/*.xlsx` (one sheet per scenario group)

---

## Architecture

```
D365-Regression/
├── Pages/                        ← Page Object Models
│   ├── BasePage.ts               ✅ DONE — base class, navigateTo(), waitForProcessing()
│   ├── SalesOrderListPage.ts     ✅ DONE — All Sales Orders list, New button
│   ├── SalesOrderPage.ts         ✅ DONE — SO detail form (all tabs, reserve, confirm)
│   ├── MCROrderRecapPage.ts      ✅ DONE — MCR dialog, credit card, submit
│   ├── CandidateForShippingPage.ts ✅ DONE — navigate + filterBySalesOrder
│   ├── GroupingPage.ts           ✅ DONE — navigate + run
│   ├── ShipmentBuilderPage.ts    ✅ DONE — navigate, GRP row, createShipment, verifyKoerber
│   ├── ShipmentsPage.ts          ✅ DONE — navigate, pickAndPack, postPackingSlip, invoice
│   ├── NavigationPage.ts         ✅ DONE — expandNav, navigateToModule, navigateViaMenu
│   ├── VoyagePage.ts             ✅ DONE — VoyageListPage, VoyageEditorPage, VoyageCreateDialog
│   ├── PurchaseOrderPage.ts      ✅ EXTENDED — PO create/confirm + W-channel + D-channel flows
│   ├── PricingPage.ts            🟡 STUB — price override, reason code, coupon
│   ├── DChannelOrderPage.ts      🟡 STUB — D Channel SO creation, PO link, deposits
│   ├── ReturnOrderPage.ts        🟡 STUB — RMA, credit memo, replacement, inspection notes
│   ├── CustomerMasterPage.ts     🟡 STUB — customer account edits, payment method
│   ├── AllocationWorkbenchPage.ts 🟡 STUB — inventory allocation exception workbench
│   └── InventoryFeedPage.ts      🟡 STUB — customer assortment, feed management
│
├── tests/
│   ├── scenario-1.spec.ts        ✅ DONE — W-channel SO, new CC, pick/ship/invoice
│   ├── scenario-2.spec.ts        🟡 4 TODOs — website SO, existing CC, LTO item
│   ├── scenarios-3-9.spec.ts     ✅ DONE — order entry variants (WEB/MANUAL/API/EDI/UPLOAD)
│   ├── pricing.spec.ts           🟡 STUB — Scenarios 11, 55, 98–108
│   ├── shipment-builder.spec.ts  🟡 STUB — Scenarios 21, 30, 35–46, 89–91, 117
│   ├── batch-jobs.spec.ts        ✅ DONE — CFS + Grouping batch jobs (infra, supports all Sc.)
│   │                               [Converted from TC-7938 + TC-7940 JS smoke tests]
│   ├── d-channel.spec.ts         🟡 STUB — Scenarios 58–75, 120–123 (blocked: unconfirmed locators)
│   ├── purchase-order.spec.ts    ✅ DONE — PO delivery remainder + confirm + W/D channel PO
│   │   ├── Purchase Order | Create PO — Delivery Remainder Cancellation
│   │   ├── Purchase Order | Confirm Existing PO
│   │   ├── D Channel | Scenario 64 — Create W Channel Direct Delivery Order  [← TC-7848]
│   │   └── D Channel | Scenario 58 — Create D Channel Manual Purchase Order  [← TC-7849]
│   ├── cancel-sales-order.spec.ts ✅ DONE — D Channel | Scenario 73 (cancel SO, verify status)
│   │                               [Converted from TC-7941 JS smoke test; D-channel-specific
│   │                                allocation/PO-cancel checks to be added to d-channel.spec.ts]
│   ├── landed-cost.spec.ts       ✅ DONE — Landed Cost | Create Standard Voyage
│   │                               [Converted from TC-4409 JS smoke test; new coverage area]
│   ├── returns-credits.spec.ts   🟡 STUB — Scenarios 76–88, 97
│   ├── retail.spec.ts            🟡 STUB — Scenarios 92–94
│   ├── allocations.spec.ts       🟡 STUB — Scenarios 95–96, 110–114
│   ├── customer-master.spec.ts   🟡 STUB — Scenarios 56–57
│   ├── inventory-feed.spec.ts    🟡 STUB — Scenarios 115–116, 118–119
│   └── product.spec.ts           🟡 STUB — Scenario 109
│
├── utils/
│   └── excel-reader.ts           🟡 EXTENDED — all data interfaces defined
│
└── test-data/
    ├── Scenario-1.xlsx           ✅ EXISTS
    ├── Scenario-2.xlsx           ❌ NEEDS CREATING — sheet "Scenario2", see interface below
    ├── Pricing.xlsx              ❌ NEEDS CREATING — sheet "Pricing"
    ├── DChannel.xlsx             ❌ NEEDS CREATING — sheet "DChannel"
    ├── Returns.xlsx              ❌ NEEDS CREATING — sheet "Returns"
    ├── Retail.xlsx               ❌ NEEDS CREATING — sheet "Retail"
    ├── Allocations.xlsx          ❌ NEEDS CREATING — sheet "Allocations"
    ├── CustomerMaster.xlsx       ❌ NEEDS CREATING — sheet "CustomerMaster"
    ├── InventoryFeed.xlsx        ❌ NEEDS CREATING — sheet "InventoryFeed"
    └── LandedCost.xlsx           ❌ NEEDS CREATING — sheet "LandedCost" (for voyage scaling)
```

---

## Scenario → File Mapping

| Scenario | Priority | Feature Area | Spec File | POMs Used | Status |
|---|---|---|---|---|---|
| 1 | P0 | Order Entry | scenario-1.spec.ts | SalesOrderListPage, SalesOrderPage, MCROrderRecapPage, CandidateForShippingPage, GroupingPage, ShipmentBuilderPage, ShipmentsPage | ✅ Done |
| 2 | P0 | Order Entry | scenario-2.spec.ts | Same as above | 🟡 4 TODOs |
| 3–9 | P0 | Order Entry | scenarios-3-9.spec.ts | SalesOrderListPage, SalesOrderPage, MCROrderRecapPage, CandidateForShippingPage, GroupingPage, ShipmentBuilderPage | ✅ Done |
| 11 | P0 | Pricing | pricing.spec.ts | SalesOrderListPage, SalesOrderPage, MCROrderRecapPage, PricingPage | 🟡 Stub |
| 21 | P0 | Shipment Builder | shipment-builder.spec.ts | SalesOrderListPage, SalesOrderPage, MCROrderRecapPage, ShipmentBuilderPage | 🟡 Stub |
| 30 | P0 | Shipment Builder | shipment-builder.spec.ts | ShipmentsPage | ⚠️ External (WMS) |
| 35–37 | P0 | Shipment Builder | shipment-builder.spec.ts | ShipmentsPage | ⚠️ External (WMS) |
| 38–46 | P0 | Shipment Builder | shipment-builder.spec.ts | ShipmentBuilderPage, ShipmentsPage | 🟡 Stub |
| 55 | P0 | Pricing | pricing.spec.ts | SalesOrderListPage, SalesOrderPage, PricingPage | 🟡 Stub |
| 56–57 | P1 | Customer Master | customer-master.spec.ts | CustomerMasterPage | 🟡 Stub |
| 58 (PO side) | P0 | D Channel | purchase-order.spec.ts | PurchaseOrderPage | ✅ Done (TC-7849 → D Channel \| Sc. 58 PO creation) |
| 58–75 | P0 | D Channel | d-channel.spec.ts | DChannelOrderPage | 🟡 Stub (blocked: locators unconfirmed) |
| 64 (PO side) | P0 | D Channel | purchase-order.spec.ts | PurchaseOrderPage | ✅ Done (TC-7848 → D Channel \| Sc. 64 W-channel PO) |
| 73 (cancel path) | P0 | D Channel | cancel-sales-order.spec.ts | SalesOrderListPage, SalesOrderPage | ✅ Done (TC-7941 → D Channel \| Sc. 73 cancel + status) |
| 76–88 | P0 | Returns & Credits | returns-credits.spec.ts | ReturnOrderPage, ShipmentBuilderPage, ShipmentsPage | 🟡 Stub |
| 89–91 | P1 | Shipment Builder | shipment-builder.spec.ts | SalesOrderListPage, SalesOrderPage, ShipmentBuilderPage | 🟡 Stub |
| 92–94 | P0 | Retail | retail.spec.ts | SalesOrderListPage, SalesOrderPage, ShipmentsPage | 🟡 Stub |
| 95–96 | P0 | Allocations | allocations.spec.ts | SalesOrderListPage, SalesOrderPage | 🟡 Stub |
| 97 | P1 | Returns & Credits | returns-credits.spec.ts | ReturnOrderPage | 🟡 Stub |
| 98–108 | P0–P3 | Pricing | pricing.spec.ts | SalesOrderPage, PricingPage | 🟡 Stub / ⚠️ Some external |
| 109 | P0 | Product | product.spec.ts | (new POM needed) | 🟡 Stub |
| 110–114 | P0 | Allocations | allocations.spec.ts | AllocationWorkbenchPage, SalesOrderPage | 🟡 Stub |
| 115–116, 118–119 | P0 | Inventory Feed | inventory-feed.spec.ts | InventoryFeedPage | 🟡 Stub / ⚠️ External |
| 117 | P0 | Shipment Builder | shipment-builder.spec.ts | ShipmentBuilderPage | 🟡 Stub |
| 120–123 | P0 | D Channel | d-channel.spec.ts | DChannelOrderPage | 🟡 Stub (blocked) |
| — (infra) | P0 | Batch Jobs | batch-jobs.spec.ts | CandidateForShippingPage, GroupingPage | ✅ Done (TC-7938 + TC-7940, supports all E2E flows) |
| — (new area) | P0 | Landed Cost | landed-cost.spec.ts | VoyagePage (VoyageListPage, VoyageEditorPage, VoyageCreateDialog) | ✅ Done (TC-4409 voyage creation) |

---

## JS Smoke Test Pack → TypeScript Regression Conversion

The following JavaScript smoke test files were converted to TypeScript and
integrated into the regression pack under the O2C scenario naming convention.
The original `.spec.js` files are retained in `tests/` for reference only;
they should NOT be included in the `npx playwright test` run (exclude via
`playwright.config.ts` `testIgnore` pattern or delete once TS versions are stable).

| Original JS File | Converted To | O2C Mapping | Test Title |
|---|---|---|---|
| TC-4409-create-standard-voyage.spec.js | tests/landed-cost.spec.ts | New area (Landed Cost) | Landed Cost \| Create Standard Voyage |
| TC-7848-create-po-wchannel.spec.js | tests/purchase-order.spec.ts (Flow C) | D Channel \| Scenario 64 | D Channel \| Scenario 64 — Create W Channel Direct Delivery Order |
| TC-7849-create-po-dchannel.spec (1).js | tests/purchase-order.spec.ts (Flow D) | D Channel \| Scenario 58 | D Channel \| Scenario 58 — Create D Channel Manual Purchase Order |
| TC-7938-run-candidate-for-shipping-batch-job.spec.js | tests/batch-jobs.spec.ts | Batch infra (all scenarios) | Shipment Builder \| Candidate for Shipping Batch Job |
| TC-7940-run-grouping-job.spec.js | tests/batch-jobs.spec.ts | Batch infra (all scenarios) | Shipment Builder \| Grouping Batch Job |
| TC-7941-cancel-sales-order.spec.js | tests/cancel-sales-order.spec.ts | D Channel \| Scenario 73 | D Channel \| Scenario 73 — Cancel Direct Delivery Sales Order |

### New Page Object Models created during conversion

| New POM | Source | Description |
|---|---|---|
| Pages/NavigationPage.ts | Pages/NavigationPage.js | expandNav, navigateToModule, navigateViaMenu (renamed from navigateTo to avoid BasePage conflict) |
| Pages/VoyagePage.ts | Pages/VoyagePage.js | VoyageListPage, VoyageEditorPage, VoyageCreateDialog — Landed Cost voyage management |
| Pages/PurchaseOrderPage.ts (extended) | Pages/PurchaseOrderPage (1).js | Added W/D-channel dialog fields, header/lines view toggle, approval status getter |

### Test naming convention

All tests in this regression pack must follow the O2C naming standard:

```
test.describe('<Feature Area> | Scenario <N> — <Brief description>', () => {
  test('<Feature Area> | Scenario <N> — <Action and assertion>', async ({ page }) => {
```

For infrastructure tests without a scenario number:

```
test.describe('<Feature Area> | <Function Name>', () => {
  test('<Feature Area> | <Function Name>', async ({ page }) => {
```

Examples from the spec files:
- `'D Channel | Scenario 64 — Create W Channel Direct Delivery Order'`
- `'D Channel | Scenario 73 — Cancel Direct Delivery Sales Order and verify status = Cancelled'`
- `'Shipment Builder | Candidate for Shipping Batch Job'`
- `'Landed Cost | Create Standard Voyage (TC-4409)'`

---

## Scenario 2 — Remaining TODOs

These 4 blocks in `tests/scenario-2.spec.ts` need live D365 inspection to get locators:

### TODO 1 — Steps 19-23: Sell tab → Order Source + Ship Complete
```
1. Open any Sales Order → click "Sell" tab on action pane
2. Right-click "Order source" combobox → Inspect → find name= or aria-label=
3. Right-click "Ship complete" → Inspect (may be combobox or checkbox)
4. Add method setSellOptions(orderSource, shipComplete) to SalesOrderPage.ts
```

### TODO 2 — Steps 41-50: Select EXISTING credit card from list
```
1. In MCR Order Recap → click "Add" in Payments section
2. A grid of saved cards should appear (NOT an iframe — different from new CC flow)
3. Inspect grid rows — find pattern with last-4 digits
4. Inspect OK button for confirmation
5. Add method selectExistingCreditCard(cardHint: string) to MCROrderRecapPage.ts
```

### TODO 3 — Steps 75-88: Candidate for Shipping → filter by TODAY
```
1. Open Candidate for Shipping → Records to include → Filter
2. Find "Requested ship date" field in the Field combobox
3. Look for "Today" button/link in date picker → inspect its role/name
4. Add method filterByToday(dateFieldLabel: string) to CandidateForShippingPage.ts
```

### TODO 4 — Step 111: Click Sales Order link from Shipment Builder
```
1. After creating a shipment, inspect the "Sales order" field area
2. SO number (e.g. SO000233XXX) is a hyperlink — try:
   - page.getByRole('link').filter({ hasText: salesOrderNumber }).first()
   - page.locator('[data-dyn-controlname*="SalesId"] a')
3. Add method clickSalesOrderLink() to ShipmentBuilderPage.ts
```

---

## State Management — Chained Scenarios

Several scenarios depend on data from a previous scenario (e.g. Scenario 21 needs an SO from Scenario 2).

**Strategy adopted:** Each spec file creates its own fresh prerequisite data in a `beforeAll` or at the start of the test. This ensures tests are independent and runnable in any order.

For example, Scenario 21 ("create shipment from Scenario 2's SO") is implemented as:
1. Create a fresh website SO (same type as Scenario 2)
2. Then run the shipment builder flow

This means tests are **isolated** but may take longer. The alternative (shared state file) is noted below.

**Alternative — shared state file approach (for future):**
```typescript
// utils/test-state.ts
import * as fs from 'fs';
const STATE_FILE = './test-data/runtime-state.json';

export function saveState(key: string, value: string) {
  const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) : {};
  state[key] = value;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadState(key: string): string {
  if (!fs.existsSync(STATE_FILE)) return '';
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))[key] ?? '';
}
```

---

## External System Limitations

These scenarios have D365 UI steps that ARE automatable, but some steps require external systems:

| External System | Scenarios | What's automatable | What's not |
|---|---|---|---|
| **Korber WMS** | 30, 35–37, 87–88 | Verify D365 status after WMS action | Triggering the WMS pick/ship itself |
| **EDI feeds** | 62–63, 102–104 | Verify D365 received/processed order | Sending the EDI 850 message |
| **Email inventory feed** | 115, 118 | Manage assortment in D365 | Verifying the actual email was sent/received |
| **846 EDI feed** | 116, 119 | Manage assortment in D365 | Verifying the 846 was generated correctly |

For all external-dependent steps: the spec has the D365-side steps implemented and the external verification **commented out with a TODO**.

---

## How to Find D365 Locators (Guide for Any LLM)

1. **Open D365 in browser** using `npx playwright test --headed` or via Playwright MCP
2. **Navigate to the relevant page/form**
3. **Open browser DevTools** (F12)
4. **Right-click the element → Inspect**
5. **Look for these attributes in this priority order:**
   - `name="..."` attribute (most stable, D365-specific, e.g. `button[name="SubmitButton"]`)
   - `aria-label="..."` (second choice, e.g. `input[aria-label="Customer account"]`)
   - `data-dyn-controlname="..."` (D365 control name, partial match OK)
   - `role` + text content (last resort, e.g. `getByRole('button', { name: 'Complete' })`)
6. **AVOID** element IDs containing session numbers like `_543_` or `_4_` — these change every session

### D365 Form Patterns
- **Action Pane buttons** (top ribbon): `button[name="..."]` or `getByRole('button', { name: '...' })`
- **FastTab expand buttons**: `button[aria-label="..."]`
- **Grid rows**: `[role="grid"] [role="row"]:has([role="gridcell"])`
- **Comboboxes/dropdowns**: `getByRole('combobox', { name: '...' })`
- **Text inputs**: `getByRole('textbox', { name: '...' })` or `input[name="..."]`
- **Checkboxes**: `getByRole('checkbox', { name: '...' })`
- **Menu items (sub-buttons)**: `getByRole('menuitem', { name: '...' })`

---

## Excel Test Data Files — Column Definitions

### Scenario-2.xlsx (sheet: Scenario2)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | 100012 | D365 customer account number |
| CustomerPO | PO-TEST-001 | Free-form PO reference |
| OrderSource | WEB | Value for Order Source field on Sell tab |
| ShipComplete | Yes | Value for Ship Complete field on Sell tab |
| ItemNumber | 243450-002 | Must be LTO item WITH inventory |
| ShipType | Auto Ship | Value for Ship Type on Header tab |
| ExistingCC | 1111 | Last-4 digits to identify saved credit card |
| ExpectedKoerberStatus | Released | Expected Koerber status after shipment created |
| ExpectedDocumentStatus | Invoice | Expected Document Status after invoicing |

### Pricing.xlsx (sheet: Pricing)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | 100012 | |
| ItemNumber | 243450-002 | In-stock item |
| OriginalPrice | 299.99 | Expected price before override |
| OverridePrice | 250.00 | New price to enter |
| ReasonCode | PROMO | Reason code to select when prompted |
| CouponCode | MSA10 | Optional coupon code |
| ExpectedFinalPrice | 250.00 | Price to assert after override |

### DChannel.xlsx (sheet: DChannel)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | | D Channel customer account |
| CustomerPO | | |
| ItemNumber | | Direct delivery item |
| VendorAccount | | Linked vendor for D channel |
| FreightTerms | CustomerCarries | "CustomerCarries" or "FHCarries" |
| DepositRequired | Yes | "Yes" or "No" |
| FreightCharge | 150.00 | Amount for freight charge line |
| ShipWindowFrom | 03/01/2026 | Start of ship window |
| ShipWindowTo | 03/15/2026 | End of ship window |
| DeliveryTerms | | e.g. FOB, CIF |
| ExpectedPOStatus | Open | Expected PO status after SO confirmed |

### Returns.xlsx (sheet: Returns)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | 100012 | |
| OriginalSONumber | SO000012345 | Leave blank for "SO doesn't exist in D365" scenarios |
| ItemNumber | 243450-002 | Item being returned |
| ReturnType | CreditMemo | "CreditMemo", "Replacement", "CreditWithInventory" |
| ReturnReason | Defective | Reason code for return |
| InspectionNotes | Damaged in transit | Notes for scenarios 78/79 |
| ExpectedCreditAmount | 299.99 | |
| RMADocumentExpected | Yes | |

### Retail.xlsx (sheet: Retail)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | | Retail customer OR "OneTime" |
| ItemNumber | | In-stock item |
| Quantity | 1 | |
| ExpectedInventoryReduction | 1 | For stock verification |
| CreditToApply | | Last-4 or amount for S94 |

### Allocations.xlsx (sheet: Allocations)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | 100012 | |
| ItemNumber | 243450-002 | |
| HoldType | Incomplete | "Incomplete" or "Soft" |
| SourceSONumber | | For move-allocation scenario (112) |
| TargetSONumber | | For move-allocation scenario (112) |
| ExpectedReservationStatus | Released | After hold applied |

### CustomerMaster.xlsx (sheet: CustomerMaster)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | 100012 | |
| NewChargesGroup | | |
| NewAccountStatus | | e.g. Active, On Hold |
| NewAESField | | |
| NewPaymentMethod | | e.g. Credit card, Net 30 |

### InventoryFeed.xlsx (sheet: InventoryFeed)
| Column | Example | Notes |
|---|---|---|
| CustomerAccount | | Customer using feed |
| ItemNumber | | Item to add/remove |
| FeedType | Email | "Email" or "846" |
| Action | Add | "Add" or "Remove" |

---

## Build Order / Priority

**Step 1 — Complete Scenario 2 (Immediate)**
Resolve 4 TODOs (see above). Requires live D365 session with Playwright MCP.

**Step 2 — Quick wins (reuse existing POMs)**
- Scenario 11: pricing check (PricingPage.ts + pricing.spec.ts)
- Scenario 21: shipment from SO (shipment-builder.spec.ts — mostly existing POMs)
- Scenario 117: cancel + re-create shipment
- Scenarios 95/96: order holds (SalesOrderPage + new hold methods)
- Scenarios 113/114: reserve/unreserve via SO (SalesOrderPage — already partially done)

**Step 3 — New module: D Channel**
Large area, new POM needed. Start with Scenario 58 (simplest manual D channel), then chain 67/68/69/71/73 etc.

**Step 4 — New module: Returns & Credits**
New POM, new module in D365. Start with Scenario 76 (simplest credit memo), build up.

**Step 5 — Retail, Customer Master, Allocations**
Smaller areas, mostly isolated.

**Step 6 — EDI/External (partial only)**
Scenarios 62/63, 102–104, 115–119: automate D365 side, comment out external verification.
