import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DChannelOrderPage — Direct Channel (D Channel / Drop Ship) order management.
 *
 * D Channel orders are Sales Orders with Sales origin = "D" (D-channel).
 * A vendor ships directly to the customer via a linked Purchase Order.
 *
 * Used by: tests/d-channel.spec.ts
 * Scenarios: 58–75, 120–123
 *
 * Locators verified against live D365 (fourhands-test sandbox) on 2026-03-12.
 */
export class DChannelOrderPage extends BasePage {

  // ─── New SO dialog ────────────────────────────────────────────────────────
  readonly custAccountInput: Locator = this.page.locator(`[data-dyn-controlname="SalesTable_CustAccount"] input`);
  readonly salesOriginInput: Locator = this.page.locator(`[data-dyn-controlname="Administration_SalesOriginId"] input`);
  readonly rsmDelayPaymentBtn: Locator = this.page.locator(`[data-dyn-controlname="SalesTable_rsmDelayPayment"]`);
  readonly custPOInput: Locator = this.page.locator(`input[name="References_PurchOrderFormNum"]`);
  readonly shippingDateInput: Locator = this.page.locator(`[data-dyn-controlname="SalesTable_ShippingDateRequested"] input`);
  readonly dialogOKBtn: Locator = this.page.locator(`[data-dyn-controlname="OK"][name="OK"]`);

  // ─── SO form — Lines tab ──────────────────────────────────────────────────
  readonly itemIdInput: Locator = this.page.locator(`input[aria-label="Item number"]`);
  readonly salesQtyInput: Locator = this.page.locator(`input[aria-label="Quantity"]`);
  readonly salesPriceInput: Locator = this.page.locator(`input[aria-label="Unit price"]`);
  readonly addLineBtn: Locator = this.page.locator(`[data-dyn-controlname="LineStripNew"]`);
  readonly cancelLinesBtn: Locator = this.page.locator(`[data-dyn-controlname="rsmCancelSOLines"]`);

  // ─── SO form — Header tab ─────────────────────────────────────────────────
  readonly headerTab: Locator = this.page.locator(`[data-dyn-controlname="HeaderView_header"]`);
  readonly shipWindowStart: Locator = this.page.locator(`[data-dyn-controlname="rsmHeaderShipmentWindow_rsmShippingStartDate"] input`);
  readonly shipWindowEnd: Locator = this.page.locator(`[data-dyn-controlname="rsmHeaderShipmentWindow_rsmShippingEndDate"] input`);
  readonly freightTermsInput: Locator = this.page.locator(`[data-dyn-controlname="Delivery_DlvTerm"] input`);

  // ─── SO Action Pane ───────────────────────────────────────────────────────
  readonly completeBtn: Locator = this.page.locator(`[data-dyn-controlname="Complete"][name="Complete"]`);
  readonly directDeliveryBtn: Locator = this.page.locator(`[data-dyn-controlname="buttonCreateDropShipment"][name="buttonCreateDropShipment"]`);
  readonly chargesBtn: Locator = this.page.locator(`[data-dyn-controlname="ButtonMarkupTransHeading"][name="ButtonMarkupTransHeading"]`);
  readonly cancelOrderBtn: Locator = this.page.locator(`[data-dyn-controlname="rsmSalesCancelOrderWithReasonController"]`);
  readonly salesOrderActionTab: Locator = this.page.locator(`[data-dyn-form-name="SalesTable"] [data-dyn-controlname="SalesOrder"]`);
  readonly generalTab: Locator = this.page.locator(`[data-dyn-form-name="SalesTable"] [data-dyn-controlname="General"]`);

  // ─── Linked PO (via General → References) ────────────────────────────────
  readonly referencesBtn: Locator = this.page.locator(`[data-dyn-controlname="buttonReferences"][name="buttonReferences"]`);
  readonly purchTableBtn: Locator = this.page.locator(`[data-dyn-controlname="buttonPurchTable"][name="buttonPurchTable"]`);
  readonly referencesOKBtn: Locator = this.page.locator(`[data-dyn-controlname="OkButton"][name="OkButton"]`);
  readonly purchIdField: Locator = this.page.locator(`input[aria-label="Purchase order"]`);
  readonly poStatusField: Locator = this.page.locator(`input[name="PurchStatus"]`);

  // ─── MCR Complete / deposit flow ─────────────────────────────────────────
  readonly addDepositBtn: Locator = this.page.locator(`[data-dyn-controlname="AddBtn"][name="AddBtn"]`);
  readonly tenderTypeInput: Locator = this.page.locator(`[data-dyn-controlname="Identification_TenderTypeId"] input`);
  readonly mcrOKBtn: Locator = this.page.locator(`[data-dyn-controlname="OKButton"][name="OKButton"]`);
  readonly submitBtn: Locator = this.page.locator(`[data-dyn-controlname="SubmitButton"][name="SubmitButton"]`);
  readonly confirmYesBtn: Locator = this.page.locator(`[data-dyn-controlname="Yes"][name="Yes"]`);
  readonly commandButtonOK: Locator = this.page.locator(`[data-dyn-controlname="CommandButtonOK"][name="CommandButtonOK"]`);

  // ─── Toggle / popup locators (more precise — ported from PODchannelPage) ──
  // XPath targets the actual toggle-box span; aria-checked tells us current state.
  readonly rsmDelayPaymentToggle: Locator = this.page.locator(`//span[contains(@aria-describedby,"DelayPayment")][@class="toggle-box"]`);
  // Credit-limit exceeded confirmation popup
  readonly creditLimitYes: Locator = this.page.locator(`[data-dyn-form-name="SysBoxForm"] button:has-text("Yes")`);

  // ─── Ship-date warning popup ──────────────────────────────────────────────
  // Targets the button-label <span> whose id contains "SysBoxForm" and exact text "Yes"/"No".
  // The span id pattern is SysBoxForm_N_Yes_label / SysBoxForm_N_No_label (N = dynamic session).
  // Clicking the span activates the button via event bubbling.
  readonly shipDateWarningYes: Locator = this.page.locator(`//span[@class="button-label"][contains(@id,"SysBoxForm")][normalize-space(text())="Yes"]`);
  readonly shipDateWarningNo: Locator  = this.page.locator(`//span[@class="button-label"][contains(@id,"SysBoxForm")][normalize-space(text())="No"]`);

  // ─── MCR payment fallback locators ───────────────────────────────────────
  // Used when the initial tender type is rejected and we need to retry with type "2"
  readonly paymGridTenderTypeId: Locator = this.page.locator(`//input[contains(@id,"PaymGrid_TenderTypeId")]`);
  readonly removePaymBtn: Locator = this.page.locator(`//span[contains(@id,"RemovePaymBtn")][@class="button-label"]`);
  readonly removeConfirmYes: Locator = this.page.locator(`//span[contains(@id,"SysBoxForm")][contains(text(),"Yes")]`);
  readonly salesTotal: Locator = this.page.locator(`//input[contains(@id,"SalesTotal")]`);

  // ─── Charges form ─────────────────────────────────────────────────────────
  readonly chargesCodeInput: Locator = this.page.locator(`[data-dyn-controlname="MarkupTrans_MarkupCode"] input`);
  readonly chargesValueInput: Locator = this.page.locator(`[data-dyn-controlname="MarkupTrans_MarkupValue"] input`);

  // ─── Assertions ──────────────────────────────────────────────────────────
  readonly headerTitle: Locator = this.page.locator(`[data-dyn-controlname="HeaderTitle"]`);

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /** Navigate to the All Sales Orders list page. */
  async navigate(): Promise<void> {
    await this.navigateTo('All sales orders', 'All sales orders Accounts receivable');
  }

  /**
   * Create a new D Channel SO from the All Sales Orders list.
   * Sets Sales origin = "D" (D-channel) in the New SO dialog.
   *
   * Scenarios 58–65, 122–123.
   *
   * @param customerAccount  D365 customer account number
   * @param customerPO       Optional customer PO reference
   * @param shipDate         Optional requested ship date (MM/DD/YYYY)
   */
  async createNewOrder(customerAccount: string, customerPO?: string, shipDate?: string): Promise<void> {
    await this.safeClick(this.page.locator(`[data-dyn-controlname="SystemDefinedNewButton"][name="SystemDefinedNewButton"]`));
    await this.waitForProcessing();

    await this.safeFill(this.custAccountInput, customerAccount);
    await this.waitForProcessing();

    // Enable delay-payment if not already on (required for D-channel deposit flow).
    // Use the toggle-box span so we can read aria-checked before deciding to click.
    await this.rsmDelayPaymentToggle.waitFor({ state: 'visible', timeout: 30_000 });
    const ariaChecked = await this.rsmDelayPaymentToggle.getAttribute('aria-checked');
    if (ariaChecked !== 'true') {
      await this.safeClick(this.rsmDelayPaymentToggle);
      await this.waitForProcessing();
    }

    // Set Sales origin to "D" (D-channel) — field is in the Administration section
    await this.safeFill(this.salesOriginInput, 'D');
    await this.salesOriginInput.press('Tab');
    await this.waitForProcessing();

    if (customerPO) {
      await this.safeFill(this.custPOInput, customerPO);
    }

    if (shipDate) {
      await this.safeFill(this.shippingDateInput, shipDate);
      await this.shippingDateInput.press('Tab');
    }

    await this.safeClick(this.dialogOKBtn);
    await this.waitForProcessing();
  }

  /**
   * Set the ship window (from/to dates) on the order Header tab.
   * Fields: rsmHeaderShipmentWindow_rsmShippingStartDate / rsmShippingEndDate
   *
   * Two popups can appear:
   *   1. "One or both shipping dates are earlier than today..." — answer controlled by datePrompt.
   *   2. "This will update the shipment window values on all sales order lines..." — always Yes.
   * Both use the same SysBoxForm_N_Yes/No pattern; we drain all pending popups after each field.
   *
   * @param fromDate    Start date (MM/DD/YYYY)
   * @param toDate      End date   (MM/DD/YYYY)
   * @param datePrompt  'Yes' | 'No' — answer to the ship-date warning popup (default: 'Yes')
   */
  async setShipWindow(fromDate: string, toDate: string, datePrompt: 'Yes' | 'No' = 'Yes'): Promise<void> {
    await this.safeClick(this.headerTab);
    await this.waitForProcessing();

    await this.safeFill(this.shipWindowStart, fromDate);
    await this.shipWindowStart.press('Tab');
    await this.waitForProcessing();
    // SysBoxForm popups ("dates earlier than today", "update all order lines")
    // are now handled globally by installPopupHandlers() → addLocatorHandler.
    // No manual dismiss needed here.

    await this.safeFill(this.shipWindowEnd, toDate);
    await this.shipWindowEnd.press('Tab');
    await this.waitForProcessing();
  }

  /**
   * Drain any SysBoxForm popups that appear after setting ship window dates.
   * Handles two distinct dialogs:
   *   - "dates earlier than today" → answered by datePrompt
   *   - "update all order lines"   → always Yes
   * Loops until no more popups are visible (D365 can chain them).
   *
   * IMPORTANT: D365 fires these popups via client-side JS, which can happen
   * AFTER networkidle. We add a short fixed wait before the first check so the
   * popup has time to render before we test for visibility.
   */
  private async dismissShipWindowPopups(datePrompt: 'Yes' | 'No'): Promise<void> {
    // Give D365 client-side JS time to render the popup (fired after networkidle)
    await this.page.waitForTimeout(1_500);

    for (let i = 0; i < 3; i++) {
      const yesVisible = await this.shipDateWarningYes.isVisible({ timeout: 4_000 }).catch(() => false);
      if (!yesVisible) break;

      // Read the dialog message to distinguish which popup this is
      const msgText = await this.page
        .locator(`[data-dyn-controlname="FormStaticTextControl1"]:visible`)
        .first()
        .textContent({ timeout: 2_000 })
        .catch(() => '');

      const isDateWarning  = msgText?.includes('earlier than today');
      const isLinesWarning = msgText?.includes('update the shipment window');

      if (isDateWarning) {
        await this.safeClick(datePrompt === 'Yes' ? this.shipDateWarningYes : this.shipDateWarningNo);
      } else {
        // Covers isLinesWarning and any unknown SysBoxForm popup — always Yes
        await this.safeClick(this.shipDateWarningYes);
      }
      await this.waitForProcessing();
      // Short pause before looping in case a second popup is chained
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Set the delivery/freight terms on the order.
   *
   * @param terms  Delivery terms code (e.g. "PREPAID", "COLLECT")
   */
  async setFreightTerms(terms: string): Promise<void> {
    // Map logical scenario labels to actual D365 delivery terms codes
    const codeMap: Record<string, string> = {
      'CustomerCarries': 'FOB',
      'FHCarries': 'PREPAID',
    };
    const code = codeMap[terms] ?? terms;

    // Delivery_DlvTerm is on the Header tab → Misc. delivery info group
    await this.safeClick(this.headerTab);
    await this.waitForProcessing();
    await this.safeFill(this.freightTermsInput, code);
    await this.freightTermsInput.press('Tab');
    await this.waitForProcessing();
  }

  /**
   * Add a charge (LCL fee, freight, transportation) to the SO.
   * Opens Sell → Maintain charges, adds a new row with code and amount.
   *
   * Scenarios 58 (LCL), 59 (freight), 60 (transportation), 61 (freight).
   *
   * @param chargesCode  Charge type code (e.g. "LCL", "FREIGHT")
   * @param amount       Charge amount (e.g. "150.00")
   */
  async addCharge(chargesCode: string, amount: string): Promise<void> {
    await this.safeClick(this.chargesBtn);
    await this.waitForProcessing();
    await this.safeClick(this.page.locator(`[data-dyn-controlname="SystemDefinedNewButton"]`).last());
    await this.waitForProcessing();
    await this.safeFill(this.chargesCodeInput, chargesCode);
    await this.chargesCodeInput.press('Tab');
    await this.safeFill(this.chargesValueInput, amount);
    await this.chargesValueInput.press('Tab');
    await this.waitForProcessing();
    await this.safeClick(this.page.locator(`[data-dyn-controlname="SystemDefinedSaveButton"]`));
    await this.waitForProcessing();
  }

  /**
   * Verify the vendor account on a specific SO line.
   * Scenario 65: D channel order with 2 vendors.
   *
   * @param lineIndex       0-based row index
   * @param expectedVendor  Expected vendor account number
   */
  async verifyLineVendorAccount(lineIndex: number, expectedVendor: string): Promise<void> {
    const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    const row = dataRows.nth(lineIndex);
    const vendorCell = row.locator('input[name="PurchLine_VendAccount"], input[aria-label="Vendor account"]');
    await expect(vendorCell).toHaveValue(expectedVendor, { timeout: 10_000 });
  }

  /**
   * Navigate from the current SO to the linked Purchase Order.
   * Path: Sales order tab → General → References → buttonPurchTable.
   *
   * @returns The PO number (e.g. "PO317685")
   */
  async navigateToLinkedPO(): Promise<string> {
    await this.safeClick(this.generalTab);
    await this.waitForProcessing();
    await this.safeClick(this.referencesBtn);
    await this.waitForProcessing();

    // Capture PO number before navigating
    const poNumber = await this.purchIdField.inputValue();

    // Dismiss the References dialog before opening the PO
    await this.safeClick(this.referencesOKBtn);
    await this.waitForProcessing();
    await this.safeClick(this.purchTableBtn);
    await this.waitForProcessing();

    return poNumber.trim();
  }

  /**
   * Trigger Direct Delivery from the SO to create the linked Purchase Order.
   * Must be called after MCR Complete + Submit, while still on the SO form.
   *
   * Flow (from recorded podchannel session):
   *   Sales order tab → Direct delivery → choose "No" (don't auto-confirm to vendor) → OK
   *
   * Scenarios 58–73, 120–123.
   */
  async triggerDirectDelivery(): Promise<void> {
    await this.safeClick(this.salesOrderActionTab);
    await this.waitForProcessing();
    await this.safeClick(this.directDeliveryBtn);
    await this.waitForProcessing();
    // In the Direct delivery dialog, D365 may ask whether to send the PO to the vendor.
    // The recorded flow selects "No" (create the PO proposal without auto-sending).
    const noOption = this.page.locator(`:has([data-dyn-controlname="Field"] input[value="No"]) rect`);
    if (await noOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeClick(noOption);
    }
    await this.safeClick(this.commandButtonOK);
    await this.waitForProcessing();
  }

  /**
   * Verify that the PO status matches the expected value.
   * Call after navigateToLinkedPO().
   *
   * @param expectedStatus  e.g. "Open order", "Cancelled"
   */
  async verifyPOStatus(expectedStatus: string): Promise<void> {
    await expect(this.poStatusField).toHaveValue(expectedStatus, { timeout: 10_000 });
  }

  /**
   * Change the delivery address on the Sales Order via the "Other address" button.
   * Scenarios 120/121.
   *
   * @param addressName  The display name for the address
   * @param street       Street line
   * @param city         City
   * @param state        State / province
   * @param zip          ZIP / postal code
   */
  async changeDeliveryAddress(addressName: string, street: string, city: string, state: string, zip: string): Promise<void> {
    await this.safeClick(this.page.locator(`[data-dyn-controlname="MCRLogisticsLocationSelectHeader1"]`));
    await this.waitForProcessing();
    // Fill the address fields in the D365 address dialog
    const nameInput = this.page.locator(`input[aria-label="Name"], input[placeholder*="Name"]`).first();
    await this.safeFill(nameInput, addressName);
    const streetInput = this.page.locator(`input[aria-label="Street"], input[name*="Street"]`).first();
    if (await streetInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeFill(streetInput, street);
    }
    const cityInput = this.page.locator(`input[aria-label="City"], input[name*="City"]`).first();
    if (await cityInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeFill(cityInput, city);
    }
    const stateInput = this.page.locator(`input[aria-label="State"], input[name*="State"]`).first();
    if (await stateInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeFill(stateInput, state);
    }
    const zipInput = this.page.locator(`input[aria-label="ZIP/postal code"], input[name*="ZipCode"], input[name*="Zip"]`).first();
    if (await zipInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeFill(zipInput, zip);
    }
    await this.safeClick(this.page.locator(`[data-dyn-controlname="SystemDefinedOKButton"], [data-dyn-controlname="OK"][name="OK"]`).first());
    await this.waitForProcessing();
  }

  /**
   * Verify the delivery address on the linked PO contains the expected text.
   * Scenarios 120/121.
   */
  async verifyPODeliveryAddress(expectedName: string, expectedStreet: string): Promise<void> {
    const nameField = this.page.locator(`input[name="SalesTable_DeliveryName1"], input[aria-label="Name"]`).first();
    await expect(nameField).toHaveValue(new RegExp(expectedName, 'i'), { timeout: 10_000 });
    const addrField = this.page.locator(`textarea[aria-label="Address"], input[aria-label="Street"]`).first();
    await expect(addrField).toContainText(expectedStreet, { timeout: 10_000 });
  }

  /**
   * Update the quantity on a specific SO line (0-based index).
   * Scenario 67.
   */
  async updateLineQuantity(lineIndex: number, newQty: string): Promise<void> {
    const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    const qtyCell = dataRows.nth(lineIndex).locator('input[aria-label="Quantity"]');
    await qtyCell.dblclick();
    await qtyCell.fill(newQty);
    await qtyCell.press('Tab');
    await this.waitForProcessing();
  }

  /**
   * Update the unit price on a specific SO line (0-based index).
   * Scenario 68.
   */
  async updateLinePrice(lineIndex: number, newPrice: string): Promise<void> {
    const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    const priceCell = dataRows.nth(lineIndex).locator('input[aria-label="Unit price"]');
    await priceCell.dblclick();
    await priceCell.fill(newPrice);
    await priceCell.press('Tab');
    await this.waitForProcessing();
  }

  /**
   * Add a new order line item to the SO.
   * Scenarios 69/70: adding a line after the PO has been created.
   * Handles the "Update purchase order?" dialog if it appears.
   *
   * @param itemNumber  Item number to add
   */
  async addOrderLine(itemNumber: string): Promise<void> {
    await this.safeClick(this.addLineBtn);
    await this.waitForProcessing();
    await this.safeFill(this.itemIdInput, itemNumber);
    await this.itemIdInput.press('Tab');
    await this.waitForProcessing();
    // Handle optional "Update linked PO?" dialog
    const updateDialog = this.page.locator(`[data-dyn-controlname="Yes"][name="Yes"]`);
    if (await updateDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.safeClick(updateDialog);
      await this.waitForProcessing();
    }
  }

  /**
   * Apply a deposit via the MCR Complete flow.
   * Scenarios 71/72.
   *
   * @param tenderType   Tender type code (e.g. "CHECK", "WIRE")
   * @param amount       Deposit amount string (e.g. "500.00")
   */
  async applyDeposit(tenderType: string, amount: string): Promise<void> {
    await this.safeClick(this.completeBtn);
    await this.waitForProcessing();
    // Confirm the "Confirm order?" dialog that appears after clicking Complete
    await this.safeClick(this.confirmYesBtn);
    await this.waitForProcessing();
    await this.safeClick(this.addDepositBtn);
    await this.waitForProcessing();
    await this.safeFill(this.tenderTypeInput, tenderType);
    await this.tenderTypeInput.press('Tab');
    const amtInput = this.page.locator(`input[name="MCRCustPaym_Amount"], input[aria-label="Amount"]`).last();
    await this.safeFill(amtInput, amount);
    await amtInput.press('Tab');
    await this.safeClick(this.mcrOKBtn);
    await this.waitForProcessing();

    // Handle optional credit-limit exceeded popup before submitting
    const creditLimitVisible = await this.creditLimitYes.isVisible().catch(() => false);
    if (creditLimitVisible) {
      await this.safeClick(this.creditLimitYes);
      await this.waitForProcessing();
    }

    await this.safeClick(this.submitBtn);
    await this.waitForProcessing();

    // ── Payment submit fallback ────────────────────────────────────────────
    // If MCRSalesOrderRecap is still open after Submit, the tender type was
    // rejected. Remove it, re-add with method "2" (Customer Account) using
    // the captured sales total, then retry Submit.
    const isStillOpen = await this.page
      .locator(`[data-dyn-form-name="MCRSalesOrderRecap"]`)
      .isVisible()
      .catch(() => false);

    if (isStillOpen) {
      // Step 1 — select existing payment row and remove it
      await this.safeClick(this.paymGridTenderTypeId);
      await this.waitForProcessing();
      await this.safeClick(this.removePaymBtn);
      await this.waitForProcessing();
      await this.safeClick(this.removeConfirmYes);
      await this.waitForProcessing();

      // Step 2 — capture the sales total (may contain commas, e.g. "124,072.50")
      const salesTotalValue = await this.salesTotal.inputValue();
      console.log(`📋 Captured Sales Total for fallback: ${salesTotalValue}`);

      // Step 3 — add new payment with method "2" via the payment dialog
      await this.safeClick(this.addDepositBtn);
      await this.waitForProcessing();
      const paymInput = this.page
        .locator(`[data-dyn-form-name="MCRCustPaymDialog"] [data-dyn-controlname="Identification_TenderTypeId"]`)
        .locator('input')
        .first();
      await paymInput.click();
      await paymInput.pressSequentially('2', { delay: 150 });
      await this.waitForLookupOptionsStable();
      await this.page.waitForTimeout(3_000);
      await paymInput.press('Enter');
      await this.waitForProcessing();

      // Step 4 — fill amount field with the captured sales total
      const amountField = this.page.locator(
        `[data-dyn-form-name="MCRCustPaymDialog"] [data-dyn-controlname="Identification_Amount"]`,
      );
      await this.safeFill(amountField, salesTotalValue.replace(/,/g, ''));
      await this.waitForProcessing();

      // Step 5 — confirm and retry Submit
      await this.safeClick(this.mcrOKBtn);
      await this.waitForProcessing();
      await this.safeClick(this.submitBtn);
      await this.waitForProcessing();
    }
  }

  /**
   * Cancel the entire Sales Order.
   * Scenarios 73/75.
   */
  async cancelOrder(): Promise<void> {
    await this.safeClick(this.cancelOrderBtn);
    await this.waitForProcessing();
    // Confirm cancellation dialog if present
    const yesBtn = this.page.locator(`[data-dyn-controlname="Yes"][name="Yes"]`);
    if (await yesBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.safeClick(yesBtn);
      await this.waitForProcessing();
    }
    // Handle reason code dialog if present
    const okBtn = this.page.locator(`[data-dyn-controlname="OK"][name="OK"]`);
    if (await okBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.safeClick(okBtn);
      await this.waitForProcessing();
    }
  }

  /**
   * Cancel a specific line on the SO.
   * Scenario 74.
   *
   * @param lineIndex  0-based row index to cancel
   */
  async cancelOrderLine(lineIndex: number): Promise<void> {
    const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    await dataRows.nth(lineIndex).locator('[role="gridcell"]').first().click();
    await this.waitForProcessing();
    await this.safeClick(this.cancelLinesBtn);
    await this.waitForProcessing();
    const yesBtn = this.page.locator(`[data-dyn-controlname="Yes"][name="Yes"]`);
    if (await yesBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.safeClick(yesBtn);
      await this.waitForProcessing();
    }
  }

  /**
   * Verify that no physical allocations remain on the specified SO line.
   * Scenarios 73–75: navigate Inventory → Reservation and check qty = 0.
   *
   * @param lineIndex  0-based row index to check
   */
  async verifyNoAllocationsOnLine(lineIndex: number): Promise<void> {
    const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    await dataRows.nth(lineIndex).locator('[role="gridcell"]').first().click();
    // Open Inventory → Reservation for the line
    await this.safeClick(this.page.locator(`[data-dyn-controlname="ButtonLineInventory"]`));
    await this.waitForProcessing();
    const reservationBtn = this.page.locator(`[data-dyn-controlname="InventoryReservation"], button:has-text("Reservation")`).first();
    await this.safeClick(reservationBtn);
    await this.waitForProcessing();
    // Check that physically reserved quantity shows 0
    const reservedQty = this.page.locator(`input[name="InventTrans_ReservPhysical"], input[aria-label="Physical reservation"]`).first();
    await expect(reservedQty).toHaveValue('0.00', { timeout: 10_000 });
    await this.page.keyboard.press('Escape');
    await this.waitForProcessing();
  }

  /**
   * Post the packing slip (product receipt) for a D Channel order.
   * Scenario 66: confirmation of delivery of goods.
   */
  async postPackingSlip(): Promise<void> {
    // Pick and pack → Generate → Packing slip
    await this.safeClick(this.page.locator(`button[name="Pick and pack"]`));
    await this.waitForProcessing();
    const packingSlipBtn = this.page.locator(`button:has-text("Packing slip"), [data-dyn-controlname="WMSPickingRoute_PackingSlip"]`).first();
    await this.safeClick(packingSlipBtn);
    await this.waitForProcessing();
    await this.safeClick(this.page.locator(`[data-dyn-controlname="OK"][name="OK"]`));
    await this.waitForProcessing();
  }
}
