import { test, expect } from '@playwright/test';
import { readScenario2Data } from '../utils/excel-reader';
import { SalesOrderListPage }      from '../Pages/SalesOrderListPage';
import { SalesOrderPage }          from '../Pages/SalesOrderPage';
import { MCROrderRecapPage }        from '../Pages/MCROrderRecapPage';
import { CandidateForShippingPage } from '../Pages/CandidateForShippingPage';
import { GroupingPage }             from '../Pages/GroupingPage';
import { ShipmentBuilderPage }      from '../Pages/ShipmentBuilderPage';
import { ShipmentsPage }            from '../Pages/ShipmentsPage';

/**
 * Scenario 2: Website SO for credit card customer — ship complete, auto ship,
 * expedited carrier, LTO item, BOL notes, palletized shipment, WMS pick/ship/invoice.
 *
 * All test values are read from:
 *   test-data/Scenario-2.xlsx  →  sheet "Scenario2"
 *
 * ─── KNOWN GAPS (locators not yet confirmed) ────────────────────────────────
 *   1. Sell tab → Order Source + Ship Complete       (steps 19-23)
 *   2. MCR Payments → select EXISTING credit card    (steps 41-50)
 *   3. Candidate for shipping → filter by "Today"    (steps 79-88)
 *   4. Shipment Builder → click Sales order link     (step 111)
 *
 * Search for "// TODO:" in this file to find every gap.
 * Once you have the locators, update this spec AND add the matching method to
 * the relevant Page Object Model in the Pages/ directory.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ─── Excel sheet columns required ──────────────────────────────────────────
 *   CustomerAccount | CustomerPO | OrderSource | ShipComplete | ItemNumber
 *   ShipType        | ExistingCC | ExpectedKoerberStatus | ExpectedDocumentStatus
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Load rows from Excel ──────────────────────────────────────────────────
const testData = readScenario2Data('Scenario-2.xlsx');

// ─── One test per Excel row ───────────────────────────────────────────────
for (const [index, data] of testData.entries()) {
  test.describe(`Scenario 2 — Row ${index + 1} (Customer: ${data.CustomerAccount})`, () => {
    test(`Create SO (ship complete / LTO), ship, invoice [${data.CustomerAccount} / ${data.ItemNumber}]`, async ({ page }) => {

      // Instantiate page objects
      const soListPage = new SalesOrderListPage(page);
      const soPage     = new SalesOrderPage(page);
      const mcrPage    = new MCROrderRecapPage(page);
      const cfsPage    = new CandidateForShippingPage(page);
      const grpPage    = new GroupingPage(page);
      const sbPage     = new ShipmentBuilderPage(page);
      const shipPage   = new ShipmentsPage(page);

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 9-17: All Sales Orders → New → Customer account + PO → OK
      // ═══════════════════════════════════════════════════════════════════════
      await page.goto('/');
      await soListPage.navigate();
      await soListPage.clickNew();

      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 19-23: Sell tab → Order Source = data.OrderSource
      //                       → Ship Complete = data.ShipComplete
      //
      // TODO: These fields live under the "Sell" action-pane tab on the SO form.
      //       To find the correct locators:
      //         1. Open any Sales Order in D365.
      //         2. Click the "Sell" tab on the action pane (top ribbon).
      //         3. Right-click the "Order source" combobox → Inspect.
      //            Look for its `name` attribute or `aria-label`.
      //         4. Right-click the "Ship complete" field → Inspect.
      //            It is likely a Yes/No combobox or a checkbox.
      //         5. Update the selectors below and remove this TODO block.
      //         6. Then move this logic into a new method on SalesOrderPage:
      //              async setSellOptions(orderSource: string, shipComplete: string)
      //
      // Placeholder (commented out until locators are known):
      //   await page.locator('/* TODO: Sell tab button — find name attr */').click();
      //   await page.waitForTimeout(300);
      //   const orderSourceField = page.getByRole('combobox', { name: 'Order source' });
      //   // ↑ verify this aria-label matches D365 exactly (may be "Order Source" with capital S)
      //   await orderSourceField.fill(data.OrderSource);
      //   await orderSourceField.press('Tab');
      //   const shipCompleteField = page.getByRole('combobox', { name: 'Ship complete' });
      //   // ↑ could also be a checkbox: page.getByRole('checkbox', { name: 'Ship complete' })
      //   await shipCompleteField.fill(data.ShipComplete);
      //   await shipCompleteField.press('Tab');
      //   await page.waitForTimeout(300);
      // ═══════════════════════════════════════════════════════════════════════

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 25-31: Enter item number → Save
      // Item 243450-002 is NOT a bundle — no product search dialog expected,
      // but enterItemNumber() handles it gracefully if one does appear.
      // ═══════════════════════════════════════════════════════════════════════
      await soPage.enterItemNumber(data.ItemNumber);

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 33-37: Header tab → Ship Type = data.ShipType ("Auto Ship")
      // ═══════════════════════════════════════════════════════════════════════
      await soPage.setShipType(data.ShipType);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 39: Complete → opens MCR Order Recap dialog
      // Returns the Submit button locator for use in submit() below.
      // ═══════════════════════════════════════════════════════════════════════
      const mcrSubmitBtn = await soPage.clickComplete();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 41-50: MCR Payments → Add → select EXISTING credit card → OK
      //
      // TODO: Scenario 2 picks a SAVED card from a list, NOT a new card.
      //       The existing mcrPage.addCreditCard() opens the new-card iframe
      //       form — that is the WRONG flow here.
      //
      //       To find the correct locators:
      //         1. In the MCR Order Recap dialog click "Add" in the Payments section.
      //         2. A list/grid of saved cards should appear (no iframe).
      //         3. Inspect the grid rows — look for the pattern containing the last-4
      //            digits from data.ExistingCC (e.g. "1111").
      //         4. Inspect the OK button that confirms the selection.
      //         5. Update the selectors below and remove this TODO block.
      //         6. Then add this method to Pages/MCROrderRecapPage.ts:
      //              async selectExistingCreditCard(cardNumberHint: string)
      //
      // Placeholder (commented out until locators are known):
      //   await mcrPage.ensurePaymentsExpanded();
      //   await page.locator('button[name="AddBtn"]').click();
      //   await page.waitForLoadState('networkidle');
      //   // Find row containing the last-4 hint and click it
      //   await page.getByRole('row').filter({ hasText: data.ExistingCC }).first().click();
      //   // ↑ verify role and filter — grid may use a different role in this dialog
      //   await page.getByRole('button', { name: 'OK' }).click();
      //   await page.waitForLoadState('networkidle');
      // ═══════════════════════════════════════════════════════════════════════

      // STEP 51: Submit the MCR order
      await mcrPage.submit(mcrSubmitBtn);

      // ═══════════════════════════════════════════════════════════════════════
      // CAPTURE SALES ORDER NUMBER  (format: SO########)
      // ═══════════════════════════════════════════════════════════════════════
      const salesOrderNumber = await soPage.captureSalesOrderNumber();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 53-63: Lines tab → Reserve the single LTO line
      //
      // Item 243450-002 is NOT a bundle, so row 0 is the actual reservable line.
      // We pass startRow = 0 to reserveAllSubLines() — the default of 1 (for
      // bundle orders where row 0 is a Canceled parent) would skip the only row.
      //
      // NOTE: Ensure item 243450-002 has stock before running this test.
      //       The method throws if ALCPhysicallyAllocated = 0.
      // ═══════════════════════════════════════════════════════════════════════
      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0); // startRow = 0 for non-bundle

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 65-71: Confirm now → Header → Sales order confirmation
      // ═══════════════════════════════════════════════════════════════════════
      await soPage.confirmNow();
      await soPage.viewOrderConfirmation();

      // NOTE: scenario-2.txt step 73 says "Close the page." after viewing the
      // confirmation. Check in D365 whether a Close button appears here.
      // If it does, add: await page.getByRole('button', { name: 'Close' }).click();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 75-88: Candidate for shipping — filter by TODAY's date
      //
      // TODO: Scenario 2 filters by a DATE (Requested ship date = Today),
      //       not by Sales Order number like Scenario 1.
      //       The steps say "Click Today" — a quick-date shortcut button.
      //
      //       To find the correct locators:
      //         1. Open Candidate for shipping in D365.
      //         2. Expand "Records to include" → click " Filter".
      //         3. Set the Field combobox — find what field label maps to
      //            "Requested ship date" (inspect the dropdown options).
      //         4. Once the field is set, look for a "Today" button/link
      //            in the date-range picker and inspect its role/name.
      //         5. Update the selectors below and remove this TODO block.
      //         6. Then add this method to Pages/CandidateForShippingPage.ts:
      //              async filterByToday(dateFieldLabel: string)
      //
      // cfsPage.navigate() WORKS — only the filter needs new locators.
      // ═══════════════════════════════════════════════════════════════════════
      await cfsPage.navigate();

      // Placeholder (commented out until locators are known):
      //   await page.getByRole('button', { name: 'Records to include' }).click();
      //   await page.waitForTimeout(300);
      //   await page.getByRole('button', { name: ' Filter' }).click(); // leading space
      //   await page.waitForTimeout(500);
      //   const fieldCombo = page.getByRole('combobox', { name: 'Field' });
      //   await fieldCombo.fill('Requested ship date'); // TODO: confirm exact field name
      //   await fieldCombo.press('Tab');
      //   await page.waitForTimeout(300);
      //   await page.getByRole('button', { name: 'Today' }).click(); // TODO: confirm locator
      //   await page.getByRole('button', { name: 'OK' }).click();    // inner criteria dialog
      //   await page.waitForTimeout(300);
      //   await page.getByRole('button', { name: 'OK' }).click();    // main dialog → runs job
      //   await page.waitForLoadState('networkidle');
      //   await page.waitForTimeout(1_000);

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 91-93: Grouping → OK
      // ═══════════════════════════════════════════════════════════════════════
      await grpPage.navigate();
      await grpPage.run();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 95-109: Shipment builder → find GRP → Create shipment → Koerber
      // ═══════════════════════════════════════════════════════════════════════
      await sbPage.navigate();
      const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();
      await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus); // expects "Released"

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 111: Click the Sales order link to navigate back to the SO form
      //
      // TODO: After creating the shipment, the Shipment Builder detail shows
      //       a "Sales order" field with a clickable SO number link.
      //       Clicking it navigates back to the SO form, from which Pick and
      //       pack is then triggered (instead of going to the Shipments page
      //       as in Scenario 1).
      //
      //       To find the correct locator:
      //         1. After creating a shipment, inspect the "Sales order" field
      //            value area — the SO number (e.g. SO000233XXX) is a hyperlink.
      //         2. Possible selector:
      //              page.getByRole('link').filter({ hasText: salesOrderNumber }).first()
      //            OR:
      //              page.locator(`[aria-label="Sales order"] ~ * a`)
      //            OR:
      //              page.locator('[data-dyn-controlname*="SalesId"] a')
      //         3. After clicking, wait for the SO form to load.
      //         4. Update below and remove this TODO block.
      //         5. Then add clickSalesOrderLink() to Pages/ShipmentBuilderPage.ts.
      //
      // Placeholder (commented out until locators are known):
      //   await page.getByRole('link').filter({ hasText: salesOrderNumber }).first().click();
      //   // ↑ verify: the link text may include the SO number in various formats
      //   await page.waitForLoadState('networkidle');
      // ═══════════════════════════════════════════════════════════════════════

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 113-132: Pick and pack from the SO form
      //
      // After clicking the SO link (step 111), we are on the Sales Order form.
      // Pick and pack is on the SO Action Pane — the button names should match
      // what ShipmentsPage.pickAndPack() uses, so we attempt to reuse it here.
      //
      // If the buttons are NOT found (e.g. they're only on the Shipments page),
      // add a pickAndPackFromSO() method to Pages/SalesOrderPage.ts with the
      // correct locators found from inspecting the SO form Action Pane.
      //
      // NOTE: steppping through manually first to confirm the method works
      //       from the SO form context before relying on this call.
      // ═══════════════════════════════════════════════════════════════════════
      // TODO: uncomment after step 111 locator is resolved and SO form is open
      // await shipPage.pickAndPack();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 135-147: Post packing slip → Invoice
      //
      // Same button names as Scenario 1. ShipmentsPage methods are role-based
      // (getByRole) so they should work from the SO form once pick/pack is done.
      // ═══════════════════════════════════════════════════════════════════════
      // TODO: uncomment after step 111 and pickAndPack are resolved
      // await shipPage.postPackingSlip();
      // await shipPage.invoice();

      // ═══════════════════════════════════════════════════════════════════════
      // STEPS 149-152: Reload → Header tab → Verify Document Status = "Invoice"
      // ═══════════════════════════════════════════════════════════════════════
      // TODO: uncomment after the steps above are working
      // await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);

      console.log(
        `✓ Scenario 2 Row ${index + 1} reached post-MCR Submit: SO ${salesOrderNumber}` +
        ` — Customer: ${data.CustomerAccount}, Item: ${data.ItemNumber}`,
      );

      // ─── Remove the lines below once all TODOs are resolved ─────────────
      console.warn(
        '⚠ Scenario 2 is INCOMPLETE — the following steps are commented out ' +
        'pending locator discovery:\n' +
        '  • Steps 19-23  : Sell tab → Order Source + Ship Complete\n' +
        '  • Steps 41-50  : Select existing credit card from list\n' +
        '  • Steps 75-88  : Candidate for shipping — filter by Today\n' +
        '  • Step  111    : Click Sales order link back from Shipment Builder\n' +
        '  • Steps 113-132: Pick and pack (uncomment after step 111)\n' +
        '  • Steps 135-147: Post packing slip + Invoice (uncomment after above)\n' +
        '  • Steps 149-152: Verify Document Status (uncomment after above)',
      );
    });
  });
}
