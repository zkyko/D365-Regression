import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * GroupingPage — the "Grouping" batch-job dialog.
 *
 * Covers:
 *   - Navigating to the Grouping dialog
 *   - Running the job (OK)
 */
export class GroupingPage extends BasePage {

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /** Open the Grouping dialog via the top-bar search. */
  async navigate(): Promise<void> {
    await this.navigateTo("Grouping", "Grouping Retail and Commerce");
    await this.page.waitForTimeout(500);
  }

  /** Click OK to run the grouping job. Creates a GRP number for the batch of orders. */
  async run(): Promise<void> {
    await this.page.getByRole("button", { name: "OK" }).click();
    await this.waitForProcessing();
    await this.page.waitForTimeout(1_500);
  }
}
