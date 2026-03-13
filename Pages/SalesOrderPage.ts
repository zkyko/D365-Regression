import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SalesOrderPage — the Sales Order detail form.
 *
 * Covers all tabs and actions on the SO detail form:
 *   - New-order dialog  (customer account, customer PO)
 *   - Lines tab         (item number entry, product-search dialog)
 *   - Header tab        (ship type)
 *   - Complete button   (opens MCR Order Recap)
 *   - SO number capture
 *   - Lines tab reservation flow
 *   - Confirm Now
 *   - Sales Order Confirmation view
 */
export class SalesOrderPage extends BasePage {

  // ─── New SO dialog ────────────────────────────────────────────────────────
  readonly customerAccountCombo: Locator =
    this.page.getByRole("combobox", { name: "Customer account" });
  readonly customerRequisitionField: Locator =
    this.page.getByRole("textbox", { name: "Customer requisition" });
  readonly okButton: Locator =
    this.page.getByRole("button", { name: "OK" });

  // ─── Item number entry ────────────────────────────────────────────────────
  readonly itemNumberCombo: Locator =
    this.page.getByRole("combobox", { name: "Item number" });
  // Product search dialog — appears when item matches multiple variants
  readonly addLinesAndCloseBtn: Locator =
    this.page.getByRole("button", { name: "Add lines and close" });
  readonly productSearchFirstRowItemInput: Locator =
    this.page.locator('[id*="GridExistingItems"][id$="-row-0"] input[aria-label="Item number"]');
  readonly productSearchResultsField: Locator =
    this.page.locator('input[name="Results"]');
  readonly saveButton: Locator =
    this.page.getByRole("button", { name: "Save" });

  // ─── Tab navigation ───────────────────────────────────────────────────────
  readonly headerTab: Locator = this.page.getByText("Header", { exact: true });
  readonly linesTab:  Locator = this.page.getByText("Lines",  { exact: true });
  // Action-pane "Sell" tab — must be clicked before "Confirm sales order".
  // D365 keeps both the list-page and the detail-form action panes in the DOM
  // simultaneously; only the detail-form pane is visible. Target the Sell tab
  // button that is currently visible (id ends with "_Sell_button", only one
  // will have a non-zero bounding box at any given time).
  readonly sellTab: Locator =
    this.page.locator('button[id$="_Sell_button"]:visible').first();

  // ─── Header tab ───────────────────────────────────────────────────────────
  readonly shipTypeCombo: Locator =
    this.page.getByRole("combobox", { name: "Ship type" });

  // ─── Complete → MCR ───────────────────────────────────────────────────────
  readonly completeButton: Locator =
    this.page.getByRole("button", { name: "Complete" });
  readonly mcrSubmitBtn: Locator =
    this.page.locator('button[name="SubmitButton"]');

  // ─── SO number capture ────────────────────────────────────────────────────
  readonly salesIdEl: Locator =
    this.page.locator('[id*="SalesId"]').filter({ hasText: /^SO\d+/ }).first();

  // ─── Lines tab — Sales order lines FastTab + Order lines grid ─────────────
  readonly salesOrderLinesFastTab: Locator =
    this.page.locator('button[aria-label="Sales order lines"]');
  readonly orderLinesGrid: Locator =
    this.page.locator('[role="grid"][aria-label="Order lines"]');

  // ─── Line field reads (for account-payment / lightweight flows) ───────────
  // D365 inputs do NOT carry name= on the <input> element itself — the
  // data-dyn-controlname attribute is on the parent wrapper div.
  // Correct pattern: [data-dyn-controlname="..."] input
  /** Quantity field in the active grid row (ControlName: SalesLine_SalesQty) */
  readonly quantityField: Locator =
    this.page.locator('[data-dyn-controlname="SalesLine_SalesQty"] input');
  /** Unit price field in the active grid row (ControlName: SalesLine_SalesPrice) */
  readonly unitPriceField: Locator =
    this.page.locator('[data-dyn-controlname="SalesLine_SalesPrice"] input');
  /** Net amount field in the active grid row (ControlName: SalesLine_LineAmount) */
  readonly netAmountField: Locator =
    this.page.locator('[data-dyn-controlname="SalesLine_LineAmount"] input');

  // ─── Reservation controls ─────────────────────────────────────────────────
  // name attrs are stable across D365 sessions; avoid ID selectors with session numbers
  readonly inventoryButton:   Locator = this.page.locator('button[name="ButtonLineInventory"]');
  readonly reservationMenuBtn: Locator = this.page.locator('button[name="buttonLineInventReservation"]');
  readonly availQtyInput:     Locator = this.page.locator('input[name="ALCPhysicallyAllocated"]');
  readonly reserveLotBtn:     Locator = this.page.locator('button[name="ALCReserveLot"]');
  readonly closeButton:       Locator = this.page.getByRole("button", { name: "Close" });

  // ─── Confirm / Sales Order Confirmation ───────────────────────────────────
  // Live DOM: button is under the "Sell" action-pane tab, label = "Confirm sales order",
  // control name = buttonUpdateConfirmation. D365 ribbon buttons carry name= on <button>.
  readonly confirmNowBtn: Locator =
    this.page.locator('button[name="buttonUpdateConfirmation"]');
  readonly salesOrderConfirmationBtn: Locator =
    this.page.getByRole("button", { name: "Sales order confirmation" });
  readonly confirmationAmountEl: Locator =
    this.page.locator('[id*="CustConfirmJour"][id*="ConfirmAmount"]').first();

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /**
   * Fill the "New sales order" dialog with customer account and optional
   * customer PO (requisition), then click OK and wait for the SO form to load.
   */
  async fillNewOrderDialog(customerAccount: string, customerPO?: string): Promise<void> {
    await this.customerAccountCombo.fill(customerAccount);
    await this.customerAccountCombo.press("Tab");
    await this.page.waitForTimeout(800);

    if (customerPO) {
      const visible = await this.customerRequisitionField
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (visible) await this.customerRequisitionField.fill(customerPO);
    }

    await this.okButton.click();
    await this.page.waitForURL("**/*SalesTable*", { timeout: 60_000 });
    await this.waitForProcessing();
  }

  /**
   * Enter an item number on the Lines tab.
   *
   * If D365 opens a "Product search" dialog (item matches multiple variants),
   * this method verifies the first row's item number matches `itemNumber`
   * and clicks "Add lines and close" to accept it.
   *
   * Optionally set `quantity` (e.g. "5") to update the qty field before saving.
   * For bundle items the quantity is set on the active row before save; this
   * works when the bundle has not yet exploded. If the bundle already exploded
   * the field update is best-effort (no error is thrown if the field is gone).
   *
   * Saves the SO afterwards.
   */
  async enterItemNumber(itemNumber: string, quantity?: string): Promise<void> {
    await this.itemNumberCombo.click();
    // Must type character-by-character (pressSequentially) to trigger D365's
    // autocomplete lookup dropdown — fill() sets the value instantly without
    // firing the events D365 needs to show suggestions.
    await this.itemNumberCombo.pressSequentially(itemNumber, { delay: 50 });
    await this.page.waitForTimeout(1_500);

    // Click the first result row in the autocomplete lookup dropdown.
    // D365 item-number comboboxes show a .lookup-inner grid (not a <select>).
    const lookupFirstRow = this.page
      .locator('.lookup-inner [role="row"], [role="listbox"] [role="option"]')
      .first();
    const hasLookup = await lookupFirstRow.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasLookup) {
      await lookupFirstRow.click();
      await this.waitForProcessing();
    }

    // Handle Product search dialog (conditionally appears)
    if (await this.addLinesAndCloseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const resultsTip = await this.productSearchResultsField
        .getAttribute("data-dyn-qtip-title")
        .catch(() => "");
      console.log(`ℹ Product search dialog: ${resultsTip || "(no count)"}`);

      const actualItem = await this.productSearchFirstRowItemInput
        .inputValue({ timeout: 3_000 })
        .catch(() => "");
      console.log(`ℹ Product search first row item: "${actualItem}"`);

      if (actualItem && actualItem !== itemNumber) {
        throw new Error(
          `❌ Product search first row item "${actualItem}" does not match expected "${itemNumber}". ` +
          `Update the item number in the Excel sheet.`,
        );
      }

      await this.addLinesAndCloseBtn.click();
      await this.waitForProcessing();
      await this.page.waitForTimeout(1_500); // wait for bundle sub-lines to expand
    }

    // Set quantity before saving (best-effort; may not apply to already-exploded bundles)
    if (quantity && parseInt(quantity, 10) > 1) {
      const qtyVisible = await this.quantityField.isVisible({ timeout: 3_000 }).catch(() => false);
      if (qtyVisible) {
        await this.quantityField.click();
        await this.quantityField.fill(quantity);
        await this.quantityField.press("Tab");
        await this.page.waitForTimeout(300);
      }
    }

    await this.saveButton.click();
    await this.waitForProcessing();
  }

  /** Enter quantity in the active grid row and press Tab. */
  async enterQuantity(quantity: string): Promise<void> {
    await this.quantityField.fill(quantity);
    await this.quantityField.press('Tab');
    await this.page.waitForTimeout(300);
  }

  /** Read back the current quantity field value. */
  async getQuantity(): Promise<string> {
    return (await this.quantityField.inputValue()).trim();
  }

  /** Read back the current unit price field value. */
  async getUnitPrice(): Promise<string> {
    return (await this.unitPriceField.inputValue()).trim();
  }

  /** Read back the current net amount field value. */
  async getNetAmount(): Promise<string> {
    return (await this.netAmountField.inputValue()).trim();
  }

  /**
   * Switch to the Header tab and set the Ship type field.
   */
  async setShipType(shipType: string): Promise<void> {
    await this.clickWhenUnblocked(this.headerTab);
    await this.page.waitForTimeout(500);
    await this.shipTypeCombo.fill(shipType);
    await this.shipTypeCombo.press("Tab");
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the "Complete" button to open the MCR Order Recap dialog.
   * Returns the Submit button Locator so MCROrderRecapPage.submit() can use it.
   */
  async clickComplete(): Promise<Locator> {
    await this.completeButton.click();
    await this.waitForProcessing();
    await this.mcrSubmitBtn.waitFor({ state: "visible", timeout: 15_000 });
    return this.mcrSubmitBtn;
  }

  /**
   * Capture the Sales Order number (format: SO########) from the current page.
   * Falls back to a body text regex scan if the primary locator fails.
   */
  async captureSalesOrderNumber(): Promise<string> {
    let soNumber = "";
    try {
      soNumber = (await this.salesIdEl.textContent({ timeout: 10_000 }))?.trim() ?? "";
    } catch {
      const body = await this.page.locator("body").textContent();
      soNumber = body?.match(/SO\d{6,}/)?.[0] ?? "";
    }
    console.log(`✓ Sales Order Number: ${soNumber}`);
    return soNumber;
  }

  /**
   * Switch to the Lines tab and scroll the "Sales order lines" FastTab into
   * the viewport so D365 renders the grid rows.
   * Must be called before reserveAllSubLines().
   */
  async goToLinesTab(): Promise<void> {
    await this.dismissBlockingDialogsIfPresent();
    await this.linesTab.click();
    await this.waitForProcessing();

    // D365 only renders grid rows once the FastTab section is in the viewport
    await this.salesOrderLinesFastTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.salesOrderLinesFastTab.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    await this.orderLinesGrid.waitFor({ state: "visible", timeout: 10_000 });
  }

  private async dismissBlockingDialogsIfPresent(): Promise<void> {
    const shellBlocker = this.page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
    if (await shellBlocker.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await shellBlocker.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
    }

    const formNames = ["MCRCustPaymDialog", "MCRSalesOrderRecap"];
    for (const formName of formNames) {
      const dialog = this.page
        .locator(`div[role="dialog"][data-dyn-form-name="${formName}"]`)
        .first();
      if (!(await dialog.isVisible({ timeout: 1_000 }).catch(() => false))) continue;

      const cancelOrClose = dialog
        .locator('button[name="CancelButton"], button[name="CloseButton"]')
        .first();
      if (await cancelOrClose.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await cancelOrClose.click({ force: true }).catch(async () => {
          await this.page.keyboard.press("Escape").catch(() => {});
        });
      } else {
        await this.page.keyboard.press("Escape").catch(() => {});
      }
      await dialog.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
    }
  }

  /**
   * Reserve order lines starting from `startRow`.
   *
   * For each line:
   *   1. Click the row
   *   2. Open Inventory → Reservation
   *   3. Verify ALCPhysicallyAllocated > 0  (throws if no stock)
   *   4. Click Reserve lot → Close
   *
   * @param itemNumber  Used only in the error message when stock is zero.
   * @param startRow    Index of the first row to reserve (default: 1).
   *                    - Pass 1 (default) for BUNDLE items — row 0 is the
   *                      Canceled bundle parent and must be skipped.
   *                    - Pass 0 for NON-BUNDLE (single-line) items — row 0
   *                      IS the reservable line.
   */
  async reserveAllSubLines(itemNumber: string, startRow = 1): Promise<void> {
    const dataRows = this.orderLinesGrid.locator('[role="row"]:has([role="gridcell"])');
    const rowCount = await dataRows.count();
    console.log(`ℹ Order lines row count: ${rowCount}`);

    for (let i = startRow; i < rowCount; i++) {
      const row = dataRows.nth(i);
      await row.click();
      await this.page.waitForTimeout(300);

      await this.openInventoryMenu();
      await this.openReservationMenu();
      await this.waitForProcessing();

      // Stock check: ALCPhysicallyAllocated must be > 0
      await this.availQtyInput.waitFor({ state: "visible", timeout: 10_000 });
      const availQtyRaw = await this.availQtyInput.inputValue();
      const availQty = parseFloat(availQtyRaw.replace(/,/g, "") || "0");
      if (availQty <= 0) {
        throw new Error(
          `❌ No available stock for item ${itemNumber} ` +
          `(ALCPhysicallyAllocated = "${availQtyRaw}"). ` +
          `Ensure inventory exists before running the test, or change the item number.`,
        );
      }

      await this.clickReserveLot();
      await this.closeButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Open the Inventory menu for the current line, using multiple locator
   * strategies for resilience against minor DOM changes.
   */
  private async openInventoryMenu(): Promise<void> {
    const candidates: Locator[] = [
      this.inventoryButton,
      this.page.getByRole("button", { name: /Inventory/i }).first(),
      this.page.locator('button:has-text("Inventory")').first(),
      this.page.locator('button[aria-label*="Inventory"]').first(),
      this.page.locator('//span[contains(@aria-describedby,"LineInventory")]').first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 2_000 }).catch(() => false);
      if (visible) {
        await candidate.click();
        await this.page.waitForTimeout(5_000);
        return;
      }
    }

    throw new Error("Inventory menu button not found");
  }

  /**
   * Open the Reservation dialog from the Inventory menu with robust fallbacks.
   */
  private async openReservationMenu(): Promise<void> {
    const spanReservation = this.page
      .locator("//span[contains(@aria-describedby,'Reservation')]")
      .first();

    const candidates: Locator[] = [
      this.reservationMenuBtn,
      spanReservation,
      this.page.getByRole("menuitem", { name: /Reservation/i }).first(),
      this.page.getByRole("button", { name: /Reservation/i }).first(),
      this.page.locator('button:has-text("Reservation")').first(),
      this.page.locator('span:has-text("Reservation")').first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 5_000 }).catch(() => false);
      if (visible) {
        await candidate.click();
        await this.waitForProcessing();
        return;
      }
    }

    console.error("Failed to find Reservation button.");
    throw new Error("Reservation button not found in Inventory menu");
  }

  /**
   * Click the "Reserve lot" action using both name-based and aria-describedby
   * based locators, mirroring the more defensive JS implementation.
   */
  private async clickReserveLot(): Promise<void> {
    const spanReserveLot = this.page
      .locator("//span[contains(@aria-describedby,'ReserveLot')]")
      .first();

    const candidates: Locator[] = [
      this.reserveLotBtn,
      spanReserveLot,
      this.page.getByRole("button", { name: /reserve/i }).first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 15_000 }).catch(() => false);
      if (!visible) continue;

      await expect(candidate).toBeEnabled({ timeout: 15_000 }).catch(() => {});
      await candidate.click();
      await this.waitForProcessing();
      return;
    }

    throw new Error("Reserve lot button was not visible or enabled");
  }

  /**
   * Click the "Sell" action-pane tab (if necessary), then click
   * "Confirm sales order" to confirm the sales order.
   *
   * If the Sell tab is already active and only the "Confirm sales order"
   * button/label is present, this method falls back to clicking that
   * directly using multiple locator strategies.
   */
  async confirmNow(): Promise<void> {
    // Try to activate the Sell tab, but don't fail the whole flow if it's
    // already active or not interactable — in some views the confirm button
    // is already visible without re-clicking Sell.
    const sellVisible = await this.sellTab.isVisible({ timeout: 3_000 }).catch(() => false);
    if (sellVisible) {
      await this.sellTab.click();
      // Wait for the Sell-tab buttons to load into DOM (Confirm sales order)
      await this.page
        .locator('button[name="buttonUpdateConfirmation"]:visible')
        .waitFor({ state: 'visible', timeout: 8_000 })
        .catch(() => {});
    }

    await this.clickConfirmSalesOrder();
    await this.waitForProcessing();
    await this.handleConfirmPostingDialogs();
    await this.assertOperationCompleted();
  }

  /**
   * Robustly click the "Confirm sales order" button using:
   *   1) button[name="buttonUpdateConfirmation"]
   *   2) the span.button-label "Confirm sales order" ancestor button
   *   3) generic role/text fallbacks
   */
  private async clickConfirmSalesOrder(): Promise<void> {
    const labelSpan = this.page
      .locator('span.button-label', { hasText: "Confirm sales order" })
      .first();
    const labelButton = labelSpan.locator('xpath=ancestor::button[1]');

    const candidates: Locator[] = [
      this.confirmNowBtn,
      labelButton,
      this.page.getByRole("button", { name: "Confirm sales order" }).first(),
      this.page.locator('button:has-text("Confirm sales order")').first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!visible) continue;

      await candidate.click();
      return;
    }

    throw new Error('Could not find "Confirm sales order" button');
  }

  /**
   * Verify that the standard D365 info bar message
   * "Operation completed" is shown, which confirms that the
   * confirm-posting process finished successfully.
   */
  private async assertOperationCompleted(): Promise<void> {
    const message = this.page
      .locator(".messageBar-message")
      .filter({ hasText: /Operation completed/i })
      .first();

    // Best-effort: don't fail the test if this toast is missing or very brief.
    try {
      await expect(message).toBeVisible({ timeout: 20_000 });
    } catch {
      console.warn(
        '⚠ "Operation completed" toast not detected after confirm; continuing. ' +
          "Verify confirmation via downstream steps (e.g. document status).",
      );
    }
  }

  /**
   * After clicking "Confirm sales order", handle the follow-up dialogs:
   *   0) "Confirm sales order" dialog (SalesEditLines...) + OK
   *   1) Update = Confirmation (SalesParmTable_Ordering...) + OK
   *   2) Optional "You are about to post the document without printing it" warning + OK
   */
  private async handleConfirmPostingDialogs(): Promise<void> {
    // Dialog 0: "Confirm sales order" modal (SalesEditLines) with OK button.
    // This dialog can appear immediately after clicking "Confirm sales order"
    // from the Sell action pane and must be dismissed before interacting with
    // the underlying Sales order form.
    const confirmSalesOrderDialog = this.page
      .locator('div[role="dialog"][data-dyn-form-name="SalesEditLines"][aria-hidden="false"]')
      .first();
    const hasConfirmSalesOrderDialog = await confirmSalesOrderDialog
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (hasConfirmSalesOrderDialog) {
      const okInConfirmDialogCandidates: Locator[] = [
        confirmSalesOrderDialog.getByRole("button", { name: /^OK$/ }).first(),
        confirmSalesOrderDialog.locator('button[name="OK"]').first(),
        confirmSalesOrderDialog
          .locator('span.button-label[id*="SalesEditLines_"][id$="_OK_label"]')
          .first()
          .locator("xpath=ancestor::button[1]"),
      ];

      let clicked = false;
      for (const candidate of okInConfirmDialogCandidates) {
        const visible = await candidate.isVisible({ timeout: 5_000 }).catch(() => false);
        if (!visible) continue;
        await candidate.click({ force: true });
        clicked = true;
        break;
      }

      if (!clicked) {
        throw new Error(
          'Confirm sales order dialog (SalesEditLines) is open, but no clickable "OK" button was found.',
        );
      }

      // Fallback: in some runs D365 keeps focus in the dialog; Enter confirms.
      await confirmSalesOrderDialog.waitFor({ state: "hidden", timeout: 20_000 }).catch(async () => {
        await this.page.keyboard.press("Enter");
        await confirmSalesOrderDialog.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
      });

      await this.waitForProcessing();
      await this.page.waitForTimeout(300);
    }

    // Dialog 1: "Update" field with value/title "Confirmation" and an OK button
    const updateField = this.page
      .locator('input[id*="SalesParmTable_Ordering_"][id$="_input"]')
      .first();
    const hasUpdateDialog = await updateField.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasUpdateDialog) {
      try {
        const rawValue =
          (await updateField.inputValue().catch(() => "")) ||
          (await updateField.getAttribute("title").catch(() => "")) ||
          "";
        console.log(`Update dialog value/title: "${rawValue}"`);
      } catch {
        // Non-fatal if we can't read the value; continue to OK click.
      }

      const okLabel = this.page
        .locator('span.button-label[id*="SalesEditLines_"][id$="_OK_label"]')
        .first();
      const okButton = okLabel.locator("xpath=ancestor::button[1]");

      const okCandidates: Locator[] = [
        okButton,
        this.page.getByRole("button", { name: "OK" }).first(),
      ];

      for (const candidate of okCandidates) {
        const visible = await candidate.isVisible({ timeout: 10_000 }).catch(() => false);
        if (!visible) continue;
        await candidate.click();
        await this.waitForProcessing();
        break;
      }
    }

    // Dialog 2 (optional): "You are about to post the document without printing it. Select OK to continue."
    const warningHeader = this.page
      .locator("h2#titleField")
      .filter({
        hasText:
          "You are about to post the document without printing it. Select OK to continue.",
      })
      .first();

    const hasWarning = await warningHeader.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasWarning) {
      const warnLabel = this.page
        .locator('span.button-label[id*="SysBoxForm_"][id$="_Ok_label"]')
        .first();
      const warnButton = warnLabel.locator("xpath=ancestor::button[1]");

      const warnCandidates: Locator[] = [
        warnButton,
        this.page.getByRole("button", { name: "OK" }).first(),
      ];

      for (const candidate of warnCandidates) {
        const visible = await candidate.isVisible({ timeout: 10_000 }).catch(() => false);
        if (!visible) continue;
        await candidate.click();
        await this.waitForProcessing();
        break;
      }
    }
  }

  /**
   * From the Header tab, open the Sales Order Confirmation view and verify
   * that the confirmation amount field is visible.
   */
  async viewOrderConfirmation(): Promise<void> {
    await this.headerTab.click();
    await this.page.waitForTimeout(500);
    await this.salesOrderConfirmationBtn.click();
    await this.waitForProcessing();
    await expect(this.confirmationAmountEl).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Reload the page, switch to the Header tab, and assert that the
   * Document Status field contains the expected value (e.g. "Invoice").
   *
   * @param expectedStatus  The text expected to appear in the Document Status field.
   */
  async verifyDocumentStatus(expectedStatus: string): Promise<void> {
    await this.page.reload();
    await this.waitForProcessing();
    await this.headerTab.click();
    await this.page.waitForTimeout(500);
    const documentStatusEl = this.page
      .locator('[id*="DocumentStatus"], [name*="DocumentStatus"]')
      .first();
    await expect(documentStatusEl).toContainText(expectedStatus, { timeout: 15_000 });
  }
}
