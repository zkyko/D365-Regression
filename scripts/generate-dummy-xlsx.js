/**
 * Generates placeholder .xlsx test-data files with correct sheet names
 * and header rows so specs load without crashing.
 * Run: node scripts/generate-dummy-xlsx.js
 */
const XLSX = require('xlsx');
const path = require('path');

const files = [
  {
    name: 'CustomerMaster.xlsx',
    sheet: 'CustomerMaster',
    headers: ['ScenarioID','CustomerAccount','CustomerPO','ItemNumber',
              'NewChargesGroup','NewAccountStatus','NewAESS','NewPaymentMethod'],
  },
  {
    name: 'InventoryFeed.xlsx',
    sheet: 'InventoryFeed',
    headers: ['ScenarioID','CustomerAccount','ItemNumber','FeedType','Action'],
  },
  {
    name: 'Pricing.xlsx',
    sheet: 'Pricing',
    headers: ['ScenarioID','CustomerAccount','CustomerPO','ItemNumber','ShipType',
              'ExistingCC','OriginalPrice','OverridePrice','ReasonCode','CouponCode',
              'NewTier','ExpectedFinalPrice','ExpectedDocumentStatus'],
  },
  {
    name: 'Retail.xlsx',
    sheet: 'Retail',
    headers: ['ScenarioID','CustomerAccount','CustomerPO','ItemNumber','Quantity',
              'CreditToApply','ExpectedInventoryReduction','ExpectedDocumentStatus'],
  },
  {
    name: 'Returns.xlsx',
    sheet: 'Returns',
    headers: ['ScenarioID','CustomerAccount','CustomerPO','OriginalSONumber','ItemNumber',
              'Quantity','ReturnType','ReturnReason','InspectionNotes','ExpectedCreditAmount',
              'CreditToApply','SecondPaymentMethod','ExpectedDocumentStatus'],
  },
];

for (const f of files) {
  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.aoa_to_sheet([f.headers]);
  XLSX.utils.book_append_sheet(wb, ws, f.sheet);
  const dest = path.join(__dirname, '..', 'test-data', f.name);
  XLSX.writeFile(wb, dest);
  console.log(`✔  Created ${dest}`);
}

console.log('\nAll placeholder Excel files created.');
