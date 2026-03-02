import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SalesOrderListPage — "All Sales Orders" list page.
 *
 * Covers:
 *   - Navigating to the All Sales Orders list
 *   - Clicking the New button to start a new Sales Order
 */
export class SalesOrderListPage extends BasePage {

  // ─── locators ─────────────────────────────────────────────────────────────
  readonly newButton: Locator = this.page.locator('button[name="SystemDefinedNewButton"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /** Navigate to the All Sales Orders list page via the top-bar search. */
  async navigate(): Promise<void> {
    await this.navigateTo(
      "All sales orders",
      "All sales orders Accounts",
      "**/*SalesTableListPage*",
    );
  }

  /** Click the New button to open the new sales order creation dialog. */
  async clickNew(): Promise<void> {
    await this.safeClick(this.newButton);
    await this.waitForProcessing();
  }
}
