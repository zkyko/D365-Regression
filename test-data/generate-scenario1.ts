/**
 * Run once to generate the Scenario 1 Excel test-data file:
 *   npx ts-node test-data/generate-scenario1.ts
 *
 * The output file  test-data/Scenario-1.xlsx  is what the spec reads from.
 * Edit the data directly in Excel afterwards — no need to re-run this script.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

// ─── Test data rows ───────────────────────────────────────────────────────────
// Each row is one test run. Add more rows to parameterize additional runs.
const rows = [
  {
    // ── Sales Order ──────────────────────────────────────────────────────────
    CustomerAccount : '100012',
    CustomerPO      : 'PO-SCENARIO-1',
    ItemNumber      : '250642-002',
    ShipType        : 'Auto Ship',

    // ── Credit Card ──────────────────────────────────────────────────────────
    CC_Name         : 'John Doe',
    CC_Number       : '4111111111111111',
    CC_CVV          : '123',
    CC_ExpMonth     : '12',
    CC_ExpYear      : '2026',
    CC_Zip          : '75001',
    CC_Address      : '123 Main Street',

    // ── Expected / Verification values ───────────────────────────────────────
    ExpectedShipType        : 'Auto Ship',
    ExpectedKoerberStatus   : 'Released',
    ExpectedDocumentStatus  : 'Invoice',
  },
];

// ─── Build workbook ──────────────────────────────────────────────────────────
const wb  = XLSX.utils.book_new();
const ws  = XLSX.utils.json_to_sheet(rows);

// Auto-size columns (approximate)
const colWidths = Object.keys(rows[0]).map((key) => ({
  wch: Math.max(key.length, 22),
}));
ws['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws, 'Scenario1');

// ─── Write file ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'Scenario-1.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`✓ Created: ${outPath}`);
