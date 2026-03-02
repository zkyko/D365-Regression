import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DChannelOrderPage — Direct Channel (D Channel / Drop Ship) order management.
 *
 * D Channel orders are sales orders where a vendor ships directly to the customer.
 * They link an SO to a PO. Key differences from regular SOs:
 *   - "Direct delivery" flag on line items
 *   - Linked Purchase Order (PO) is auto-created
 *   - Ship window (date range) must be set
 *   - Freight terms: "customer carries" vs "FH carries"
 *   - Deposits may be required
 *   - EDI orders come in via trading partner (not manually created)
 *
 * Used by: tests/d-channel.spec.ts
 * Scenarios: 58–75, 120–123
 *
 * ─── HOW TO FIND LOCATORS ────────────────────────────────────────────────────
 * D Channel orders are likely created from the same "All Sales Orders" list page
 * but with a different order type or channel flag. Steps to explore:
 *
 * 1. Navigate: Sales and Marketing > Sales Orders > All Sales Orders → New
 *    OR: Retail and Commerce > Channels > D Channel > D Channel Orders (if exists)
 * 2. When creating the SO, there may be a "Channel" or "Order type" field
 *    that distinguishes D Channel from W Channel.
 * 3. On the SO Lines tab, look for a "Direct delivery" checkbox per line.
 * 4. The linked PO is likely accessible from the SO Line via:
 *    Lines tab → "Linked purchase order" link or a "Purchase" action pane button.
 * 5. Ship window: likely on the Header tab or a dedicated "Delivery" FastTab.
 * 6. Deposit: check MCR Order Recap (same Complete flow as regular SO) or a
 *    separate Deposit button on the SO Action Pane.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class DChannelOrderPage extends BasePage {

  // ─── TODO: Locators — all need confirming against live D365 ───────────────

  // ─── SO creation / channel flag ───────────────────────────────────────────
  // TODO: Find where channel type is set (may be on new SO dialog or Header tab)
  // readonly channelTypeCombo: Locator = this.page.getByRole('combobox', { name: 'TODO: channel field' });

  // ─── Direct delivery on SO line ───────────────────────────────────────────
  // TODO: Inspect SO Lines grid for "Direct delivery" checkbox per line
  // readonly directDeliveryCheckbox: Locator = this.page.locator('input[name="TODO_DirectDelivery"]');

  // ─── Ship window fields (Header or Delivery tab) ──────────────────────────
  // TODO: Find "Ship window from" and "Ship window to" date fields
  // readonly shipWindowFromInput: Locator = this.page.locator('input[name="TODO_ShipWindowFrom"]');
  // readonly shipWindowToInput: Locator = this.page.locator('input[name="TODO_ShipWindowTo"]');

  // ─── Freight terms ────────────────────────────────────────────────────────
  // TODO: Find "Delivery terms" or "Freight terms" field (likely a combobox)
  // readonly freightTermsCombo: Locator = this.page.getByRole('combobox', { name: 'Delivery terms' });

  // ─── Charges / fees (LCL, freight, transportation) ───────────────────────
  // TODO: Find the "Charges" button on the SO Action Pane (likely under "Sell" tab)
  // readonly chargesBtn: Locator = this.page.locator('button[name="TODO_ChargesButton"]');
  // readonly chargesGrid: Locator = this.page.locator('[role="grid"][aria-label*="Charges"]');
  // readonly chargesCodeCombo: Locator = this.page.getByRole('combobox', { name: 'Charges code' });
  // readonly chargesValueInput: Locator = this.page.locator('input[name="TODO_ChargesValue"]');

  // ─── Deposit ──────────────────────────────────────────────────────────────
  // TODO: Find deposit button — may be on MCR Order Recap or SO Action Pane
  // readonly depositAmountInput: Locator = this.page.locator('input[name="TODO_DepositAmount"]');

  // ─── Linked PO ────────────────────────────────────────────────────────────
  // TODO: Find the link to the auto-generated PO from the SO
  // Could be on Lines tab → right-click → "View details" or a "Purchase order" link
  // readonly linkedPOLink: Locator = this.page.getByRole('link').filter({ hasText: /^PO\d+/ });

  // ─── PO status / address fields ───────────────────────────────────────────
  // TODO: On the linked PO, find status field and delivery address fields
  // readonly poStatusField: Locator = this.page.locator('input[name="TODO_POStatus"]');
  // readonly poDeliveryNameInput: Locator = this.page.locator('input[name="TODO_DeliveryName"]');
  // readonly poDeliveryAddressInput: Locator = this.page.locator('input[name="TODO_DeliveryAddress"]');

  // ─── Vendor account on SO line ────────────────────────────────────────────
  // TODO: Inspect the SO Lines grid for a "Vendor account" column
  // readonly lineVendorField: Locator = this.page.locator('input[name="TODO_LineVendor"]');

  // ─── Cancel order / line ──────────────────────────────────────────────────
  // TODO: Find cancel button — may be on the Action Pane or via a status change
  // readonly cancelOrderBtn: Locator = this.page.locator('button[name="TODO_CancelOrder"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the D Channel order list.
   *
   * TODO: Confirm the correct navigation path. Options:
   *   - "All sales orders" filtered by channel type
   *   - A dedicated D Channel menu item
   * Navigate using the top-bar search as with other pages.
   */
  async navigate(): Promise<void> {
    // TODO: Confirm the exact search term and option text for D Channel orders
    // await this.navigateTo('All sales orders', 'All sales orders Accounts receivable');
    console.warn('⚠ DChannelOrderPage.navigate() — TODO: confirm navigation path');
    throw new Error('DChannelOrderPage.navigate() not yet implemented — see TODO in Pages/DChannelOrderPage.ts');
  }

  /**
   * Create a new D Channel order with the given customer and PO.
   *
   * This is similar to SalesOrderPage.fillNewOrderDialog() but may have
   * additional fields (channel type, order type) in the New SO dialog.
   *
   * Scenarios 58–65, 122–123.
   *
   * TODO: Inspect the "New sales order" dialog for D channel-specific fields.
   *
   * @param customerAccount  D365 customer account number
   * @param customerPO       Optional customer PO reference
   */
  async createNewOrder(customerAccount: string, customerPO?: string): Promise<void> {
    // TODO: implement — likely same as SalesOrderPage.fillNewOrderDialog()
    // but with channel-type field set to "D Channel" or equivalent
    console.warn('⚠ DChannelOrderPage.createNewOrder() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.createNewOrder() not yet implemented');
  }

  /**
   * Set the ship window (from/to dates) on the order.
   *
   * All D Channel scenarios require "Ensure ship window is set."
   *
   * TODO: Find where ship window is on the SO form.
   *   - Check Header tab → "Delivery" FastTab
   *   - May be "Requested ship date" (from) + "Ship date" (to)
   *   - Or dedicated "Ship window from" / "Ship window to" fields
   *
   * @param fromDate  Start date string (e.g. "03/01/2026")
   * @param toDate    End date string  (e.g. "03/15/2026")
   */
  async setShipWindow(fromDate: string, toDate: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.headerTab.click(); (reuse SalesOrderPage.headerTab if accessible)
    // await this.shipWindowFromInput.fill(fromDate);
    // await this.shipWindowFromInput.press('Tab');
    // await this.shipWindowToInput.fill(toDate);
    // await this.shipWindowToInput.press('Tab');
    console.warn('⚠ DChannelOrderPage.setShipWindow() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.setShipWindow() not yet implemented');
  }

  /**
   * Set the delivery/freight terms on the order.
   *
   * @param terms  e.g. "CustomerCarries", "Prepaid", "FHCarries"
   */
  async setFreightTerms(terms: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.freightTermsCombo.fill(terms);
    // await this.freightTermsCombo.press('Tab');
    console.warn('⚠ DChannelOrderPage.setFreightTerms() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.setFreightTerms() not yet implemented');
  }

  /**
   * Add a charge (LCL fee, freight charge, or transportation charge) to the SO.
   *
   * Scenarios 58 (LCL fee), 59 (freight charge), 60 (transportation charge), 61 (freight).
   *
   * TODO: Steps to implement:
   *   1. Click the "Charges" button on the SO Action Pane (check "Sell" tab)
   *   2. In the Charges grid, click New
   *   3. Set the Charges code (e.g. "LCL", "FREIGHT", "TRANS")
   *   4. Set the charge value / amount
   *   5. Click Save / Close
   *
   * @param chargesCode  The charge type code (e.g. "LCL", "FREIGHT", "TRANS")
   * @param amount       The charge amount as a string (e.g. "150.00")
   */
  async addCharge(chargesCode: string, amount: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.chargesBtn.click();
    // await this.page.waitForTimeout(300);
    // await this.page.getByRole('button', { name: 'New' }).click();
    // await this.chargesCodeCombo.fill(chargesCode);
    // await this.chargesCodeCombo.press('Tab');
    // await this.chargesValueInput.fill(amount);
    // await this.chargesValueInput.press('Tab');
    // await this.page.getByRole('button', { name: 'Save' }).click();
    // await this.waitForProcessing();
    console.warn('⚠ DChannelOrderPage.addCharge() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.addCharge() not yet implemented');
  }

  /**
   * Verify the vendor account on a specific SO line.
   *
   * Scenario 65: D channel order with 2 vendors — ensure correct vendor per line.
   *
   * @param lineIndex       0-based row index
   * @param expectedVendor  Expected vendor account number
   */
  async verifyLineVendorAccount(lineIndex: number, expectedVendor: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    // const vendorCell = dataRows.nth(lineIndex).locator('input[name="TODO_LineVendor"]');
    // await expect(vendorCell).toHaveValue(expectedVendor, { timeout: 5_000 });
    console.warn('⚠ DChannelOrderPage.verifyLineVendorAccount() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.verifyLineVendorAccount() not yet implemented');
  }

  /**
   * Navigate to the linked Purchase Order from the current Sales Order.
   *
   * D Channel SOs auto-create a linked PO. After SO confirmation, this method
   * navigates to that PO for verification.
   *
   * TODO: Find the SO → PO link. Possible locations:
   *   - Lines tab → "Related orders" section
   *   - Lines tab → right-click row → "Linked purchase order"
   *   - Header tab → "References" FastTab
   *
   * @returns The PO number string (e.g. "PO000012345")
   */
  async navigateToLinkedPO(): Promise<string> {
    // TODO: implement after locators are confirmed
    // await this.linkedPOLink.click();
    // await this.waitForProcessing();
    // const poNumber = await this.page.locator('[id*="PurchId"]').textContent() ?? '';
    // return poNumber.trim();
    console.warn('⚠ DChannelOrderPage.navigateToLinkedPO() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.navigateToLinkedPO() not yet implemented');
  }

  /**
   * Verify that the PO status matches the expected value.
   *
   * Called while on the linked PO page (after navigateToLinkedPO()).
   *
   * @param expectedStatus  e.g. "Open order", "Cancelled"
   */
  async verifyPOStatus(expectedStatus: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await expect(this.poStatusField).toHaveValue(expectedStatus, { timeout: 5_000 });
    console.warn('⚠ DChannelOrderPage.verifyPOStatus() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.verifyPOStatus() not yet implemented');
  }

  /**
   * Change the delivery address on the Sales Order.
   *
   * Scenarios 120/121: Change address on SO → verify it flows through to PO.
   *
   * TODO: Find the delivery address field(s) on the SO Header tab.
   *   - Look in Header tab → "Delivery" FastTab
   *   - May have Name + Street + City + State + Zip fields
   *
   * @param name     Delivery name
   * @param street   Street address
   * @param city     City
   * @param state    State code
   * @param zip      ZIP code
   */
  async changeDeliveryAddress(name: string, street: string, city: string, state: string, zip: string): Promise<void> {
    // TODO: implement after locators are confirmed
    console.warn('⚠ DChannelOrderPage.changeDeliveryAddress() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.changeDeliveryAddress() not yet implemented');
  }

  /**
   * Verify that the delivery address on the linked PO matches the expected values.
   *
   * Scenarios 120/121: After changing SO address, verify PO address updated too.
   * Should match both address and address name fields.
   *
   * TODO: Navigate to linked PO first, then inspect delivery address fields.
   */
  async verifyPODeliveryAddress(expectedName: string, expectedStreet: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await expect(this.poDeliveryNameInput).toHaveValue(expectedName, { timeout: 5_000 });
    // await expect(this.poDeliveryAddressInput).toContainText(expectedStreet, { timeout: 5_000 });
    console.warn('⚠ DChannelOrderPage.verifyPODeliveryAddress() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.verifyPODeliveryAddress() not yet implemented');
  }

  /**
   * Update the quantity on a specific SO line.
   *
   * Scenario 67: Change quantity on Scenario 59's order.
   *
   * @param lineIndex  0-based row index
   * @param newQty     New quantity string (e.g. "5")
   */
  async updateLineQuantity(lineIndex: number, newQty: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    // const qtyCell = dataRows.nth(lineIndex).locator('input[name="SalesQty"]'); // confirm name attr
    // await qtyCell.dblclick();
    // await qtyCell.fill(newQty);
    // await qtyCell.press('Tab');
    // await this.waitForProcessing();
    console.warn('⚠ DChannelOrderPage.updateLineQuantity() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.updateLineQuantity() not yet implemented');
  }

  /**
   * Update the unit price on a specific SO line.
   *
   * Scenario 68: Update price on Scenario 59's order.
   *
   * @param lineIndex  0-based row index
   * @param newPrice   New price string (e.g. "350.00")
   */
  async updateLinePrice(lineIndex: number, newPrice: string): Promise<void> {
    // TODO: implement — similar to PricingPage.overrideLinePrice()
    console.warn('⚠ DChannelOrderPage.updateLinePrice() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.updateLinePrice() not yet implemented');
  }

  /**
   * Add a new order line to an existing D Channel SO (after PO has been created).
   *
   * Scenarios 69/70: Add SO line after the PO has already been created.
   *
   * TODO: Same as SalesOrderPage.enterItemNumber() — try using that method.
   * Note: adding a line after PO creation may trigger a dialog asking about
   * updating the linked PO. Handle that dialog if it appears.
   *
   * @param itemNumber  Item number to add
   */
  async addOrderLine(itemNumber: string): Promise<void> {
    // TODO: implement — may reuse enterItemNumber() from SalesOrderPage
    // Watch for a "Update purchase order?" dialog after adding the line
    console.warn('⚠ DChannelOrderPage.addOrderLine() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.addOrderLine() not yet implemented');
  }

  /**
   * Apply a deposit to the order.
   *
   * Scenarios 71/72: Apply deposit from Scenario 58/59.
   *
   * TODO: Find where deposits are managed — check the MCR Order Recap dialog
   * (Complete button flow) or a dedicated "Deposit" button on the SO Action Pane.
   *
   * @param amount  Deposit amount string (e.g. "500.00")
   */
  async applyDeposit(amount: string): Promise<void> {
    // TODO: implement after locators are confirmed
    console.warn('⚠ DChannelOrderPage.applyDeposit() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.applyDeposit() not yet implemented');
  }

  /**
   * Cancel the entire Sales Order.
   *
   * Scenarios 73/75: Cancel D Channel SO → verify allocations release and PO cancels.
   *
   * TODO: Find the cancel button/option. Options:
   *   - Action Pane → "Maintain" tab → Cancel button
   *   - Or set order status to "Cancelled"
   *   - May show a confirmation dialog
   */
  async cancelOrder(): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.cancelOrderBtn.click();
    // Handle confirmation dialog if present
    // await this.page.getByRole('button', { name: 'Yes' }).click();
    // await this.waitForProcessing();
    console.warn('⚠ DChannelOrderPage.cancelOrder() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.cancelOrder() not yet implemented');
  }

  /**
   * Cancel a specific line on the Sales Order.
   *
   * Scenario 74: Cancel one line from Scenario 69's order.
   *
   * @param lineIndex  0-based row index to cancel
   */
  async cancelOrderLine(lineIndex: number): Promise<void> {
    // TODO: implement — may be right-click → Cancel line, or a status field change
    console.warn('⚠ DChannelOrderPage.cancelOrderLine() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.cancelOrderLine() not yet implemented');
  }

  /**
   * Verify that no allocations/reservations remain on the specified line.
   *
   * Scenarios 73–75: "Ensure allocations do not stick."
   *
   * @param lineIndex  0-based row index to check
   */
  async verifyNoAllocationsOnLine(lineIndex: number): Promise<void> {
    // TODO: implement — check Inventory → Reservation for this line
    // ALCPhysicallyAllocated should be 0 after cancellation
    console.warn('⚠ DChannelOrderPage.verifyNoAllocationsOnLine() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.verifyNoAllocationsOnLine() not yet implemented');
  }

  /**
   * Post the packing slip for a D Channel order upon delivery confirmation.
   *
   * Scenario 66: Post packing slip upon confirmation of delivery of goods.
   *
   * TODO: This is likely the same as ShipmentsPage.postPackingSlip()
   * but triggered from the SO form rather than the Shipments page.
   */
  async postPackingSlip(): Promise<void> {
    // TODO: May reuse ShipmentsPage.postPackingSlip() if buttons are same on SO form
    // Otherwise add specific locators here
    console.warn('⚠ DChannelOrderPage.postPackingSlip() — TODO: not yet implemented');
    throw new Error('DChannelOrderPage.postPackingSlip() not yet implemented');
  }
}
