import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for MCRCustomerService form
 * Corresponds to: Retail and Commerce > Customers > Customer service
 * AOT Form: MCRCustomerService
 *
 * Navigation: uses BasePage.navigateTo() (D365 top-bar search bar)
 * — same pattern as CandidateForShippingPage, ShipmentBuilderPage, etc.
 */
export class CustomerServicePage extends BasePage {

  // ── Selectors ──────────────────────────────────────────────────────────────
  /** "Search by" combo-box (ControlName: CustSearchType) */
  readonly searchByDropdown: Locator;

  /** Search text input (ControlName: SearchText) */
  readonly searchTextField: Locator;

  /** "Search" button (ControlName: CustSearch) */
  readonly searchButton: Locator;

  /** "Customer account" read-only field (ControlName: CustTable_AccountNum) */
  readonly customerAccountField: Locator;

  /** "New sales order" button (ControlName: CreateOrder) */
  readonly newSalesOrderButton: Locator;

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(page: Page) {
    super(page, page.context());

    this.searchByDropdown      = page.locator('[name="CustSearchType"], select[aria-label="Search by"]').first();
    this.searchTextField       = page.locator('[name="SearchText"], input[aria-label="SearchText"]').first();
    this.searchButton          = page.locator('[name="CustSearch"], button[aria-label="Search"]').first();
    this.customerAccountField  = page.locator('[name="CustTable_AccountNum"], input[aria-label="Customer account"]').first();
    this.newSalesOrderButton   = page.locator('[name="CreateOrder"], button[aria-label="New sales order"]').first();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  /**
   * Navigate to Customer service using the D365 top-bar search bar.
   * Follows the same pattern as all other POMs in this project.
   *
   * optionText "Customer service Retail" is a partial match of the full
   * autocomplete label (e.g. "Customer service | Retail and Commerce > Customers")
   * — consistent with "Candidate for shipping Retail", "Shipment builder Retail and", etc.
   */
  async navigate(): Promise<void> {
    await this.navigateTo(
      'Customer service',
      'Customer service Retail',
      '**/*MCRCustomerService*',
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Select the "Search by" option.
   *
   * CustSearchType is a D365 combobox (input[role="combobox"]), NOT a <select>.
   * When optionValue is "0" the default "Keyword" is already active — skip.
   * For any other index, open the dropdown and pick the Nth option.
   *
   * @param optionValue  Enum index as string (e.g. "0" = Keyword default)
   */
  async selectSearchBy(optionValue: string): Promise<void> {
    // "0" = default "Keyword" — already selected on page load, nothing to do
    if (optionValue === '0') return;

    // Open the listbox and click the option at the given index
    await this.searchByDropdown.click();
    await this.page.waitForTimeout(300);
    const listId = await this.searchByDropdown.getAttribute('aria-controls');
    if (listId) {
      const opts = this.page.locator(`#${listId} [role="option"]`);
      await opts.nth(parseInt(optionValue, 10)).click();
    }
  }

  /**
   * Type a customer search string, click Search, then select the first result
   * row in the results grid so the customer account field populates and the
   * "New sales order" button becomes enabled.
   * @param searchText  e.g. "CUST000015"
   */
  async searchCustomer(searchText: string): Promise<void> {
    await this.searchTextField.fill(searchText);
    await this.searchButton.click();
    await this.waitForProcessing();

    // Select the first row in the search results grid so a customer is chosen.
    // D365 uses a fixed-data-table grid — click the first body row.
    const firstResultRow = this.page
      .locator('[name="CustGrid"] [role="row"]:has([role="gridcell"])')
      .first()
      .or(this.page.locator('.public_fixedDataTable_bodyRow').first());

    await firstResultRow.waitFor({ state: 'visible', timeout: 15_000 });
    await firstResultRow.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Read the customer account value displayed after the search.
   */
  async getCustomerAccount(): Promise<string> {
    return (await this.customerAccountField.inputValue()).trim();
  }

  /**
   * Click "New sales order" to open the Sales Table form.
   */
  async clickNewSalesOrder(): Promise<void> {
    await this.newSalesOrderButton.click();
  }
}
