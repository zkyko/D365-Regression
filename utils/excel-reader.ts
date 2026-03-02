/**
 * Utility: read test-data rows from an Excel (.xlsx) file.
 *
 * Usage inside a spec:
 *   import { readScenarioData } from '../utils/excel-reader';
 *   const [data] = readScenarioData('Scenario-1.xlsx');   // first row
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

/** Shape of one row in Scenario-1.xlsx */
export interface Scenario1Data {
  // Sales Order fields
  CustomerAccount        : string;
  CustomerPO             : string;
  ItemNumber             : string;
  ShipType               : string;

  // Credit Card fields
  CC_Name                : string;
  CC_Number              : string;
  CC_CVV                 : string;
  CC_ExpMonth            : string;
  CC_ExpYear             : string;
  CC_Zip                 : string;
  CC_Address             : string;

  // Verification / Expected values
  ExpectedShipType       : string;
  ExpectedKoerberStatus  : string;
  ExpectedDocumentStatus : string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of one row in Scenario-2.xlsx  (sheet "Scenario2").
 *
 * Column headers in the Excel sheet must match these property names exactly.
 */
export interface Scenario2Data {
  // Sales Order fields
  CustomerAccount        : string;  // e.g. 100012
  CustomerPO             : string;  // free-form PO reference

  // Sell-tab fields  ← TODO: confirm exact D365 field labels before filling sheet
  OrderSource            : string;  // e.g. WEB
  ShipComplete           : string;  // e.g. Yes  (value entered into the Ship complete field)

  // Item / shipping
  ItemNumber             : string;  // e.g. 243450-002  (LTO item, must have stock)
  ShipType               : string;  // e.g. Auto Ship

  // Payment — existing saved card
  ExistingCC             : string;  // Last-4 hint used to identify the card, e.g. 1111

  // Verification / expected values
  ExpectedKoerberStatus  : string;  // e.g. Released
  ExpectedDocumentStatus : string;  // e.g. Invoice
}

/**
 * Read all data rows from `test-data/<fileName>`, sheet name "Scenario2".
 * Numeric cells are coerced to strings so fill() calls always get a string.
 */
export function readScenario2Data(fileName: string): Scenario2Data[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);

  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Scenario2'];

  if (!sheet) {
    throw new Error(
      `Sheet "Scenario2" not found in ${filePath}. ` +
      `Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: '',
  });

  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      CustomerAccount        : str('CustomerAccount'),
      CustomerPO             : str('CustomerPO'),
      OrderSource            : str('OrderSource'),
      ShipComplete           : str('ShipComplete'),
      ItemNumber             : str('ItemNumber'),
      ShipType               : str('ShipType'),
      ExistingCC             : str('ExistingCC'),
      ExpectedKoerberStatus  : str('ExpectedKoerberStatus'),
      ExpectedDocumentStatus : str('ExpectedDocumentStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing (Scenarios 11, 55, 98–108)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in Pricing.xlsx (sheet "Pricing") */
export interface PricingData {
  ScenarioID             : string;  // e.g. "11", "55", "98"
  CustomerAccount        : string;
  CustomerPO             : string;
  ItemNumber             : string;
  ShipType               : string;
  ExistingCC             : string;  // last-4 for existing CC (reuses Scenario 2 flow)
  OriginalPrice          : string;  // expected price before any override
  OverridePrice          : string;  // new price to enter (Scenario 55)
  ReasonCode             : string;  // reason code to select after price override
  CouponCode             : string;  // coupon code to apply (Scenarios 98-101, 108)
  NewTier                : string;  // customer loyalty tier (Scenarios 105, 107)
  ExpectedFinalPrice     : string;  // price to assert after all changes
  ExpectedDocumentStatus : string;
}

export function readPricingData(fileName: string): PricingData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Pricing'];
  if (!sheet) throw new Error(`Sheet "Pricing" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID             : str('ScenarioID'),
      CustomerAccount        : str('CustomerAccount'),
      CustomerPO             : str('CustomerPO'),
      ItemNumber             : str('ItemNumber'),
      ShipType               : str('ShipType'),
      ExistingCC             : str('ExistingCC'),
      OriginalPrice          : str('OriginalPrice'),
      OverridePrice          : str('OverridePrice'),
      ReasonCode             : str('ReasonCode'),
      CouponCode             : str('CouponCode'),
      NewTier                : str('NewTier'),
      ExpectedFinalPrice     : str('ExpectedFinalPrice'),
      ExpectedDocumentStatus : str('ExpectedDocumentStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipment Builder (Scenarios 21, 30, 35–46, 89–91, 117)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in ShipmentBuilder.xlsx (sheet "ShipmentBuilder") */
export interface ShipmentBuilderData {
  ScenarioID             : string;  // e.g. "21", "39", "117"
  CustomerAccount        : string;
  CustomerPO             : string;
  ItemNumber             : string;
  ShipType               : string;
  ExistingCC             : string;
  DeliveryTerms          : string;  // e.g. "ThirdParty", "Prepaid" (Scenarios 89–91)
  CarrierService         : string;  // e.g. "FedExGround", "LTL" (Scenarios 89–91)
  ExpectedKoerberStatus  : string;
  ExpectedDocumentStatus : string;
}

export function readShipmentBuilderData(fileName: string): ShipmentBuilderData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['ShipmentBuilder'];
  if (!sheet) throw new Error(`Sheet "ShipmentBuilder" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID             : str('ScenarioID'),
      CustomerAccount        : str('CustomerAccount'),
      CustomerPO             : str('CustomerPO'),
      ItemNumber             : str('ItemNumber'),
      ShipType               : str('ShipType'),
      ExistingCC             : str('ExistingCC'),
      DeliveryTerms          : str('DeliveryTerms'),
      CarrierService         : str('CarrierService'),
      ExpectedKoerberStatus  : str('ExpectedKoerberStatus'),
      ExpectedDocumentStatus : str('ExpectedDocumentStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// D Channel (Scenarios 58–75, 120–123)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in DChannel.xlsx (sheet "DChannel") */
export interface DChannelData {
  ScenarioID             : string;  // e.g. "58", "59", "73"
  CustomerAccount        : string;
  CustomerPO             : string;
  ItemNumber             : string;
  VendorAccount          : string;  // primary vendor account
  VendorAccount2         : string;  // second vendor (Scenario 65 — 2 vendors)
  NewItemNumber          : string;  // item added after PO (Scenarios 69/70)
  FreightTerms           : string;  // "CustomerCarries" or "FHCarries"
  DepositRequired        : string;  // "Yes" or "No"
  DepositAmount          : string;  // deposit amount (Scenarios 71/72)
  FreightCharge          : string;  // freight charge amount
  LCLFee                 : string;  // LCL fee amount (Scenario 58)
  TransportationCharge   : string;  // transportation charge (Scenario 60)
  ShipWindowFrom         : string;  // ship window start date
  ShipWindowTo           : string;  // ship window end date
  NewQuantity            : string;  // updated qty (Scenario 67)
  NewPrice               : string;  // updated price (Scenario 68)
  NewName                : string;  // new delivery name (Scenarios 120/121)
  NewStreet              : string;  // new delivery street
  NewCity                : string;  // new delivery city
  NewState               : string;  // new delivery state
  NewZip                 : string;  // new delivery zip
  ExpectedPOStatus       : string;  // e.g. "Open order", "Cancelled"
  LineIndexToCancel      : string;  // 0-based index (Scenario 74)
}

export function readDChannelData(fileName: string): DChannelData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['DChannel'];
  if (!sheet) throw new Error(`Sheet "DChannel" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID           : str('ScenarioID'),
      CustomerAccount      : str('CustomerAccount'),
      CustomerPO           : str('CustomerPO'),
      ItemNumber           : str('ItemNumber'),
      VendorAccount        : str('VendorAccount'),
      VendorAccount2       : str('VendorAccount2'),
      NewItemNumber        : str('NewItemNumber'),
      FreightTerms         : str('FreightTerms'),
      DepositRequired      : str('DepositRequired'),
      DepositAmount        : str('DepositAmount'),
      FreightCharge        : str('FreightCharge'),
      LCLFee               : str('LCLFee'),
      TransportationCharge : str('TransportationCharge'),
      ShipWindowFrom       : str('ShipWindowFrom'),
      ShipWindowTo         : str('ShipWindowTo'),
      NewQuantity          : str('NewQuantity'),
      NewPrice             : str('NewPrice'),
      NewName              : str('NewName'),
      NewStreet            : str('NewStreet'),
      NewCity              : str('NewCity'),
      NewState             : str('NewState'),
      NewZip               : str('NewZip'),
      ExpectedPOStatus     : str('ExpectedPOStatus'),
      LineIndexToCancel    : str('LineIndexToCancel'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Returns & Credits (Scenarios 76–88, 97)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in Returns.xlsx (sheet "Returns") */
export interface ReturnsData {
  ScenarioID             : string;  // e.g. "76", "78", "97"
  CustomerAccount        : string;
  CustomerPO             : string;
  OriginalSONumber       : string;  // leave blank for Scenarios 83–86 (no SO in D365)
  ItemNumber             : string;
  Quantity               : string;
  ReturnType             : string;  // "CreditOnly", "CreditWithInventory", "Replacement"
  ReturnReason           : string;  // reason code
  InspectionNotes        : string;  // for Scenarios 78/79
  ExpectedCreditAmount   : string;
  CreditToApply          : string;  // amount of on-account credit to apply (Scenarios 81/82)
  SecondPaymentMethod    : string;  // 2nd payment for Scenario 82
  ExpectedDocumentStatus : string;
}

export function readReturnsData(fileName: string): ReturnsData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Returns'];
  if (!sheet) throw new Error(`Sheet "Returns" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID             : str('ScenarioID'),
      CustomerAccount        : str('CustomerAccount'),
      CustomerPO             : str('CustomerPO'),
      OriginalSONumber       : str('OriginalSONumber'),
      ItemNumber             : str('ItemNumber'),
      Quantity               : str('Quantity'),
      ReturnType             : str('ReturnType'),
      ReturnReason           : str('ReturnReason'),
      InspectionNotes        : str('InspectionNotes'),
      ExpectedCreditAmount   : str('ExpectedCreditAmount'),
      CreditToApply          : str('CreditToApply'),
      SecondPaymentMethod    : str('SecondPaymentMethod'),
      ExpectedDocumentStatus : str('ExpectedDocumentStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Retail (Scenarios 92–94)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in Retail.xlsx (sheet "Retail") */
export interface RetailData {
  ScenarioID             : string;
  CustomerAccount        : string;  // or "ONEOFF" for one-time customer
  CustomerPO             : string;
  ItemNumber             : string;
  Quantity               : string;
  CreditToApply          : string;  // for Scenario 94
  ExpectedInventoryReduction : string;
  ExpectedDocumentStatus : string;
}

export function readRetailData(fileName: string): RetailData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Retail'];
  if (!sheet) throw new Error(`Sheet "Retail" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID                 : str('ScenarioID'),
      CustomerAccount            : str('CustomerAccount'),
      CustomerPO                 : str('CustomerPO'),
      ItemNumber                 : str('ItemNumber'),
      Quantity                   : str('Quantity'),
      CreditToApply              : str('CreditToApply'),
      ExpectedInventoryReduction : str('ExpectedInventoryReduction'),
      ExpectedDocumentStatus     : str('ExpectedDocumentStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Allocations (Scenarios 95–96, 110–114)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in Allocations.xlsx (sheet "Allocations") */
export interface AllocationsData {
  ScenarioID                : string;
  CustomerAccount           : string;
  CustomerPO                : string;
  ItemNumber                : string;
  HoldType                  : string;  // "Incomplete" or "Soft" (Scenarios 95/96)
  SourceSONumber            : string;  // for move-allocation (Scenario 112)
  TargetSONumber            : string;  // for move-allocation (Scenario 112)
  ExpectedReservationStatus : string;  // e.g. "Reserved", "Available"
}

export function readAllocationsData(fileName: string): AllocationsData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Allocations'];
  if (!sheet) throw new Error(`Sheet "Allocations" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID                : str('ScenarioID'),
      CustomerAccount           : str('CustomerAccount'),
      CustomerPO                : str('CustomerPO'),
      ItemNumber                : str('ItemNumber'),
      HoldType                  : str('HoldType'),
      SourceSONumber            : str('SourceSONumber'),
      TargetSONumber            : str('TargetSONumber'),
      ExpectedReservationStatus : str('ExpectedReservationStatus'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Master (Scenarios 56–57)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in CustomerMaster.xlsx (sheet "CustomerMaster") */
export interface CustomerMasterData {
  ScenarioID         : string;
  CustomerAccount    : string;
  CustomerPO         : string;
  ItemNumber         : string;  // for Scenario 57 transaction verification
  NewChargesGroup    : string;
  NewAccountStatus   : string;
  NewAESS            : string;
  NewPaymentMethod   : string;
}

export function readCustomerMasterData(fileName: string): CustomerMasterData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['CustomerMaster'];
  if (!sheet) throw new Error(`Sheet "CustomerMaster" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID       : str('ScenarioID'),
      CustomerAccount  : str('CustomerAccount'),
      CustomerPO       : str('CustomerPO'),
      ItemNumber       : str('ItemNumber'),
      NewChargesGroup  : str('NewChargesGroup'),
      NewAccountStatus : str('NewAccountStatus'),
      NewAESS          : str('NewAESS'),
      NewPaymentMethod : str('NewPaymentMethod'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Feed (Scenarios 115–116, 118–119)
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of one row in InventoryFeed.xlsx (sheet "InventoryFeed") */
export interface InventoryFeedData {
  ScenarioID      : string;
  CustomerAccount : string;
  ItemNumber      : string;
  FeedType        : string;  // "Email" or "846"
  Action          : string;  // "Add" or "Remove"
}

export function readInventoryFeedData(fileName: string): InventoryFeedData[] {
  const filePath = path.join(__dirname, '..', 'test-data', fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['InventoryFeed'];
  if (!sheet) throw new Error(`Sheet "InventoryFeed" not found in ${filePath}. Available: ${workbook.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      ScenarioID      : str('ScenarioID'),
      CustomerAccount : str('CustomerAccount'),
      ItemNumber      : str('ItemNumber'),
      FeedType        : str('FeedType'),
      Action          : str('Action'),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read all data rows from `test-data/<fileName>`, sheet name "Scenario1".
 * Numeric cells are coerced to strings so fill() calls always get a string.
 */
export function readScenarioData(fileName: string): Scenario1Data[] {
  const filePath = path.join(
    __dirname,
    '..',
    'test-data',
    fileName,
  );

  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Scenario1'];

  if (!sheet) {
    throw new Error(
      `Sheet "Scenario1" not found in ${filePath}. ` +
      `Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }

  // raw:false → all values come back as formatted strings (dates, numbers included)
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: '',
  });

  return rows.map((row) => {
    const str = (key: string): string => String(row[key] ?? '').trim();
    return {
      CustomerAccount        : str('CustomerAccount'),
      CustomerPO             : str('CustomerPO'),
      ItemNumber             : str('ItemNumber'),
      ShipType               : str('ShipType'),
      CC_Name                : str('CC_Name'),
      CC_Number              : str('CC_Number'),
      CC_CVV                 : str('CC_CVV'),
      CC_ExpMonth            : str('CC_ExpMonth'),
      CC_ExpYear             : str('CC_ExpYear'),
      CC_Zip                 : str('CC_Zip'),
      CC_Address             : str('CC_Address'),
      ExpectedShipType       : str('ExpectedShipType'),
      ExpectedKoerberStatus  : str('ExpectedKoerberStatus'),
      ExpectedDocumentStatus : str('ExpectedDocumentStatus'),
    };
  });
}
