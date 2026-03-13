/**
 * Run once to generate the Scenarios 3-9 Excel test-data file:
 *   npx ts-node test-data/generate-scenarios-3-9.ts
 *
 * The output file  test-data/Scenarios-3-9.xlsx  is what scenarios-3-9.spec reads.
 * Edit values directly in Excel afterwards — no need to re-run this script.
 *
 * Scenarios covered:
 *   3 — Customer 93367 (Design Within Reach),  item 100049-002 x5,  CC payment
 *   4 — Customer 76565 (Studio McGee),          item 109035-018 x1,  Account payment
 *   5 — Customer 10011 (Houzz),                 item 106045-201 x4 (bundle), Account
 *   6 — Customer Nicole Roby,                   item 100054-011 x1,  CC payment
 *   7 — Customer Sit Down New York,             items 100049-002 x2 + 106045-201 x3, Account
 *   8 — Customer Lulu & Georgia,                items 233200-003 x3 + 106045-201 x1, Account
 *   9 — Customer House of Spoils,               item 234521-001 x1,  Account payment
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

const CC_PLACEHOLDER = {
  CC_Name    : 'Test User',
  CC_Number  : '4111111111111111',   // Visa test number — replace with real test card if needed
  CC_CVV     : '123',
  CC_ExpMonth: '12',
  CC_ExpYear : '2027',
  CC_Zip     : '75001',
  CC_Address : '123 Main Street',
};

const NO_CC = {
  CC_Name    : '',
  CC_Number  : '',
  CC_CVV     : '',
  CC_ExpMonth: '',
  CC_ExpYear : '',
  CC_Zip     : '',
  CC_Address : '',
};

const rows = [
  // ── Scenario 3 ───────────────────────────────────────────────────────────
  // Single non-bundle item, credit card payment.
  {
    ScenarioID             : '3',
    CustomerAccount        : '93367',
    CustomerPO             : 'PO-SCENARIO-3',
    ItemNumber             : '100049-002',
    Quantity               : '5',
    ItemNumber2            : '',
    Quantity2              : '',
    IsBundle               : 'No',
    PaymentMethod          : 'CC',
    TenderType             : '',
    ShipType               : 'Auto Ship',
    ...CC_PLACEHOLDER,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 4 ───────────────────────────────────────────────────────────
  // Single non-bundle item, on-account (AR) payment.
  {
    ScenarioID             : '4',
    CustomerAccount        : '76565',
    CustomerPO             : 'PO-SCENARIO-4',
    ItemNumber             : '109035-018',
    Quantity               : '1',
    ItemNumber2            : '',
    Quantity2              : '',
    IsBundle               : 'No',
    PaymentMethod          : 'Account',
    TenderType             : 'AR',
    ShipType               : 'Auto Ship',
    ...NO_CC,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 5 ───────────────────────────────────────────────────────────
  // Bundle item (106045-201), on-account payment.
  // IsBundle=Yes → reservation skips the Canceled bundle-parent row.
  {
    ScenarioID             : '5',
    CustomerAccount        : '10011',
    CustomerPO             : 'PO-SCENARIO-5',
    ItemNumber             : '106045-201',
    Quantity               : '4',
    ItemNumber2            : '',
    Quantity2              : '',
    IsBundle               : 'Yes',
    PaymentMethod          : 'Account',
    TenderType             : 'AR',
    ShipType               : 'Auto Ship',
    ...NO_CC,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 6 ───────────────────────────────────────────────────────────
  // Customer identified by name (not account number), CC payment.
  {
    ScenarioID             : '6',
    CustomerAccount        : 'Nicole Roby',
    CustomerPO             : 'PO-SCENARIO-6',
    ItemNumber             : '100054-011',
    Quantity               : '1',
    ItemNumber2            : '',
    Quantity2              : '',
    IsBundle               : 'No',
    PaymentMethod          : 'CC',
    TenderType             : '',
    ShipType               : 'Auto Ship',
    ...CC_PLACEHOLDER,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 7 ───────────────────────────────────────────────────────────
  // Two items: one regular + one bundle, on-account payment.
  // After entering item 1 (100049-002), a second line is added for 106045-201.
  {
    ScenarioID             : '7',
    CustomerAccount        : 'Sit Down New York',
    CustomerPO             : 'PO-SCENARIO-7',
    ItemNumber             : '100049-002',
    Quantity               : '2',
    ItemNumber2            : '106045-201',
    Quantity2              : '3',
    IsBundle               : 'Yes',
    PaymentMethod          : 'Account',
    TenderType             : 'AR',
    ShipType               : 'Auto Ship',
    ...NO_CC,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 8 ───────────────────────────────────────────────────────────
  // Two items: one regular + one bundle, on-account payment.
  {
    ScenarioID             : '8',
    CustomerAccount        : 'Lulu & Georgia',
    CustomerPO             : 'PO-SCENARIO-8',
    ItemNumber             : '233200-003',
    Quantity               : '3',
    ItemNumber2            : '106045-201',
    Quantity2              : '1',
    IsBundle               : 'Yes',
    PaymentMethod          : 'Account',
    TenderType             : 'AR',
    ShipType               : 'Auto Ship',
    ...NO_CC,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },

  // ── Scenario 9 ───────────────────────────────────────────────────────────
  // Single non-bundle item, on-account payment.
  {
    ScenarioID             : '9',
    CustomerAccount        : 'House of Spoils',
    CustomerPO             : 'PO-SCENARIO-9',
    ItemNumber             : '234521-001',
    Quantity               : '1',
    ItemNumber2            : '',
    Quantity2              : '',
    IsBundle               : 'No',
    PaymentMethod          : 'Account',
    TenderType             : 'AR',
    ShipType               : 'Auto Ship',
    ...NO_CC,
    ExpectedKoerberStatus  : 'Released',
    ExpectedDocumentStatus : 'Invoice',
  },
];

// ─── Build workbook ──────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// Auto-size columns
const colWidths = Object.keys(rows[0]).map((key) => ({
  wch: Math.max(key.length, 18),
}));
ws['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws, 'Scenarios3-9');

// ─── Write file ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'Scenarios-3-9.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`✓ Created: ${outPath}`);
