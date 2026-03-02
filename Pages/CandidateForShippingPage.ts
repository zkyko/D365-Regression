import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * CandidateForShippingPage — the "Candidate for shipping" batch-job dialog.
 *
 * Covers:
 *   - Navigating to the dialog
 *   - Filtering to a specific sales order and running the job
 */
export class CandidateForShippingPage extends BasePage {

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /** Open the Candidate for shipping dialog via the top-bar search. */
  async navigate(): Promise<void> {
    await this.navigateTo(
      "Candidate for shipping",
      "Candidate for shipping Retail",
    );
  }

  /**
   * Filter the batch job to a specific sales order and run it.
   *
   * Flow:
   *   Records to include → Filter → Field = "Sales order" → Criteria = SO#
   *   → OK (inner criteria dialog) → OK (main dialog, runs the job)
   */
  async filterBySalesOrder(salesOrderNumber: string): Promise<void> {
    // Expand the "Records to include" section
    await this.page.getByRole("button", { name: "Records to include" }).click();
    await this.page.waitForTimeout(300);

    // NOTE: the Filter button label has a leading space (icon + " Filter")
    await this.page.getByRole("button", { name: " Filter" }).click();
    await this.page.waitForTimeout(500);

    // Set Field = "Sales order"
    const fieldCombo = this.page.getByRole("combobox", { name: "Field" });
    await fieldCombo.fill("Sales order");
    await fieldCombo.press("Tab");
    await this.page.waitForTimeout(500);

    // Set Criteria = captured SO number
    const criteriaCombo = this.page.getByRole("combobox", { name: "Criteria" });
    await criteriaCombo.fill(salesOrderNumber);
    await criteriaCombo.press("Tab");
    await this.page.waitForTimeout(300);

    // OK — closes the inner filter criteria dialog
    await this.page.getByRole("button", { name: "OK" }).click();
    await this.page.waitForTimeout(300);

    // OK — runs the batch job on the main dialog
    await this.page.getByRole("button", { name: "OK" }).click();
    await this.waitForProcessing();
    await this.page.waitForTimeout(1_000);
  }
}
