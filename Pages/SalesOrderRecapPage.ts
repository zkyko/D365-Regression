import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for MCRSalesOrderRecap form — account payment flow.
 * Shown after clicking "Complete" on the Sales Table page.
 * Displays a summary (Sales order #, Sales total) and payment controls.
 *
 * NOTE: For the credit card / iframe payment flow see Pages/MCROrderRecapPage.ts.
 * This POM is specifically for on-account (non-credit-card) payment scenarios.
 *
 * Locator enrichment (cross-referenced against MCROrderRecapPage.ts and SalesOrderPage.ts):
 *   - addButton:    button[name="AddBtn"] as primary (matches MCROrderRecapPage.ts confirmed working)
 *   - submitButton: button[name="SubmitButton"] as primary (matches SalesOrderPage.mcrSubmitBtn)
 *                   ⚠️ axtr used "SubmitBtn" — project uses "SubmitButton" — both retained as fallbacks
 */
export class SalesOrderRecapPage {
  readonly page: Page;

  // ── Output Fields ──────────────────────────────────────────────────────────
  /** "Sales order" number field (ControlName: SalesTable_SalesId, DataSource: SalesTable.SalesId) */
  readonly salesOrderField: Locator;

  /** "Sales total" amount field (ControlName: SalesTotal) */
  readonly salesTotalField: Locator;

  // ── Action Buttons ─────────────────────────────────────────────────────────
  /**
   * "Add" button – opens the Payment dialog (ControlName: AddBtn)
   * Enriched: button[name="AddBtn"] first (matches confirmed MCROrderRecapPage.ts locator)
   */
  readonly addButton: Locator;

  /**
   * "Submit" button – finalises the order
   * Enriched: button[name="SubmitButton"] first (confirmed working in SalesOrderPage.ts)
   * ⚠️ axtr had [name="SubmitBtn"] — both variants retained as fallbacks
   */
  readonly submitButton: Locator;

  /** Close / X button to dismiss this page */
  readonly closeButton: Locator;

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(page: Page) {
    this.page = page;

    this.salesOrderField = page.locator('[name="SalesTable_SalesId"], input[aria-label="Sales order"]').first();
    this.salesTotalField = page.locator('[name="SalesTotal"], input[aria-label="Sales total"]').first();

    // Enriched: button tag prefix + [name="AddBtn"] first (matches MCROrderRecapPage.ts)
    this.addButton       = page.locator(
      'button[name="AddBtn"], [name="AddBtn"], button[aria-label="Add"]'
    ).first();

    // Enriched: project's SubmitButton as primary, axtr's SubmitBtn as fallback
    this.submitButton    = page.locator(
      'button[name="SubmitButton"], button[name="SubmitBtn"], button[aria-label="Submit"]'
    ).first();

    this.closeButton     = page.locator('button[aria-label="Close"], .close-button').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Read the generated Sales order number (e.g. "SO-00001234").
   */
  async getSalesOrderNumber(): Promise<string> {
    return (await this.salesOrderField.inputValue()).trim();
  }

  /**
   * Read the displayed Sales total value.
   */
  async getSalesTotal(): Promise<string> {
    return (await this.salesTotalField.inputValue()).trim();
  }

  /**
   * Click "Add" to open the payment method dialog.
   */
  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * Click "Submit" to finalise the sales order.
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Close the recap page.
   */
  async closePage(): Promise<void> {
    await this.closeButton.click();
  }
}
