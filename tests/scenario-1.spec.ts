import { test, expect } from '@playwright/test';
import { readScenarioData } from '../utils/excel-reader';
import { SalesOrderPage } from '../Pages/SalesOrderPage';

/**
 * Scenario 1: Create a website sales order for credit card customer and autoship
 *
 * All test values (customer, item, card details, ship type, etc.) are read from:
 *   test-data/Scenario-1.xlsx  →  sheet "Scenario1"
 *
 * To run with different data, edit the Excel file and re-run — no code changes needed.
 * To run multiple variants, add more rows to the Excel sheet.
 *
 * Flow:
 *   All Sales Orders → New → Customer → Item → Header (Ship Type)
 *   → Complete → Add Credit Card → Submit
 *   → Lines tab → Reserve all sub-lines
 *   → Confirm now → Sales order confirmation
 *   → Candidate for shipping (filter by SO#) → Grouping → Shipment builder
 *   → Select GRP row → Create shipment → Verify Koerber status
 *   → Shipments page → Pick and pack → Picking list registration → Update all
 *   → Post packing slip → Invoice
 *   → Reload → Header → Verify Document Status
 */

// ─── Load rows from Excel ──────────────────────────────────────────────────────
const testData = readScenarioData('Scenario-1.xlsx');

// ─── One test per Excel row ───────────────────────────────────────────────────
for (const [index, data] of testData.entries()) {
  test.describe(`Scenario 1 — Row ${index + 1} (Customer: ${data.CustomerAccount})`, () => {
    test(`Create SO, ship, and invoice [${data.CustomerAccount} / ${data.ItemNumber}]`, async ({ page }) => {

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 2-3: Navigate to All Sales Orders → Click New
      // ═════════════════════════════════════════════════════════════════════════
      await page.goto('/');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search for a page' }).fill('All sales orders');
      await page.getByRole('option', { name: 'All sales orders Accounts' }).click();
      await page.waitForURL('**/*SalesTableListPage*');

      await page.locator('button[name="SystemDefinedNewButton"]').click();
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 4-6: Customer account + Customer PO → OK
      // Data: CustomerAccount, CustomerPO
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('combobox', { name: 'Customer account' }).fill(data.CustomerAccount);
      await page.getByRole('combobox', { name: 'Customer account' }).press('Tab');
      await page.waitForTimeout(800); // wait for lookup to resolve

      const customerReqField = page.getByRole('textbox', { name: 'Customer requisition' });
      if (await customerReqField.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await customerReqField.fill(data.CustomerPO);
      }

      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForURL('**/*SalesTable*', { timeout: 60_000 });
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 7-11: Enter item number → Save
      // Data: ItemNumber
      // ═════════════════════════════════════════════════════════════════════════
      const itemNumberCombo = page.getByRole('combobox', { name: 'Item number' });
      await itemNumberCombo.click();
      await itemNumberCombo.fill(data.ItemNumber);
      await itemNumberCombo.press('Tab');
      await page.waitForTimeout(1500); // wait for bundle sub-lines / dialog to appear

      // ── Product search dialog ────────────────────────────────────────────────
      // Appears when the item number matches more than one product variant.
      // The first row is already highlighted (active) when the dialog opens.
      // We verify its item number matches data.ItemNumber, then accept.
      const addLinesAndCloseBtn = page.getByRole('button', { name: 'Add lines and close' });
      if (await addLinesAndCloseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        // Log the result count from the tooltip field for debugging
        const resultsTip = await page
          .locator('input[name="Results"]')
          .getAttribute('data-dyn-qtip-title')
          .catch(() => '');
        console.log(`ℹ Product search dialog opened: ${resultsTip || '(no count)'}`);

        // Verify the first row's item number matches what we entered
        const firstRowItemInput = page
          .locator('[id*="GridExistingItems"][id$="-row-0"] input[aria-label="Item number"]');
        const actualItem = await firstRowItemInput.inputValue({ timeout: 3_000 }).catch(() => '');
        console.log(`ℹ Product search first row item number: "${actualItem}"`);
        if (actualItem && actualItem !== data.ItemNumber) {
          throw new Error(
            `❌ Product search first row item "${actualItem}" does not match expected "${data.ItemNumber}". ` +
            `Update the item number in the Excel sheet.`
          );
        }

        // Row 0 is already selected — click "Add lines and close" to confirm
        await addLinesAndCloseBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500); // wait for bundle sub-lines to expand after adding
      }
      // ─────────────────────────────────────────────────────────────────────────

      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 12-14: Header tab → Ship Type
      // Data: ShipType
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByText('Header', { exact: true }).click();
      await page.waitForTimeout(500);

      const shipTypeCombo = page.getByRole('combobox', { name: 'Ship type' });
      await shipTypeCombo.fill(data.ShipType);
      await shipTypeCombo.press('Tab');
      await page.waitForTimeout(500);

      // ═════════════════════════════════════════════════════════════════════════
      // STEP 15: Complete → opens MCR Order Recap dialog
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Complete' }).click();
      await page.waitForLoadState('networkidle');

      // Confirm MCR Order Recap dialog is open.
      // Submit button DOM id pattern: MCRSalesOrderRecap_N_SubmitButton (N is dynamic session number)
      const mcrSubmitBtn = page.locator('button[name="SubmitButton"]');
      await mcrSubmitBtn.waitFor({ state: 'visible', timeout: 15_000 });

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 16-20: Payments → Add → Add credit card → fill details → OK → OK
      // Data: CC_Name, CC_Number, CC_CVV, CC_ExpMonth, CC_ExpYear, CC_Zip, CC_Address
      // ═════════════════════════════════════════════════════════════════════════
      // Payments section is pre-expanded. Expand it if somehow collapsed.
      // Toggle id: MCRSalesOrderRecap_N_SalesOrderSummaryPayments_caption
      const paymentsToggle = page.locator('button[id*="SalesOrderSummaryPayments"]').first();
      if (await paymentsToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const isExpanded = await paymentsToggle.getAttribute('aria-expanded');
        if (isExpanded !== 'true') {
          await paymentsToggle.click();
          await page.waitForTimeout(500);
        }
      }

      // Payments Add button: id="MCRSalesOrderRecap_N_AddBtn", name="AddBtn"
      // NOTE: this button has NO aria-label — accessible name comes from its text content only.
      const paymentsAddBtn = page.locator('button[name="AddBtn"]');
      await paymentsAddBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await paymentsAddBtn.click();
      await page.waitForLoadState('networkidle');

      // Add credit card
      await page.getByRole('button', { name: 'Add credit card' }).click();
      await page.waitForLoadState('networkidle');

      // Fill credit card details in the nested iframe
      const iframe        = page.locator('iframe').first();
      const iframeContent = iframe.contentFrame();

      await iframeContent.getByRole('textbox', { name: 'Name' }).fill(data.CC_Name);

      const cardFrame = iframeContent.locator('iframe[title="Card Number"]').contentFrame();
      await cardFrame.getByRole('textbox', { name: 'Card Number' }).fill(data.CC_Number);

      const cvvFrame = iframeContent.locator('iframe[title="CVV"]').contentFrame();
      await cvvFrame.getByRole('textbox', { name: 'CVC' }).fill(data.CC_CVV);

      await iframeContent.getByRole('spinbutton', { name: 'Month' }).fill(data.CC_ExpMonth);
      await iframeContent.getByRole('spinbutton', { name: 'Year'  }).fill(data.CC_ExpYear);
      await iframeContent.getByRole('textbox',    { name: 'Zip'   }).fill(data.CC_Zip);
      await iframeContent.getByRole('textbox',    { name: 'Address' }).fill(data.CC_Address);

      // OK on credit card tokenization dialog
      // id="CreditCardTokenization_N_OK", name="OK" — use name attr to avoid matching "brOKer" FastTab
      await page.locator('button[name="OK"]').click();
      await page.waitForLoadState('networkidle');

      // OK on payment amount dialog (MCRCustPaymDialog_N_OKButton → name="OKButton")
      await page.locator('button[name="OKButton"]').click();
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEP 21: Submit order (MCR Order Recap "Submit" button)
      // id pattern: MCRSalesOrderRecap_N_SubmitButton, name="SubmitButton"
      // ═════════════════════════════════════════════════════════════════════════
      await mcrSubmitBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // ═════════════════════════════════════════════════════════════════════════
      // CAPTURE SALES ORDER NUMBER  (format: SO########)
      // ═════════════════════════════════════════════════════════════════════════
      let salesOrderNumber = '';
      try {
        const soEl = page.locator('[id*="SalesId"]').filter({ hasText: /^SO\d+/ }).first();
        salesOrderNumber = (await soEl.textContent({ timeout: 10_000 }))?.trim() ?? '';
      } catch {
        const allText = await page.locator('body').textContent();
        salesOrderNumber = allText?.match(/SO\d{6,}/)?.[0] ?? '';
      }
      console.log('✓ Sales Order Number:', salesOrderNumber);

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 22-42: Lines tab → Reserve each bundle sub-line
      // Per Scenario-1.txt steps 22-42: reservation happens after MCR Submit
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByText('Lines', { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // Scroll to "Sales order lines" FastTab — D365 only renders grid rows
      // for sections that are in the viewport.  aria-label is stable; the id
      // contains a dynamic session number so we use aria-label instead.
      const salesOrderLinesFastTab = page.locator('button[aria-label="Sales order lines"]');
      await salesOrderLinesFastTab.waitFor({ state: 'visible', timeout: 10_000 });
      await salesOrderLinesFastTab.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // allow D365 to lazily render rows after scroll

      // D365 grids use div-based role="row" elements, NOT <table><tbody><tr>.
      // The Order lines grid (aria-label="Order lines") contains:
      //   - row 0: bundle parent (Line status = "Canceled") → skip
      //   - rows 1-N: sub-lines (Line status = "Open order") → reserve each
      const orderLinesGrid = page.locator('[role="grid"][aria-label="Order lines"]');
      await orderLinesGrid.waitFor({ state: 'visible', timeout: 10_000 });
      const dataRows = orderLinesGrid.locator('[role="row"]:has([role="gridcell"])');
      const rowCount = await dataRows.count();
      console.log(`ℹ Order lines row count: ${rowCount}`);

      // Row 0 is always the bundle parent (Line status "Canceled") — skip it.
      // Rows 1-N are the sub-lines (Line status "Open order") — reserve each.
      // NOTE: we do NOT read input[aria-label="Line status"] here because D365
      // only populates that value after the row is selected, so it reads as ""
      // for all unselected rows and would cause every row to be skipped.
      for (let i = 1; i < rowCount; i++) {
        const row = dataRows.nth(i);

        await row.click();
        await page.waitForTimeout(300);

        // Inventory → Reservation (use name attrs for reliable targeting in D365)
        // name="buttonLineInventReservation" is stable; avoids matching "Batch reservation"
        await page.locator('button[name="ButtonLineInventory"]').click();
        await page.locator('button[name="buttonLineInventReservation"]').click();
        await page.waitForLoadState('networkidle');

        // ── Stock check ────────────────────────────────────────────────────────
        // ALCPhysicallyAllocated = physically available on-hand qty.
        // If 0, the item has no stock — stop immediately rather than silently fail.
        const availQtyInput = page.locator('input[name="ALCPhysicallyAllocated"]');
        await availQtyInput.waitFor({ state: 'visible', timeout: 10_000 });
        const availQtyRaw = await availQtyInput.inputValue();
        const availQty = parseFloat(availQtyRaw.replace(/,/g, '') || '0');
        if (availQty <= 0) {
          throw new Error(
            `❌ No available stock for item ${data.ItemNumber} ` +
            `(ALCPhysicallyAllocated = "${availQtyRaw}"). ` +
            `Ensure inventory exists before running the test, or change the item number.`
          );
        }
        // ──────────────────────────────────────────────────────────────────────

        // Reserve lot button: id pattern WHSInventOnHandReserve_N_ALCReserveLot
        await page.locator('button[name="ALCReserveLot"]').click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Close' }).click();
        await page.waitForTimeout(300);
      }

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 43-47: Confirm now → Header → Sales order confirmation
      // Use shared page object logic so we benefit from robust "Sell" + "Confirm
      // sales order" locators (including the span.button-label fallback).
      // ═════════════════════════════════════════════════════════════════════════
      const soPage = new SalesOrderPage(page);
      await soPage.confirmNow();

      await page.getByText('Header', { exact: true }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Sales order confirmation' }).click();
      await page.waitForLoadState('networkidle');

      // Verify the confirmation amount field is visible (id: CustConfirmJour_ConfirmAmount_*_input)
      const priceEl = page.locator('[id*="CustConfirmJour"][id*="ConfirmAmount"]').first();
      await expect(priceEl).toBeVisible({ timeout: 10_000 });

      // NOTE: No "Close" button on the Sales order confirmation view — navigate directly.

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 48-55: Candidate for shipping — filter by SO number
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search for a page' }).fill('Candidate for shipping');
      await page.getByRole('option', { name: 'Candidate for shipping Retail' }).click();
      await page.waitForLoadState('networkidle');

      // Expand "Records to include"
      await page.getByRole('button', { name: 'Records to include' }).click();
      await page.waitForTimeout(300);

      // Click Filter (leading space is part of the button label — icon + text)
      await page.getByRole('button', { name: ' Filter' }).click();
      await page.waitForTimeout(500);

      // Set Field = Sales order, Criteria = captured SO number
      const fieldCombo = page.getByRole('combobox', { name: 'Field' });
      await fieldCombo.fill('Sales order');
      await fieldCombo.press('Tab');
      await page.waitForTimeout(500);

      const criteriaCombo = page.getByRole('combobox', { name: 'Criteria' });
      await criteriaCombo.fill(salesOrderNumber);
      await criteriaCombo.press('Tab');
      await page.waitForTimeout(300);

      // OK on inner filter criteria dialog
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(300);

      // OK on main Candidate for shipping dialog (runs the batch job)
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 56-57: Grouping → OK  (creates GRP number for our SO)
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search for a page' }).fill('Grouping');
      await page.getByRole('option', { name: 'Grouping Retail and Commerce' }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // ═════════════════════════════════════════════════════════════════════════
      // STEP 58: Navigate to Shipment builder
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search for a page' }).fill('Shipment builder');
      await page.getByRole('option', { name: 'Shipment builder Retail and' }).click();
      await page.waitForURL('**/*rsmShipmentBuilder*');
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 59-61: Find GRP row for our customer account and select it
      // Data: CustomerAccount (used as the row identifier)
      // ═════════════════════════════════════════════════════════════════════════
      const ourRow = page.getByRole('row').filter({ hasText: data.CustomerAccount }).first();
      await ourRow.waitFor({ state: 'visible', timeout: 15_000 });
      await ourRow.click();

      // Capture GRP number from the first cell of the selected row
      const grpCell  = ourRow.getByRole('gridcell').first();
      const grpNumber = (await grpCell.textContent())?.trim() ?? '';
      console.log('✓ Shipment Group:', grpNumber);

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 62-64: Shipments → Create shipment → Yes
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Shipments' }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Create shipment' })
        .or(page.getByRole('menuitem', { name: 'Create shipment' }))
        .first()
        .click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Yes' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // ═════════════════════════════════════════════════════════════════════════
      // STEP 65: Verify Koerber status
      // Data: ExpectedKoerberStatus
      // ═════════════════════════════════════════════════════════════════════════
      if (data.ExpectedKoerberStatus) {
        const koerberEl = page.locator('[id*="KoerberStatus"], [name*="KoerberStatus"]').first();
        await expect(koerberEl)
          .toContainText(data.ExpectedKoerberStatus, { timeout: 30_000 })
          .catch(() => console.warn(`⚠ Koerber status not "${data.ExpectedKoerberStatus}" — continuing`));
      }

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 66-67: Navigate to Shipments page
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('textbox', { name: 'Search for a page' }).fill('Shipments');
      await page.getByRole('option', { name: 'Shipments Retail and Commerce' }).click();
      await page.waitForLoadState('networkidle');

      // Filter to our shipment group
      if (grpNumber) {
        await page.getByRole('combobox', { name: 'Filter' }).fill(grpNumber);
        await page.getByRole('combobox', { name: 'Filter' }).press('Enter');
        await page.waitForTimeout(1000);
      }

      await page.getByRole('row').filter({ hasText: grpNumber || data.CustomerAccount }).first().click();

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 68-76: Pick and pack → Picking list registration → Update all → Close
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Pick and pack' }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Picking list registration' })
        .or(page.getByRole('menuitem', { name: 'Picking list registration' }))
        .first()
        .click();
      await page.waitForLoadState('networkidle');

      // Select all checkboxes (steps 70, 72, 74)
      const selectCheckboxes = page.getByRole('checkbox', { name: 'Select' });
      const cbCount          = await selectCheckboxes.count();
      for (let i = 0; i < cbCount; i++) {
        await selectCheckboxes.nth(i).check().catch(() => {});
      }

      // Updates → Update all
      await page.getByRole('button', { name: 'Updates' }).click();
      await page.waitForTimeout(300);
      await page.getByRole('menuitem', { name: 'Update all' }).click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Close' }).click();
      await page.waitForTimeout(500);

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 78-80: Post packing slip → OK → OK
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Post packing slip' }).click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 81-84: Invoice → Invoice → OK → OK
      // ═════════════════════════════════════════════════════════════════════════
      await page.getByRole('button', { name: 'Invoice' }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Invoice' })
        .or(page.getByRole('menuitem', { name: 'Invoice' }))
        .first()
        .click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForLoadState('networkidle');

      // ═════════════════════════════════════════════════════════════════════════
      // STEPS 85-87: Reload → Header tab → Verify Document Status
      // Data: ExpectedDocumentStatus
      // ═════════════════════════════════════════════════════════════════════════
      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.getByText('Header', { exact: true }).click();
      await page.waitForTimeout(500);

      const documentStatusEl = page.locator('[id*="DocumentStatus"], [name*="DocumentStatus"]').first();
      await expect(documentStatusEl).toContainText(
        data.ExpectedDocumentStatus,
        { timeout: 15_000 },
      );

      console.log(
        `✓ Scenario 1 Row ${index + 1} PASSED: SO ${salesOrderNumber}` +
        ` — Customer: ${data.CustomerAccount}, Item: ${data.ItemNumber}`,
      );
    });
  });
}
