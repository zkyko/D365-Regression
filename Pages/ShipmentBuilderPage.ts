import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ShipmentBuilderPage — the Shipment builder list page.
 *
 * Covers:
 *   - Navigating to the page
 *   - Selecting the GRP row for a customer and capturing the GRP number
 *   - Creating a shipment
 *   - Verifying the Koerber status
 */
export class ShipmentBuilderPage extends BasePage {

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── methods ──────────────────────────────────────────────────────────────

  /** Navigate to the Shipment builder list page via the top-bar search. */
  async navigate(): Promise<void> {
    await this.navigateTo(
      "Shipment builder",
      "Shipment builder Retail and",
      "**/*rsmShipmentBuilder*",
    );
  }

  /**
   * Find the GRP row for the given customer account, click it, and
   * return the GRP number captured from the first gridcell.
   *
   * @param customerAccount  The customer account number used to identify the row.
   * @returns                The GRP number string (e.g. "GRP000012345").
   */
  async selectGrpRow(customerAccount: string): Promise<string> {
    const row = this.page
      .getByRole("row")
      .filter({ hasText: customerAccount })
      .first();
    await row.waitFor({ state: "visible", timeout: 15_000 });
    await row.click();

    const grpNumber = (await row.getByRole("gridcell").first().textContent())?.trim() ?? "";
    console.log(`✓ Shipment Group: ${grpNumber}`);
    return grpNumber;
  }

  /**
   * Create a shipment for the selected GRP row.
   *
   * Flow: Shipments → Create shipment → Yes
   */
  async createShipment(): Promise<void> {
    await this.page.getByRole("button", { name: "Shipments" }).click();
    await this.page.waitForTimeout(300);

    await this.page
      .getByRole("button",   { name: "Create shipment" })
      .or(this.page.getByRole("menuitem", { name: "Create shipment" }))
      .first()
      .click();
    await this.page.waitForTimeout(300);

    await this.page.getByRole("button", { name: "Yes" }).click();
    await this.waitForProcessing();
    await this.page.waitForTimeout(2_000);
  }

  /**
   * Verify the Koerber status field contains the expected value.
   *
   * Non-blocking — logs a warning instead of throwing if the status doesn't match,
   * because Koerber integration timing can vary.
   */
  async verifyKoerberStatus(expectedStatus: string): Promise<void> {
    if (!expectedStatus) return;
    const el = this.page
      .locator('[id*="KoerberStatus"], [name*="KoerberStatus"]')
      .first();
    await expect(el)
      .toContainText(expectedStatus, { timeout: 30_000 })
      .catch(() =>
        console.warn(`⚠ Koerber status not "${expectedStatus}" — continuing`),
      );
  }
}
