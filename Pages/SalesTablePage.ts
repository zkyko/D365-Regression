import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for SalesTable (SalesTableForEdit) form
 * AOT Form: SalesTable  |  Menu Item: SalesTableForEdit
 * Reached after clicking "New sales order" on Customer Service page.
 *
 * NOTE: This is a lightweight POM for the account-payment flow.
 * For the full website SO flow (credit card, bundles, reservations, etc.)
 * see Pages/SalesOrderPage.ts.
 *
 * Locator enrichment:
 *   - salesLineGrid:  axtr [name="SalesLineGrid"] + project fallback [role="grid"][aria-label="Order lines"]
 *   - completeButton: axtr [name="Complete"] with explicit button tag prefix added as primary
 */
export class SalesTablePage {
  readonly page: Page;

  // ── Sales Line Grid ────────────────────────────────────────────────────────
  /**
   * Sales line grid (ControlName: SalesLineGrid)
   * Fallback: project's proven [role="grid"][aria-label="Order lines"]
   */
  readonly salesLineGrid: Locator;

  /** "Item number" field in the grid (ControlName: SalesLine_ItemId, DataSource: SalesLine.ItemId) */
  readonly itemNumberField: Locator;

  /** "Quantity" field in the grid (ControlName: SalesLine_SalesQty, DataSource: SalesLine.SalesQty) */
  readonly quantityField: Locator;

  /** "Unit price" read-only field (ControlName: SalesLine_SalesPrice, DataSource: SalesLine.SalesPrice) */
  readonly unitPriceField: Locator;

  /** "Net amount" field (ControlName: SalesLine_LineAmount, DataSource: SalesLine.LineAmount) */
  readonly netAmountField: Locator;

  // ── Header Buttons ─────────────────────────────────────────────────────────
  /**
   * "Complete" button (ControlName: Complete)
   * Enriched: explicit button[name="Complete"] as primary (matches D365 stable name attr)
   */
  readonly completeButton: Locator;

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(page: Page) {
    this.page = page;

    // Enriched: axtr [name="SalesLineGrid"] + project fallback for the order lines grid
    this.salesLineGrid   = page.locator(
      '[name="SalesLineGrid"], [aria-label="Sales line grid"], [role="grid"][aria-label="Order lines"]'
    ).first();

    this.itemNumberField = page.locator('[name="SalesLine_ItemId"], input[aria-label="Item number"]').first();
    this.quantityField   = page.locator('[name="SalesLine_SalesQty"], input[aria-label="Quantity"]').first();
    this.unitPriceField  = page.locator('[name="SalesLine_SalesPrice"], input[aria-label="Unit price"]').first();
    this.netAmountField  = page.locator('[name="SalesLine_LineAmount"], input[aria-label="Net amount"]').first();

    // Enriched: button tag prefix as primary, axtr fallbacks retained
    this.completeButton  = page.locator(
      'button[name="Complete"], [name="Complete"], button[aria-label="Complete"]'
    ).first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Mark / select the active row in the sales line grid.
   */
  async markActiveRow(): Promise<void> {
    await this.salesLineGrid.click();
  }

  /**
   * Enter the item number in the active grid row.
   * @param itemNumber  e.g. "000000004"
   */
  async enterItemNumber(itemNumber: string): Promise<void> {
    await this.itemNumberField.fill(itemNumber);
    await this.itemNumberField.press('Tab');
  }

  /**
   * Enter the quantity in the active grid row.
   * @param quantity  e.g. "10.00"
   */
  async enterQuantity(quantity: string): Promise<void> {
    await this.quantityField.fill(quantity);
    await this.quantityField.press('Tab');
  }

  /**
   * Read the current value of the Quantity field.
   */
  async getQuantity(): Promise<string> {
    return (await this.quantityField.inputValue()).trim();
  }

  /**
   * Read the current value of the Unit price field.
   */
  async getUnitPrice(): Promise<string> {
    return (await this.unitPriceField.inputValue()).trim();
  }

  /**
   * Read the current value of the Net amount field.
   */
  async getNetAmount(): Promise<string> {
    return (await this.netAmountField.inputValue()).trim();
  }

  /**
   * Click the "Complete" button to open the Sales Order Recap dialog.
   */
  async clickComplete(): Promise<void> {
    await this.completeButton.click();
  }
}
