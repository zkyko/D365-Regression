import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class PurchaseOrderPage extends BasePage {

  // ─── navigation locators ──────────────────────────────────────────────────
  readonly navigationSearchBox: Locator = this.page.locator('input[aria-label="Search for a page"]');
  readonly allPurchaseOrdersResult: Locator = this.page.locator('#NavigationSearchBox_listbox_item0');

  // ─── form locators ────────────────────────────────────────────────────────
  readonly newButton: Locator = this.page.locator('[data-dyn-controlname="SystemDefinedNewButton"][name="SystemDefinedNewButton"]');
  readonly vendorAccountField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_OrderAccount"]');
  readonly purchaseOrderIdField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_PurchId"]');
  readonly modeOfDeliveryField: Locator = this.page.locator('[data-dyn-controlname="PurchTable_DlvMode"]');
  readonly purchasePoolField: Locator = this.page.locator('[data-dyn-controlname="groupAdministraton_PurchPoolId"]');
  readonly okButton: Locator = this.page.locator('[data-dyn-controlname="OK"][name="OK"]');
  readonly itemNumberField: Locator = this.page.locator('input[aria-label="Item number"]');
  readonly purchaseMenuTab: Locator = this.page.locator('[data-dyn-controlname="Purchase"]');
  readonly confirmButton: Locator = this.page.locator('[data-dyn-controlname="buttonConfirm"][name="buttonConfirm"]');
  readonly headerTitle: Locator = this.page.locator('[data-dyn-controlname="HeaderTitle"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── navigate to purchase orders via search box ───────────────────────────
  async navigateToPurchaseOrders(): Promise<void> {
    await this.safeFill(this.navigationSearchBox, "All purchase orders");
    await this.navigationSearchBox.press("Enter");
    await this.waitForProcessing();
    await this.safeClick(this.allPurchaseOrdersResult);
    await this.waitForProcessing();
  }

  // ─── click new button ─────────────────────────────────────────────────────
  async clickNew(): Promise<void> {
    await this.safeClick(this.newButton);
    await this.waitForProcessing();
  }

  // ─── fill purchase order header form — only fills fields present in data ──
  async fillPurchaseOrderForm(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    if (data["vendorAccount"]) {
      await this.safeFill(this.vendorAccountField, data["vendorAccount"].toString());
      await this.vendorAccountField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["modeOfDelivery"]) {
      await this.safeFill(this.modeOfDeliveryField, data["modeOfDelivery"].toString());
      await this.modeOfDeliveryField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["purchasePool"]) {
      await this.safeFill(this.purchasePoolField, data["purchasePool"].toString());
      await this.purchasePoolField.press("Tab");
      await this.waitForProcessing();
    }
  }

  // ─── click ok ─────────────────────────────────────────────────────────────
  async clickOk(): Promise<void> {
    await this.safeClick(this.okButton);
    await this.waitForProcessing();
  }

  // ─── fill order line fields — only fills fields present in data ───────────
  async fillOrderLines(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    if (data["itemNumber"]) {
      await this.safeFill(this.itemNumberField, data["itemNumber"].toString());
      await this.itemNumberField.press("Tab");
      await this.waitForProcessing();
    }
  }

  // ─── confirm purchase order via Purchase tab ──────────────────────────────
  async confirmPurchaseOrder(): Promise<void> {
    await this.safeClick(this.purchaseMenuTab);
    await this.waitForProcessing();
    await this.safeClick(this.confirmButton);
    await this.waitForProcessing();
  }

  // ─── capture only fields D365 GENERATES — never capture input data fields ──
  async captureOrderDetails(): Promise<string> {
    const purchaseOrderId = await this.captureInputValue("purchaseOrderId", this.purchaseOrderIdField);
    // add D365-generated fields here only — never input Excel fields
    return purchaseOrderId;
  }

  // ─── log created purchase order ───────────────────────────────────────────
  async logPOCreated(purchaseOrderId: string): Promise<void> {
    console.log(`✅ Purchase Order Created: ${purchaseOrderId}`);
  }
}
