import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ShipmentsPage — the Shipments list/detail page.
 *
 * Covers:
 *   - Navigating to Shipments
 *   - Filtering by GRP number and selecting a shipment
 *   - Pick and pack flow  (Picking list registration → Update all → Close)
 *   - Post packing slip
 *   - Invoice
 */
export class ShipmentsPage extends BasePage {

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /** Navigate to the Shipments list page via the top-bar search. */
  async navigate(): Promise<void> {
    await this.navigateTo("Shipments", "Shipments Retail and Commerce");
  }

  /**
   * Filter shipments by GRP number and click the matching row.
   *
   * @param grpNumber       GRP number returned by ShipmentBuilderPage.selectGrpRow().
   * @param customerAccount Fallback filter text if grpNumber is empty.
   */
  async filterAndSelect(grpNumber: string, customerAccount: string): Promise<void> {
    if (grpNumber) {
      const filterCombo = this.page.getByRole("combobox", { name: "Filter" });
      await filterCombo.fill(grpNumber);
      await filterCombo.press("Enter");
      await this.page.waitForTimeout(1_000);
    }

    await this.page
      .getByRole("row")
      .filter({ hasText: grpNumber || customerAccount })
      .first()
      .click();
  }

  /**
   * Run the full pick and pack flow:
   *   Pick and pack → Picking list registration
   *   → check all Select checkboxes
   *   → Updates → Update all → Close
   */
  async pickAndPack(): Promise<void> {
    await this.page.getByRole("button", { name: "Pick and pack" }).click();
    await this.page.waitForTimeout(300);

    // "Picking list registration" can appear as a button or as a dropdown menuitem
    await this.page
      .getByRole("button",   { name: "Picking list registration" })
      .or(this.page.getByRole("menuitem", { name: "Picking list registration" }))
      .first()
      .click();
    await this.waitForProcessing();

    // Check all row checkboxes
    const checkboxes = this.page.getByRole("checkbox", { name: "Select" });
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      await checkboxes.nth(i).check().catch(() => {});
    }

    await this.page.getByRole("button", { name: "Updates" }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole("menuitem", { name: "Update all" }).click();
    await this.waitForProcessing();

    await this.page.getByRole("button", { name: "Close" }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Post the packing slip.
   *
   * Flow: Post packing slip → OK → OK
   */
  async postPackingSlip(): Promise<void> {
    await this.page.getByRole("button", { name: "Post packing slip" }).click();
    await this.waitForProcessing();

    await this.page.getByRole("button", { name: "OK" }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole("button", { name: "OK" }).click();
    await this.waitForProcessing();
  }

  /**
   * Post the invoice.
   *
   * Flow: Invoice → Invoice (button or menuitem) → OK → OK
   */
  async invoice(): Promise<void> {
    await this.page.getByRole("button", { name: "Invoice" }).click();
    await this.page.waitForTimeout(300);

    // "Invoice" can appear as a top-level button or as a dropdown menuitem
    await this.page
      .getByRole("button",   { name: "Invoice" })
      .or(this.page.getByRole("menuitem", { name: "Invoice" }))
      .first()
      .click();
    await this.waitForProcessing();

    await this.page.getByRole("button", { name: "OK" }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole("button", { name: "OK" }).click();
    await this.waitForProcessing();
  }
}
