import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * AllocationWorkbenchPage — Inventory Allocation Exception Workbench in D365.
 *
 * Also covers order hold functionality on Sales Orders (Scenarios 95/96).
 *
 * Used by: tests/allocations.spec.ts
 * Scenarios: 95, 96, 110, 111, 112, 113, 114
 *
 * ─── HOW TO FIND LOCATORS ────────────────────────────────────────────────────
 * ALLOCATION WORKBENCH (Scenarios 110–112):
 * 1. Navigate: likely under Retail and Commerce > Inventory management
 *    or Warehouse management > Inquiries > Allocation exception workbench
 *    Search D365 for "allocation exception workbench" or "inventory allocation"
 * 2. The workbench is a grid showing items with allocation issues.
 * 3. Select a row → find "Reserve" and "Unreserve" buttons on the Action Pane.
 * 4. For moving an allocation (Scenario 112): find a "Move" or "Transfer" button.
 *
 * ORDER HOLDS (Scenarios 95/96):
 * 1. On the SO form, find the hold button — likely:
 *    Action Pane → "Sell" tab → "Order holds" or "Hold" button
 * 2. Hold types:
 *    - "Incomplete" hold: strips reservations
 *    - "Soft" hold: keeps reservations
 * 3. After applying hold, verify:
 *    - Reservation status on the SO line
 *    - That shipment builder won't process the order
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class AllocationWorkbenchPage extends BasePage {

  // ─── TODO: Locators — all need confirming against live D365 ───────────────

  // ─── Allocation workbench ─────────────────────────────────────────────────
  // TODO: Inspect the Allocation Exception Workbench page
  // readonly workbenchGrid: Locator = this.page.locator('[role="grid"][aria-label*="TODO_Workbench"]');
  // readonly reserveBtn: Locator = this.page.locator('button[name="TODO_ReserveBtn"]');
  // readonly unreserveBtn: Locator = this.page.locator('button[name="TODO_UnreserveBtn"]');
  // readonly moveBtn: Locator = this.page.locator('button[name="TODO_MoveBtn"]');
  // readonly itemNumberFilter: Locator = this.page.getByRole('combobox', { name: 'Item number' });

  // ─── Move allocation dialog ───────────────────────────────────────────────
  // TODO: Inspect the dialog that appears when moving an allocation
  // Scenario 112: Move allocation from one SO to another
  // readonly moveTargetSOInput: Locator = this.page.getByRole('textbox', { name: 'Sales order' });
  // readonly moveConfirmBtn: Locator = this.page.getByRole('button', { name: 'OK' });

  // ─── Order holds (used from SalesOrderPage context) ───────────────────────
  // TODO: On the SO form Action Pane, find the order hold button(s)
  // These may be on the "Sell" tab or a dedicated "Hold" section
  // readonly orderHoldsBtn: Locator = this.page.locator('button[name="TODO_OrderHolds"]');
  // readonly holdTypeCombo: Locator = this.page.getByRole('combobox', { name: 'Hold code' });
  // readonly applyHoldBtn: Locator = this.page.getByRole('button', { name: 'OK' });

  // ─── Reservation status (verification after hold) ─────────────────────────
  // TODO: On the SO Lines, check the reservation/allocation status
  // After incomplete hold: ALCPhysicallyAllocated should be 0
  // readonly reservationStatusField: Locator = this.page.locator('input[name="ALCPhysicallyAllocated"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the Inventory Allocation Exception Workbench.
   *
   * TODO: Confirm the exact navigation path.
   * Try searching: "allocation exception" or "inventory allocation workbench"
   */
  async navigateToWorkbench(): Promise<void> {
    // TODO: confirm search term and option text
    // await this.navigateTo('Inventory allocation exception workbench', 'TODO: confirm option text');
    console.warn('⚠ AllocationWorkbenchPage.navigateToWorkbench() — TODO: confirm navigation path');
    throw new Error('AllocationWorkbenchPage.navigateToWorkbench() not yet implemented');
  }

  /**
   * Search for an item in the allocation workbench.
   *
   * @param itemNumber  Item number to filter by (e.g. "243450-002")
   */
  async searchItem(itemNumber: string): Promise<void> {
    // TODO: implement — apply a filter on item number
    // await this.itemNumberFilter.fill(itemNumber);
    // await this.itemNumberFilter.press('Enter');
    // await this.page.waitForTimeout(500);
    console.warn('⚠ AllocationWorkbenchPage.searchItem() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.searchItem() not yet implemented');
  }

  /**
   * Select a row in the workbench for the given item.
   *
   * @param itemNumber  Item number to find and select
   */
  async selectItemRow(itemNumber: string): Promise<void> {
    // TODO: implement
    // await this.page.getByRole('row').filter({ hasText: itemNumber }).first().click();
    console.warn('⚠ AllocationWorkbenchPage.selectItemRow() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.selectItemRow() not yet implemented');
  }

  /**
   * Unreserve an item in the allocation exception workbench.
   *
   * Scenario 110: "Unreserve an item in the inventory allocation exception workbench."
   *
   * @param itemNumber  Item to unreserve
   */
  async unreserveItem(itemNumber: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.searchItem(itemNumber);
    // await this.selectItemRow(itemNumber);
    // await this.unreserveBtn.click();
    // await this.waitForProcessing();
    console.warn('⚠ AllocationWorkbenchPage.unreserveItem() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.unreserveItem() not yet implemented');
  }

  /**
   * Reserve an item in the allocation exception workbench.
   *
   * Scenario 111: "Reserve an item in the inventory allocation exception workbench."
   *
   * @param itemNumber  Item to reserve
   */
  async reserveItem(itemNumber: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.searchItem(itemNumber);
    // await this.selectItemRow(itemNumber);
    // await this.reserveBtn.click();
    // await this.waitForProcessing();
    console.warn('⚠ AllocationWorkbenchPage.reserveItem() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.reserveItem() not yet implemented');
  }

  /**
   * Move an allocation from one Sales Order to another.
   *
   * Scenario 112: "Manually move an allocation from one sales order to another."
   *
   * @param itemNumber    Item number to move allocation for
   * @param fromSONumber  Source SO number
   * @param toSONumber    Target SO number
   */
  async moveAllocation(itemNumber: string, fromSONumber: string, toSONumber: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // 1. Search for the item / from SO
    // 2. Select the row
    // 3. Click Move button
    // 4. In dialog, enter target SO number
    // 5. Confirm
    console.warn('⚠ AllocationWorkbenchPage.moveAllocation() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.moveAllocation() not yet implemented');
  }

  /**
   * Verify reservation status for an item (after reserve/unreserve action).
   *
   * @param itemNumber        Item number to check
   * @param expectedStatus    e.g. "Reserved", "Available"
   */
  async verifyReservationStatus(itemNumber: string, expectedStatus: string): Promise<void> {
    // TODO: implement — check the status column in the workbench for the item
    console.warn('⚠ AllocationWorkbenchPage.verifyReservationStatus() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.verifyReservationStatus() not yet implemented');
  }

  /**
   * Apply an order hold to the current Sales Order.
   *
   * Must be called while the SO form is open (after navigating to an SO).
   *
   * Scenario 95: Incomplete hold → reservations stripped.
   * Scenario 96: Soft hold → reservations kept.
   *
   * TODO: Steps to implement:
   *   1. On the SO Action Pane, find the hold button (check "Sell" tab)
   *   2. Click it → a dialog appears asking for hold code/type
   *   3. Select hold type: "Incomplete" or "Soft"
   *   4. Click OK/Apply
   *   5. Wait for processing
   *
   * @param holdType  e.g. "Incomplete", "Soft" (use actual D365 hold code values)
   */
  async applyOrderHold(holdType: string): Promise<void> {
    await this.page.getByRole("button", { name: "Order holds" }).click();
    await this.waitForProcessing();
    await this.page.waitForTimeout(500);

    const newBtn = this.page.getByRole("button", { name: "New" }).first();
    if (await newBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await newBtn.click();
      await this.page.waitForTimeout(300);
    }

    const holdCodeInput = this.page.getByRole("textbox", { name: "Hold code" }).first();
    await holdCodeInput.fill(holdType);
    await holdCodeInput.press("Tab");
    await this.page.waitForTimeout(500);

    const saveBtn = this.page.getByRole("button", { name: "Save" }).first();
    if (await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await saveBtn.click();
      await this.waitForProcessing();
    }

    await this.page.getByRole("button", { name: "Back" }).first().click();
    await this.waitForProcessing();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify that the physically allocated quantity on the SO line is zero.
   *
   * Scenario 95: After incomplete hold, "Ensure reservations are stripped."
   * Called while on the SO Lines tab.
   */
  async verifyReservationsStripped(): Promise<void> {
    // TODO: implement — check ALCPhysicallyAllocated = 0 on all lines
    // const availQtyInput = this.page.locator('input[name="ALCPhysicallyAllocated"]');
    // await expect(availQtyInput).toHaveValue('0', { timeout: 5_000 });
    console.warn('⚠ AllocationWorkbenchPage.verifyReservationsStripped() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.verifyReservationsStripped() not yet implemented');
  }

  /**
   * Verify that reservations are still intact on the SO line.
   *
   * Scenario 96: After soft hold, "The order should still be reserved."
   */
  async verifyReservationsIntact(): Promise<void> {
    // TODO: implement — ALCPhysicallyAllocated should be > 0
    // const availQtyInput = this.page.locator('input[name="ALCPhysicallyAllocated"]');
    // const val = await availQtyInput.inputValue();
    // if (parseFloat(val) <= 0) throw new Error('Expected reservations to be intact but found 0');
    console.warn('⚠ AllocationWorkbenchPage.verifyReservationsIntact() — TODO: not yet implemented');
    throw new Error('AllocationWorkbenchPage.verifyReservationsIntact() not yet implemented');
  }

  /**
   * Attempt to navigate to Shipment Builder and verify the held SO is rejected.
   *
   * Scenarios 95/96: "Ensure shipment cannot be created."
   *
   * This method navigates to Candidate for Shipping or Shipment Builder and
   * verifies the held SO does NOT appear or cannot be processed.
   *
   * @param soNumber  The SO number that should be blocked
   */
  async verifyShipmentCannotBeCreated(soNumber: string): Promise<void> {
    await this.navigateTo(
      "Shipment builder",
      "Shipment builder Retail and",
      "**/*rsmShipmentBuilder*",
    );

    const filter = this.page.getByRole("combobox", { name: "Filter" }).first();
    await filter.fill(soNumber);
    await filter.press("Enter");
    await this.page.waitForTimeout(1_500);

    const noData = this.page.getByText("We didn't find anything to show here.").first();
    if (await noData.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return;
    }

    const matchingRow = this.page.getByRole("row").filter({ hasText: soNumber }).first();
    await expect(matchingRow).not.toBeVisible({ timeout: 5_000 });
  }
}
