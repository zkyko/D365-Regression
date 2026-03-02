import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ReturnOrderPage — Returns & Credits module in D365.
 *
 * Covers: RMA creation, credit memos, replacements, inspection notes,
 * on-account credits, and printing the RMA document.
 *
 * Used by: tests/returns-credits.spec.ts
 * Scenarios: 76–88, 97
 *
 * ─── HOW TO FIND LOCATORS ────────────────────────────────────────────────────
 * D365 Return Orders are typically under:
 *   Sales and marketing > Returns > Return orders
 *   OR: Retail and Commerce > Customers > Return orders
 *
 * 1. Navigate there and click "New" to create a return order.
 * 2. The New dialog will ask for:
 *    - Customer account
 *    - Original SO reference (optional — some scenarios have no original SO)
 * 3. On the return order form, look for:
 *    - "Return reason" or "Return code" combobox
 *    - "Item number" field on the return lines
 *    - "Credit only" vs "Replace" vs "Credit with inventory" type selector
 *    - "Inspection notes" field (may be in a FastTab or a Notes field)
 *    - "Print RMA" button on the Action Pane
 * 4. For "on account" credits: check if there's an "On account" payment method
 *    or a separate "Credit on account" button on the customer/order.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class ReturnOrderPage extends BasePage {

  // ─── TODO: Locators — all need confirming against live D365 ───────────────

  // ─── New return order dialog ──────────────────────────────────────────────
  // TODO: Inspect the New Return Order dialog fields
  // readonly customerAccountCombo: Locator = this.page.getByRole('combobox', { name: 'Customer account' });
  // readonly originalSOInput: Locator = this.page.getByRole('textbox', { name: 'Sales order' }); // optional
  // readonly newDialogOKBtn: Locator = this.page.getByRole('button', { name: 'OK' });

  // ─── Return type / disposition ────────────────────────────────────────────
  // TODO: Find the return type selector (credit only, replace, credit+inventory)
  // May be a "Disposition code" or "Return action" field on the return line
  // readonly dispositionCodeCombo: Locator = this.page.getByRole('combobox', { name: 'Disposition code' });
  // OR: readonly returnActionCombo: Locator = this.page.getByRole('combobox', { name: 'Return action' });

  // ─── Return reason ────────────────────────────────────────────────────────
  // TODO: Find return reason field on the return order form
  // readonly returnReasonCombo: Locator = this.page.getByRole('combobox', { name: 'Return reason code' });

  // ─── Item line fields ─────────────────────────────────────────────────────
  // TODO: Inspect return order lines grid
  // readonly returnLineItemCombo: Locator = this.page.getByRole('combobox', { name: 'Item number' });
  // readonly returnLineQtyInput: Locator = this.page.locator('input[name="TODO_ReturnQty"]');

  // ─── Inspection notes ─────────────────────────────────────────────────────
  // TODO: Find inspection notes field — likely in a "Notes" FastTab or a dedicated field
  // Scenarios 78/79: "Leave inspection notes on the replacement"
  // readonly inspectionNotesInput: Locator = this.page.locator('textarea[name="TODO_InspectionNotes"]');
  // OR: this.page.getByRole('textbox', { name: 'Inspection notes' })

  // ─── Print RMA ────────────────────────────────────────────────────────────
  // TODO: Find "Print RMA" or "Return merchandise authorization" button
  // Likely on the Action Pane under a "Print" or "Documents" tab/section
  // readonly printRMABtn: Locator = this.page.locator('button[name="TODO_PrintRMA"]');

  // ─── On-account credit ────────────────────────────────────────────────────
  // TODO: Find "on account" credit feature — Scenario 80
  // May be a payment method or a special credit button
  // readonly onAccountCreditBtn: Locator = this.page.locator('button[name="TODO_OnAccountCredit"]');
  // readonly creditAmountInput: Locator = this.page.locator('input[name="TODO_CreditAmount"]');

  // ─── Credit balance field (for verification) ──────────────────────────────
  // TODO: On the customer account or order form, find where available credit shows
  // readonly availableCreditField: Locator = this.page.locator('input[name="TODO_AvailableCredit"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the Return Orders list page.
   *
   * TODO: Confirm the exact navigation path and option text.
   * Likely: "Return orders" → "Return orders Sales and marketing"
   */
  async navigate(): Promise<void> {
    // TODO: confirm search term and option text
    // await this.navigateTo('Return orders', 'Return orders Sales and marketing');
    console.warn('⚠ ReturnOrderPage.navigate() — TODO: confirm navigation path');
    throw new Error('ReturnOrderPage.navigate() not yet implemented');
  }

  /**
   * Create a new return order referencing an existing Sales Order.
   *
   * Scenarios 76–79: Return against an SO that exists in D365.
   *
   * TODO: Steps to implement:
   *   1. Click New on the Return Orders list page
   *   2. In the dialog, fill in customer account
   *   3. If originalSONumber is provided, fill it in (links return to original SO)
   *   4. Click OK and wait for the return order form to load
   *
   * @param customerAccount   Customer account number
   * @param originalSONumber  The original SO number to reference (e.g. "SO000012345")
   */
  async createReturnWithOriginalSO(customerAccount: string, originalSONumber: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.page.getByRole('button', { name: 'New' }).click();
    // await this.customerAccountCombo.fill(customerAccount);
    // await this.customerAccountCombo.press('Tab');
    // await this.originalSOInput.fill(originalSONumber);
    // await this.originalSOInput.press('Tab');
    // await this.newDialogOKBtn.click();
    // await this.waitForProcessing();
    console.warn('⚠ ReturnOrderPage.createReturnWithOriginalSO() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.createReturnWithOriginalSO() not yet implemented');
  }

  /**
   * Create a return order WITHOUT referencing an original SO.
   *
   * Scenarios 83–86: "The original sales order does not exist in D365."
   *
   * @param customerAccount  Customer account number
   * @param itemNumber       Item being returned
   * @param quantity         Return quantity string
   */
  async createReturnNoOriginalSO(customerAccount: string, itemNumber: string, quantity: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // Similar to createReturnWithOriginalSO() but without originalSONumber
    // Then manually add the item line
    console.warn('⚠ ReturnOrderPage.createReturnNoOriginalSO() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.createReturnNoOriginalSO() not yet implemented');
  }

  /**
   * Set the return type / disposition code on the return order.
   *
   * Controls whether this becomes a credit memo, replacement, or credit + inventory.
   *
   * @param returnType  e.g. "CreditOnly", "Replace", "CreditWithInventory"
   *                    (use the actual D365 disposition code values)
   */
  async setReturnType(returnType: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.dispositionCodeCombo.fill(returnType);
    // await this.dispositionCodeCombo.press('Tab');
    // await this.page.waitForTimeout(300);
    console.warn('⚠ ReturnOrderPage.setReturnType() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.setReturnType() not yet implemented');
  }

  /**
   * Set the return reason code.
   *
   * @param reason  e.g. "Defective", "Wrong item", "Customer changed mind"
   */
  async setReturnReason(reason: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.returnReasonCombo.fill(reason);
    // await this.returnReasonCombo.press('Tab');
    console.warn('⚠ ReturnOrderPage.setReturnReason() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.setReturnReason() not yet implemented');
  }

  /**
   * Enter inspection notes on the return/replacement order.
   *
   * Scenarios 78/79: "Leave inspection notes on the replacement.
   *  Make sure the inspection notes carry through to Korber."
   *
   * TODO: Find the inspection notes field. It may be:
   *   - A "Notes" FastTab text area
   *   - A dedicated "Inspection notes" field on the return line
   *   - An "Attachment" or "Document notes" feature
   *
   * @param notes  The inspection note text to enter
   */
  async enterInspectionNotes(notes: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.inspectionNotesInput.fill(notes);
    // await this.inspectionNotesInput.press('Tab');
    console.warn('⚠ ReturnOrderPage.enterInspectionNotes() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.enterInspectionNotes() not yet implemented');
  }

  /**
   * Verify inspection notes appear in Korber (WMS).
   *
   * ⚠️ EXTERNAL SYSTEM — Korber is a separate WMS. This method cannot be
   * fully automated from D365 UI. At best, verify that D365 sent the notes
   * (check the shipment/picking list in D365 for the notes field).
   *
   * Scenarios 78/79: "Make sure the inspection notes carry through to Korber."
   */
  async verifyInspectionNotesInKorber(): Promise<void> {
    // ⚠️ EXTERNAL SYSTEM — Cannot verify Korber directly from D365 UI
    // TODO (partial): At minimum, verify notes appear on the D365 shipment/picking document
    // before it's sent to Korber
    console.warn('⚠ ReturnOrderPage.verifyInspectionNotesInKorber() — EXTERNAL SYSTEM (Korber). Cannot automate fully.');
  }

  /**
   * Print / generate the RMA document.
   *
   * All return scenarios: "Print the RMA document."
   *
   * TODO: Find the Print RMA button. Likely:
   *   - Action Pane → "Print" tab or section → "Return merchandise authorization"
   *   - Or a "Documents" button
   * Note: D365 printing may open a dialog with print options (printer, PDF, etc.)
   * For automation, select "PDF" or "Screen" to verify it generates without sending to printer.
   */
  async printRMADocument(): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.printRMABtn.click();
    // Handle print dialog — select PDF/Screen option
    // await this.page.getByRole('button', { name: 'OK' }).click();
    // await this.waitForProcessing();
    console.warn('⚠ ReturnOrderPage.printRMADocument() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.printRMADocument() not yet implemented');
  }

  /**
   * Verify that the RMA document was generated successfully.
   *
   * After printRMADocument(), check that D365 shows a success indicator
   * or that the document is listed in print history.
   */
  async verifyRMADocumentGenerated(): Promise<void> {
    // TODO: implement — may just check for absence of error message
    // or check Document handling / print archive for the RMA
    console.warn('⚠ ReturnOrderPage.verifyRMADocumentGenerated() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.verifyRMADocumentGenerated() not yet implemented');
  }

  /**
   * Apply a credit to the customer using the "on account" feature.
   *
   * Scenario 80: "Apply a credit for customer using the 'on account' feature."
   *
   * TODO: Find the on-account credit flow:
   *   - May be on the MCR Order Recap dialog as a payment method
   *   - Or a dedicated "On account" button on the customer account page
   *   - Or on the return order form → Apply credit
   *
   * @param amount  Amount to apply as on-account credit
   */
  async applyOnAccountCredit(amount: string): Promise<void> {
    // TODO: implement after locators are confirmed
    console.warn('⚠ ReturnOrderPage.applyOnAccountCredit() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.applyOnAccountCredit() not yet implemented');
  }

  /**
   * Verify the available on-account credit balance for a customer.
   *
   * Scenarios 81/82: SO total vs available credit.
   *
   * @param expectedAmount  Expected credit balance string (e.g. "299.99")
   */
  async verifyAvailableCredit(expectedAmount: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await expect(this.availableCreditField).toHaveValue(expectedAmount, { timeout: 5_000 });
    console.warn('⚠ ReturnOrderPage.verifyAvailableCredit() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.verifyAvailableCredit() not yet implemented');
  }

  /**
   * Apply the on-account credit to cover a sales order balance.
   *
   * Scenario 81: Credit covers full SO balance.
   * Scenario 82: Credit partially covers SO — second payment method needed.
   *
   * @param soNumber       The sales order to apply credit against
   * @param applyAmount    Amount to apply from credit
   */
  async applyCreditToSalesOrder(soNumber: string, applyAmount: string): Promise<void> {
    // TODO: implement — likely inside MCR Order Recap dialog
    // Find the "On account" payment method and enter the credit amount
    console.warn('⚠ ReturnOrderPage.applyCreditToSalesOrder() — TODO: not yet implemented');
    throw new Error('ReturnOrderPage.applyCreditToSalesOrder() not yet implemented');
  }

  /**
   * Capture the Return Order number from the current page.
   *
   * @returns The return order number string (e.g. "RMA000012345")
   */
  async captureReturnOrderNumber(): Promise<string> {
    // TODO: implement — similar to SalesOrderPage.captureSalesOrderNumber()
    // Look for a field with RMA number format
    // const body = await this.page.locator('body').textContent();
    // return body?.match(/RMA\d{6,}/)?.[0] ?? '';
    console.warn('⚠ ReturnOrderPage.captureReturnOrderNumber() — TODO: not yet implemented');
    return 'TODO_RMA_NUMBER';
  }
}
