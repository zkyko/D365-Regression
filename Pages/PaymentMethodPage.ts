import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for MCRCustPaymDialog (Payment dialog)
 * and its nested lookup MCRCustPaymLookup.
 * Reached by clicking "Add" on the Sales Order Recap page.
 *
 * Forms involved:
 *   - MCRCustPaymDialog  (1524_MCRCustPaymDialog)
 *   - MCRCustPaymLookup  (1548_Identification_TenderTypeId_Lookup)
 *
 * NOTE: This covers on-account payment method selection (e.g. "AR" / account payment type).
 * For credit card iframe payment see Pages/MCROrderRecapPage.ts.
 *
 * Locator enrichment (cross-referenced against MCROrderRecapPage.ts):
 *   - okButton: button[name="OKButton"] as primary (confirmed working in MCROrderRecapPage.ts)
 */
export class PaymentMethodPage {
  readonly page: Page;

  // ── MCRCustPaymDialog Controls ─────────────────────────────────────────────
  /** "Payment method" lookup input (ControlName: Identification_TenderTypeId, DataSource: MCRCustPaymTable.TenderTypeId) */
  readonly paymentMethodInput: Locator;

  /** "Percent amount" numeric field (ControlName: PercentAmount or similar) */
  readonly percentAmountField: Locator;

  /**
   * "OK" button to confirm the payment entry
   * Enriched: button[name="OKButton"] first (confirmed working in MCROrderRecapPage.ts)
   */
  readonly okButton: Locator;

  // ── MCRCustPaymLookup Controls ─────────────────────────────────────────────
  /** Column filter for "Payment method" in the lookup grid */
  readonly paymentMethodFilterInput: Locator;

  /** First row in the lookup result list */
  readonly firstLookupRow: Locator;

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(page: Page) {
    this.page = page;

    this.paymentMethodInput     = page.locator('[name="Identification_TenderTypeId"], input[aria-label="Payment method"]').first();
    this.percentAmountField     = page.locator('[aria-label="Percent amount"], [name="PercentAmount"]').first();

    // Enriched: button[name="OKButton"] first (matches MCROrderRecapPage.ts confirmed locator)
    this.okButton               = page.locator(
      'button[name="OKButton"], button[aria-label="OK"], [name="OKButton"]'
    ).first();

    // Lookup dialog elements (appear in the popup/dialog)
    this.paymentMethodFilterInput = page.locator('[name="Lookup_RetailStoreTenderTypeId"], input[placeholder*="Payment method"]').first();
    this.firstLookupRow           = page.locator('.lookup-grid tbody tr:first-child, [role="row"]:first-child').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Open the Payment method lookup popup.
   */
  async openPaymentMethodLookup(): Promise<void> {
    await this.paymentMethodInput.click();
  }

  /**
   * Filter the lookup by payment method value and select the matching row.
   * @param filterValue  e.g. "3"
   */
  async filterAndSelectPaymentMethod(filterValue: string): Promise<void> {
    // Open the column filter on "Payment method" field
    await this.paymentMethodFilterInput.fill(filterValue);
    await this.paymentMethodFilterInput.press('Enter');

    // Click the first result row (the link in the selected row)
    await this.firstLookupRow.click();
  }

  /**
   * Enter the percentage amount for the payment.
   * @param percent  e.g. "100"
   */
  async enterPercentAmount(percent: string): Promise<void> {
    await this.percentAmountField.fill(percent);
    await this.percentAmountField.press('Tab');
  }

  /**
   * Click OK to confirm the payment dialog.
   */
  async clickOk(): Promise<void> {
    await this.okButton.click();
  }
}
