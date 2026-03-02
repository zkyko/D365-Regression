import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/** Credit card data passed to addCreditCard(). */
export interface CreditCardData {
  name:     string;
  number:   string;
  cvv:      string;
  expMonth: string;
  expYear:  string;
  zip:      string;
  address:  string;
}

/**
 * MCROrderRecapPage — the MCR Order Recap modal dialog.
 *
 * Covers:
 *   - Expanding the Payments section
 *   - Adding a credit card via the nested-iframe tokenization form
 *   - Submitting the order
 */
export class MCROrderRecapPage extends BasePage {

  // ─── Payments section ─────────────────────────────────────────────────────
  // Toggle id pattern: MCRSalesOrderRecap_N_SalesOrderSummaryPayments_caption (N = dynamic session)
  readonly paymentsToggle: Locator =
    this.page.locator('button[id*="SalesOrderSummaryPayments"]').first();
  // Add button inside Payments: name="AddBtn"
  readonly addPaymentBtn: Locator =
    this.page.locator('button[name="AddBtn"]');

  // ─── Credit card dialog ───────────────────────────────────────────────────
  readonly addCreditCardBtn: Locator =
    this.page.getByRole("button", { name: "Add credit card" });
  readonly mainIframe: Locator =
    this.page.locator("iframe").first();

  // ─── Post-iframe confirmation buttons ────────────────────────────────────
  // button[name="OK"]       → credit card tokenization dialog OK
  // button[name="OKButton"] → payment amount dialog OK
  readonly okBtn:       Locator = this.page.locator('button[name="OK"]');
  readonly okButtonBtn: Locator = this.page.locator('button[name="OKButton"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /**
   * Ensure the Payments section in the MCR dialog is expanded.
   * Clicks the toggle if it exists and is currently collapsed.
   */
  async ensurePaymentsExpanded(): Promise<void> {
    const visible = await this.paymentsToggle
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (visible) {
      const expanded = await this.paymentsToggle.getAttribute("aria-expanded");
      if (expanded !== "true") {
        await this.paymentsToggle.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Add a credit card payment.
   *
   * Flow:
   *   Add (payment) → Add credit card → fill nested-iframe tokenization form
   *   → OK (tokenization) → OK (amount confirmation)
   */
  async addCreditCard(cc: CreditCardData): Promise<void> {
    await this.addPaymentBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.addPaymentBtn.click();
    await this.page.waitForLoadState("networkidle");

    await this.addCreditCardBtn.click();
    await this.page.waitForLoadState("networkidle");

    // ── Nested-iframe tokenization form ─────────────────────────────────────
    const iframeContent = this.mainIframe.contentFrame();

    await iframeContent.getByRole("textbox", { name: "Name" }).fill(cc.name);

    const cardFrame = iframeContent.locator('iframe[title="Card Number"]').contentFrame();
    await cardFrame.getByRole("textbox", { name: "Card Number" }).fill(cc.number);

    const cvvFrame = iframeContent.locator('iframe[title="CVV"]').contentFrame();
    await cvvFrame.getByRole("textbox", { name: "CVC" }).fill(cc.cvv);

    await iframeContent.getByRole("spinbutton", { name: "Month" }).fill(cc.expMonth);
    await iframeContent.getByRole("spinbutton", { name: "Year"  }).fill(cc.expYear);
    await iframeContent.getByRole("textbox",    { name: "Zip"   }).fill(cc.zip);
    await iframeContent.getByRole("textbox",    { name: "Address" }).fill(cc.address);
    // ────────────────────────────────────────────────────────────────────────

    // OK on the tokenization dialog
    await this.okBtn.click();
    await this.page.waitForLoadState("networkidle");

    // OK on the payment amount dialog
    await this.okButtonBtn.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click the MCR Submit button.
   *
   * @param submitBtn  The Locator returned by SalesOrderPage.clickComplete().
   *                   Passing it in avoids re-locating it from a different context.
   */
  async submit(submitBtn: Locator): Promise<void> {
    await submitBtn.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2_000);
  }
}
