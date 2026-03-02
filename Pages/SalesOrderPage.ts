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
  // These target the active row in the grid via the stable D365 name= attributes.
  /** Quantity field in the active grid row (ControlName: SalesLine_SalesQty) */
  readonly quantityField: Locator =
    this.page.locator('[name="SalesLine_SalesQty"], input[aria-label="Quantity"]').first();
  /** Unit price field in the active grid row (ControlName: SalesLine_SalesPrice) */
  readonly unitPriceField: Locator =
    this.page.locator('[name="SalesLine_SalesPrice"], input[aria-label="Unit price"]').first();
  /** Net amount field in the active grid row (ControlName: SalesLine_LineAmount) */
  readonly netAmountField: Locator =
    this.page.locator('[name="SalesLine_LineAmount"], input[aria-label="Net amount"]').first();

  // ─── Reservation controls ─────────────────────────────────────────────────
  // name attrs are stable across D365 sessions; avoid ID selectors with session numbers
  readonly inventoryButton:   Locator = this.page.locator('button[name="ButtonLineInventory"]');
  readonly reservationMenuBtn: Locator = this.page.locator('button[name="buttonLineInventReservation"]');
  readonly availQtyInput:     Locator = this.page.locator('input[name="ALCPhysicallyAllocated"]');
  readonly reserveLotBtn:     Locator = this.page.locator('button[name="ALCReserveLot"]');
  readonly closeButton:       Locator = this.page.getByRole("button", { name: "Close" });

  // ─── Confirm / Sales Order Confirmation ───────────────────────────────────
  readonly confirmNowBtn: Locator =
    this.page.getByRole("button", { name: "Confirm now" });
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
   * Saves the SO afterwards.
   */
  async enterItemNumber(itemNumber: string): Promise<void> {
    await this.itemNumberCombo.click();
    await this.itemNumberCombo.fill(itemNumber);
    await this.itemNumberCombo.press("Tab");
    await this.page.waitForTimeout(1_500);

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
    await this.headerTab.click();
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
    await this.linesTab.click();
    await this.waitForProcessing();

    // D365 only renders grid rows once the FastTab section is in the viewport
    await this.salesOrderLinesFastTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.salesOrderLinesFastTab.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    await this.orderLinesGrid.waitFor({ state: "visible", timeout: 10_000 });
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

      await this.inventoryButton.click();
      await this.reservationMenuBtn.click();
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

      await this.reserveLotBtn.click();
      await this.waitForProcessing();
      await this.closeButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /** Click "Confirm now" to confirm the sales order. */
  async confirmNow(): Promise<void> {
    await this.confirmNowBtn.click();
    await this.waitForProcessing();
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
