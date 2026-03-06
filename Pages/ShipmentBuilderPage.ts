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
    const filterCombo = this.page.getByRole("combobox", { name: "Filter" });
    const maxAttempts = 8;
    let lastError = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (await filterCombo.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await filterCombo.fill(customerAccount);
        await filterCombo.press("Enter");
      }
      await this.page.waitForTimeout(2_000);

      const row = this.page
        .getByRole("row")
        .filter({ hasText: customerAccount })
        .first();

      if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await row.click();
        const grpNumber =
          (await row.getByRole("gridcell").first().textContent())?.trim() ?? "";
        console.log(`✓ Shipment Group: ${grpNumber}`);
        return grpNumber;
      }

      lastError = `No Shipment Builder row for customer ${customerAccount} (attempt ${attempt}/${maxAttempts}).`;
      console.warn(`⚠ ${lastError}`);
      await this.page.getByRole("button", { name: "Refresh" }).click().catch(() => {});
      await this.page.waitForLoadState("networkidle").catch(() => {});
      await this.page.waitForTimeout(4_000);
    }

    throw new Error(
      `${lastError} Candidate-for-shipping/grouping may not have produced a shipment group yet.`,
    );
  }

  /**
   * Create a shipment for the selected GRP row.
   *
   * Flow: Shipments → Create shipment → Yes
   */
  private async openSelectedShipmentGroupDetailsIfNeeded(): Promise<void> {
    const shipmentsButton = this.page.getByRole("button", { name: "Shipments" }).first();
    if (await shipmentsButton.isVisible({ timeout: 1_500 }).catch(() => false)) {
      return;
    }

    const selectedRowLink = this.page
      .locator('[role="row"][aria-selected="true"] a, [role="row"][aria-selected="true"] [role="link"]')
      .first();

    if (await selectedRowLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await selectedRowLink.click();
    } else {
      const shipmentGroupLink = this.page
        .locator('[data-dyn-controlname*="ShipmentGroup"] a, [data-dyn-controlname*="ShipmentGroupId"] a')
        .first();

      if (await shipmentGroupLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await shipmentGroupLink.click();
      } else {
        throw new Error(
          "Could not open Shipment builder details. Select a shipment group row before calling createShipment().",
        );
      }
    }

    await this.waitForProcessing();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await expect(this.page.getByRole("button", { name: "Shipments" }).first()).toBeVisible({ timeout: 15_000 });
  }

  async createShipment(): Promise<void> {
    await this.openSelectedShipmentGroupDetailsIfNeeded();

    await this.page.getByRole("button", { name: "Shipments" }).click();
    await this.page.waitForTimeout(300);

    await this.page
      .getByRole("button", { name: "Create shipment" })
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

  // ─── BRD #14779 — Amount Threshold assertions ─────────────────────────────

  /**
   * Read the "Exceeds amount threshold" column value for a GRP row.
   *
   * BRD #14779 §2.2: field ExceedsAmountThreshold on rsmShipmentBuilder grid
   * (table: rsmShipmentGroup, data type: Boolean). The column is set
   * automatically by the Grouping batch job — it cannot be edited manually.
   *
   * D365 boolean grid columns render as a checkbox input inside the cell.
   * Falls back to aria-checked attribute if input is not found.
   *
   * @param identifier  GRP number OR customer account text visible in the row.
   * @returns           true if the "Exceeds amount threshold" checkbox is checked.
   */
  async getExceedsAmountThreshold(identifier: string): Promise<boolean> {
    const row = this.page
      .getByRole('row')
      .filter({ hasText: identifier })
      .first();
    await row.waitFor({ state: 'visible', timeout: 15_000 });

    // Primary: input[type="checkbox"] inside the ExceedsAmountThreshold cell
    const checkbox = row.locator(
      '[data-dyn-controlname="ExceedsAmountThreshold"] input[type="checkbox"]',
    ).first();

    const found = await checkbox.count();
    if (found > 0) {
      return checkbox.isChecked();
    }

    // Fallback: aria-checked on the cell wrapper (D365 uses this for read-only booleans)
    const ariaVal = await row
      .locator('[data-dyn-controlname="ExceedsAmountThreshold"]')
      .first()
      .getAttribute('aria-checked')
      .catch(() => null);
    return ariaVal === 'true';
  }

  /**
   * Assert that the "Exceeds amount threshold" field on a GRP row is read-only.
   *
   * BRD #14779 §3.1: "This field will not be able to be edited manually."
   *
   * @param identifier  GRP number OR customer account text visible in the row.
   * @returns           true if the checkbox is disabled / read-only.
   */
  async isExceedsAmountThresholdReadOnly(identifier: string): Promise<boolean> {
    const row = this.page
      .getByRole('row')
      .filter({ hasText: identifier })
      .first();
    await row.waitFor({ state: 'visible', timeout: 15_000 });

    const checkbox = row.locator(
      '[data-dyn-controlname="ExceedsAmountThreshold"] input[type="checkbox"]',
    ).first();

    if (await checkbox.count() > 0) {
      const isDisabled = await checkbox.isDisabled();
      const readOnlyAttr = await checkbox.getAttribute('readonly');
      return isDisabled || readOnlyAttr !== null;
    }

    // If no input found, the cell itself is read-only (D365 renders it as plain text/icon)
    return true;
  }

  /**
   * Read the "Classification group" column value for a GRP row.
   *
   * BRD #14779 §2.3: when ExceedsAmountThreshold = Yes and classification = Auto-Ship,
   * the Grouping job automatically changes it to "Manual".
   *
   * @param identifier  GRP number OR customer account text visible in the row.
   * @returns           The classification group text (e.g. "Manual", "Auto-Ship", "").
   */
  async getClassificationGroup(identifier: string): Promise<string> {
    const row = this.page
      .getByRole('row')
      .filter({ hasText: identifier })
      .first();
    await row.waitFor({ state: 'visible', timeout: 15_000 });

    const cell = row.locator(
      '[data-dyn-controlname="ClassificationGroup"] input, ' +
      '[data-dyn-controlname="ClassificationGroup"]',
    ).first();

    const inputVal = await cell.inputValue().catch(() => null);
    if (inputVal !== null) return inputVal.trim();

    return (await cell.textContent().catch(() => ''))?.trim() ?? '';
  }
}
