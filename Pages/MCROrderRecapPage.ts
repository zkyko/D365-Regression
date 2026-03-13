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
    const paymentDialog = this.page
      .locator('div[role="dialog"][data-dyn-form-name="MCRCustPaymDialog"]')
      .first();
    const paymentDialogOpen = await paymentDialog.isVisible({ timeout: 1_500 }).catch(() => false);

    // If the payment dialog is already open (e.g., saved-card lookup path), don't
    // click Add again on the recap form behind the modal.
    if (!paymentDialogOpen) {
      await this.addPaymentBtn.waitFor({ state: "visible", timeout: 10_000 });
      const opened = await this.openPaymentDialog(paymentDialog);
      if (!opened) {
        throw new Error("Payment dialog did not open from MCR recap Add button.");
      }
    }

    const addCardBtn = paymentDialog.getByRole("button", { name: "Add credit card" }).first();
    await this.clickWhenUnblocked(addCardBtn);
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
    await this.clickWhenUnblocked(this.okBtn);
    await this.page.waitForLoadState("networkidle");

    // OK on the payment amount dialog
    await this.clickWhenUnblocked(this.okButtonBtn);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click the MCR Submit button.
   *
   * @param submitBtn  The Locator returned by SalesOrderPage.clickComplete().
   *                   Passing it in avoids re-locating it from a different context.
   */
  async submit(submitBtn: Locator): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 8; attempt++) {
      const shellBlocker = this.page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
      if (await shellBlocker.isVisible({ timeout: 1_500 }).catch(() => false)) {
        await shellBlocker.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
      }

      try {
        await submitBtn.click({ timeout: 8_000 });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        await this.page.waitForTimeout(400 * attempt);
      }
    }
    if (lastError) throw lastError;

    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2_000);
  }

  /**
   * Add an on-account payment (e.g. AR tender type).
   *
   * Flow:
   *   Add (payment) → payment dialog opens → set TenderType → OK
   *
   * @param tenderType  The tender type code to enter, e.g. "AR".
   */
  async addAccountPayment(tenderType: string): Promise<void> {
    const paymentDialog = this.page
      .locator('div[role="dialog"][data-dyn-form-name="MCRCustPaymDialog"]')
      .first();

    await this.addPaymentBtn.waitFor({ state: "visible", timeout: 10_000 });
    const opened = await this.openPaymentDialog(paymentDialog);
    if (!opened) {
      throw new Error("Payment dialog did not open when adding account payment.");
    }

    const tenderField = paymentDialog
      .locator(
        '[data-dyn-controlname="Identification_TenderTypeId"] input, input[aria-label="Payment method"]',
      )
      .first();
    await tenderField.waitFor({ state: "visible", timeout: 10_000 });
    await tenderField.fill(tenderType);
    await tenderField.press("Tab");
    await this.page.waitForTimeout(500);

    const okBtn = this.page.locator('button[name="OKButton"]').first();
    await this.clickWhenUnblocked(okBtn);
    await this.page.waitForLoadState("networkidle");
  }

  private async openPaymentDialog(paymentDialog: Locator): Promise<boolean> {
    for (let attempt = 1; attempt <= 6; attempt++) {
      if (await paymentDialog.isVisible({ timeout: 800 }).catch(() => false)) {
        return true;
      }

      const shellBlocker = this.page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
      if (await shellBlocker.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await shellBlocker.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
      }

      await this.addPaymentBtn.click({ timeout: 4_000 }).catch(() => {});
      await this.page.waitForTimeout(300 * attempt);
    }
    return paymentDialog.isVisible({ timeout: 1_000 }).catch(() => false);
  }

}
// clickWhenUnblocked is inherited from BasePage
