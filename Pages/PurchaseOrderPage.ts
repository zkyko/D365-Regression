import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class PurchaseOrderPage extends BasePage {

  // ─── navigation ───────────────────────────────────────────────────────────
  readonly newButton: Locator = this.page.locator('button[name="SystemDefinedNewButton"]');

  // ─── create-order dialog ──────────────────────────────────────────────────
  readonly vendorAccountField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_OrderAccount"] input');  // General section — site, warehouse, receipt date
  readonly dialogSiteField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_InventSiteId"]');
  readonly dialogWarehouseField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_InventLocationId"]');
  readonly dialogReceiptDateField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_DeliveryDate"]');
  // Administration section — orderer
  readonly dialogOrdererField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_NameAlias"]');  // Mode of Delivery is required in the dialog before OK can be clicked
  readonly dialogModeOfDeliveryField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_DlvMode"]');
  readonly okButton: Locator = this.page.locator('button[name="OK"]').first();

  // ─── PO header ────────────────────────────────────────────────────────────
  readonly purchaseOrderIdField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_PurchId"] input').first();
  readonly modeOfDeliveryField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_DlvMode"] input').first();

  // ─── Lines grid ───────────────────────────────────────────────────────────
  readonly itemNumberField: Locator = this.page.getByRole('combobox', { name: /item number/i }).first();
  readonly quantityField: Locator = this.page.locator('[data-dyn-controlname="PurchLine_PurchQtyGrid"] input').first();
  readonly receiveNowField: Locator = this.page.locator('[data-dyn-controlname="PurchLine_PurchReceivedNow"] input').first();

  // ─── create-order dialog extras ───────────────────────────────────────────
  /** Optional D-Channel / channel field on the create-order dialog */
  readonly dialogChannelField: Locator = this.page.locator('[data-dyn-form-name="PurchCreateOrder"] [name="PurchTable_PurchChannel"]');

  // ─── action pane tabs ─────────────────────────────────────────────────────
  readonly purchaseTab: Locator = this.page.locator('button[name="Purchase"]').first();
  readonly confirmButton: Locator = this.page.locator('button[name="buttonConfirm"]').first();
  readonly saveButton: Locator = this.page.locator('button[name="SystemDefinedSaveButton"]').first();
  readonly receiveTab: Locator = this.page.locator('button[name="Receive"]').first();
  readonly updateLineButton: Locator = this.page.locator('button[name="LineStripUpdate"]').first();

  // ─── header view / status fields ──────────────────────────────────────────
  readonly headerViewButton: Locator = this.page.locator('button[name="HeaderView_header"]').first();
  readonly linesViewButton: Locator = this.page.locator('button[name="HeaderView_lines"]').first();
  readonly approvalStatusField: Locator = this.page.locator('input[id$="ApprovalStatus_input"]').first();
  readonly headerPoolField: Locator = this.page.locator('[data-dyn-form-name="PurchTable"] [name="PurchPoolId"] input').first();
  readonly headerVendorField: Locator = this.page.locator('[data-dyn-form-name="PurchTable"] [name="OrderAccount"] input').first();

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── navigate to All Purchase Orders ─────────────────────────────────────
  async navigate(): Promise<void> {
    await this.navigateTo(
      'All purchase orders',
      'All purchase orders Procurement',
      '**/*PurchTableListPage*',
    );
  }

  // ─── click New ────────────────────────────────────────────────────────────
  async clickNew(): Promise<void> {
    await this.safeClick(this.newButton);
    await this.waitForProcessing();
  }

  // ─── fill vendor account in create-order dialog ───────────────────────────
  async fillVendorAccount(vendorAccount: string): Promise<void> {
    await this.safeFill(this.vendorAccountField, vendorAccount);
    await this.vendorAccountField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── General section: Site, Warehouse, Receipt date ─────────────────────
  async fillSite(site: string): Promise<void> {
    await this.safeFill(this.dialogSiteField, site);
    await this.dialogSiteField.press('Tab');
    await this.waitForProcessing();
  }

  async fillWarehouse(warehouse: string): Promise<void> {
    await this.safeFill(this.dialogWarehouseField, warehouse);
    await this.dialogWarehouseField.press('Tab');
    await this.waitForProcessing();
  }

  async setReceiptDate(date: string): Promise<void> {
    await this.safeFill(this.dialogReceiptDateField, date);
    await this.dialogReceiptDateField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── Administration section: Orderer ─────────────────────────────────────
  async fillOrderer(orderer: string): Promise<void> {
    await this.safeFill(this.dialogOrdererField, orderer);
    await this.dialogOrdererField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── fill Mode of Delivery in the create-order dialog (required before OK) ─
  async fillDialogModeOfDelivery(mode: string): Promise<void> {
    await this.safeFill(this.dialogModeOfDeliveryField, mode);
    await this.dialogModeOfDeliveryField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── click OK on the create-order dialog ──────────────────────────────────
  async clickOk(): Promise<void> {
    await this.safeClick(this.okButton);
    await this.waitForProcessing();
  }

  // ─── set mode of delivery on the header ───────────────────────────────────
  async setModeOfDelivery(mode: string): Promise<void> {
    await this.safeFill(this.modeOfDeliveryField, mode);
    await this.modeOfDeliveryField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── capture the D365-generated PO number ────────────────────────────────
  async capturePurchaseOrderNumber(): Promise<string> {
    return await this.captureInputValue('Purchase Order Number', this.purchaseOrderIdField);
  }

  // ─── enter item number on the lines tab ───────────────────────────────────
  async enterItemNumber(itemNumber: string): Promise<void> {
    await this.safeFill(this.itemNumberField, itemNumber);
    await this.itemNumberField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── set quantity on the line ─────────────────────────────────────────────
  async setQuantity(qty: string): Promise<void> {
    await this.safeFill(this.quantityField, qty);
    await this.quantityField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── set receive-now quantity (partial receipt for delivery remainder) ─────
  async setReceiveNow(qty: string): Promise<void> {
    await this.safeFill(this.receiveNowField, qty);
    await this.receiveNowField.press('Tab');
    await this.waitForProcessing();
  }

  // ─── save the PO ─────────────────────────────────────────────────────────
  async save(): Promise<void> {
    await this.safeClick(this.saveButton);
    await this.waitForProcessing();
  }

  // ─── confirm the PO (Purchase tab → Confirm) ──────────────────────────────
  async confirmPurchaseOrder(): Promise<void> {
    await this.safeClick(this.purchaseTab);
    await this.waitForProcessing();
    await this.safeClick(this.confirmButton);
    await this.waitForProcessing();
  }

  // ─── fill channel in the create-order dialog (optional — D-Channel) ────────
  async fillDialogChannel(channel: string): Promise<void> {
    if (await this.dialogChannelField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.safeFill(this.dialogChannelField, channel);
      await this.dialogChannelField.press('Tab');
      await this.waitForProcessing();
    }
  }

  // ─── open the Receive tab ─────────────────────────────────────────────────
  async openReceiveTab(): Promise<void> {
    await this.safeClick(this.receiveTab);
    await this.waitForProcessing();
  }

  // ─── click "Update line" on the Receive tab ───────────────────────────────
  async clickUpdateLine(): Promise<void> {
    await this.safeClick(this.updateLineButton);
    await this.waitForProcessing();
  }

  // ─── header view helpers ──────────────────────────────────────────────────

  /** Switch to the Header view of the PO form. */
  async switchToHeaderView(): Promise<void> {
    await this.safeClick(this.headerViewButton);
    await this.waitForProcessing();
  }

  /** Switch back to Lines view of the PO form. */
  async switchToLinesView(): Promise<void> {
    await this.safeClick(this.linesViewButton);
    await this.waitForProcessing();
  }

  /** Returns the current approval status value (e.g. 'Confirmed', 'Draft'). */
  async getApprovalStatus(): Promise<string> {
    return this.captureInputValue('Approval Status', this.approvalStatusField);
  }

  /** Returns the PO pool code from the header view. */
  async getHeaderPool(): Promise<string> {
    return this.captureInputValue('PO Pool', this.headerPoolField);
  }

  /** Returns the vendor account from the header view. */
  async getHeaderVendor(): Promise<string> {
    return this.captureInputValue('Vendor Account', this.headerVendorField);
  }
}
