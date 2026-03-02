import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * PricingPage — price overrides, reason codes, coupons, and pricing validation
 * on the Sales Order form and any dedicated pricing pages in D365.
 *
 * Used by: tests/pricing.spec.ts
 * Scenarios: 11, 55, 98–108
 *
 * ─── HOW TO FIND LOCATORS ────────────────────────────────────────────────────
 * Most pricing actions happen ON the Sales Order form (SO Lines tab).
 * 1. Open any confirmed Sales Order in D365.
 * 2. On the Lines tab, right-click a unit price field → Inspect.
 *    Look for name= attribute (e.g. name="SalesPrice" or similar).
 * 3. For price override: try editing the unit price field directly — a reason
 *    code dialog may pop up. Inspect that dialog's combobox + OK button.
 * 4. For coupons: on the SO form, look in the Action Pane under "Sell" or
 *    "Price and discount" tab for a coupon/discount button.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class PricingPage extends BasePage {

  // ─── TODO: Locators — all need confirming against live D365 ───────────────

  // Unit price field on SO Lines grid (the editable cell)
  // TODO: Right-click the price cell on any SO line → Inspect → find name attr
  // readonly unitPriceInput: Locator = this.page.locator('input[name="SalesPrice"]');

  // Reason code dialog — appears when you override a price on a confirmed SO
  // TODO: Inspect the dialog that appears after price edit
  // readonly reasonCodeCombo: Locator = this.page.getByRole('combobox', { name: 'Reason code' });
  // readonly reasonCodeOKBtn: Locator = this.page.getByRole('button', { name: 'OK' });

  // Coupon/discount button on SO Action Pane
  // TODO: Check "Sell" tab or "Price and discount" section in action pane
  // readonly addCouponBtn: Locator = this.page.locator('button[name="TODO_CouponButton"]');
  // readonly couponCodeInput: Locator = this.page.getByRole('textbox', { name: 'Coupon code' });

  // Price list / document pricing fields
  // TODO: On the Header tab, look for "Price list" or "Trade agreement" fields
  // readonly priceListField: Locator = this.page.locator('input[name="TODO_PriceList"]');

  // Discount amount / percentage fields on SO line
  // TODO: Inspect the SO Lines grid for discount fields
  // readonly lineDiscountField: Locator = this.page.locator('input[name="TODO_LineDiscount"]');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Override the unit price on a specific SO line.
   *
   * Scenario 55: Override price → reason code prompt must appear.
   *
   * TODO: Steps to implement:
   *   1. Click the row at lineIndex in the Order Lines grid
   *   2. Click into the unit price field (may need double-click to enter edit mode)
   *   3. Clear the current value and type newPrice
   *   4. Press Tab to trigger validation — reason code dialog should appear
   *   5. Verify the dialog is visible (used by verifyReasonCodePrompt())
   *
   * @param lineIndex  0-based row index in the Order Lines grid
   * @param newPrice   New price string (e.g. "250.00")
   */
  async overrideLinePrice(lineIndex: number, newPrice: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    // await dataRows.nth(lineIndex).click();
    // await this.page.waitForTimeout(300);
    // const priceCell = dataRows.nth(lineIndex).locator('input[name="SalesPrice"]');
    // await priceCell.dblclick();
    // await priceCell.fill(newPrice);
    // await priceCell.press('Tab');
    // await this.page.waitForTimeout(500);
    console.warn('⚠ PricingPage.overrideLinePrice() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.overrideLinePrice() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Verify that the reason code dialog appeared after a price override.
   *
   * Scenario 55: "Ensure the reason code prompt appears."
   *
   * TODO: Inspect the dialog that pops up:
   *   - It likely has a combobox labelled "Reason code" or "Price override reason"
   *   - May also have a text field for a note/comment
   *   - Verify the dialog title or a specific field is visible
   */
  async verifyReasonCodePrompt(): Promise<void> {
    // TODO: implement after locators are confirmed
    // await expect(this.reasonCodeCombo).toBeVisible({ timeout: 5_000 });
    console.warn('⚠ PricingPage.verifyReasonCodePrompt() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.verifyReasonCodePrompt() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Select a reason code in the reason code dialog and confirm.
   *
   * @param reasonCode  The reason code value to select (e.g. "PROMO")
   */
  async enterReasonCode(reasonCode: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.reasonCodeCombo.fill(reasonCode);
    // await this.reasonCodeCombo.press('Tab');
    // await this.reasonCodeOKBtn.click();
    // await this.waitForProcessing();
    console.warn('⚠ PricingPage.enterReasonCode() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.enterReasonCode() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Assert the unit price on the specified SO line matches expected value.
   *
   * Scenario 11: Verify pricing is correct.
   *
   * @param lineIndex     0-based row index
   * @param expectedPrice e.g. "299.99"
   */
  async verifyLinePrice(lineIndex: number, expectedPrice: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // const dataRows = this.page.locator('[role="grid"][aria-label="Order lines"] [role="row"]:has([role="gridcell"])');
    // const priceCell = dataRows.nth(lineIndex).locator('input[name="SalesPrice"]');
    // await expect(priceCell).toHaveValue(expectedPrice, { timeout: 5_000 });
    console.warn('⚠ PricingPage.verifyLinePrice() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.verifyLinePrice() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Add a coupon code to the sales order.
   *
   * Scenarios 98–101, 108: Web orders with MSA coupons, LTO + coupon, etc.
   *
   * TODO: Find the coupon entry point:
   *   - Check the "Sell" tab on the SO Action Pane
   *   - Or look for a "Discounts" / "Coupons" button
   *   - The coupon dialog likely has a text field + OK button
   *
   * @param couponCode  Coupon code string (e.g. "MSA10")
   */
  async addCoupon(couponCode: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.addCouponBtn.click();
    // await this.page.waitForTimeout(300);
    // await this.couponCodeInput.fill(couponCode);
    // await this.page.getByRole('button', { name: 'OK' }).click();
    // await this.waitForProcessing();
    console.warn('⚠ PricingPage.addCoupon() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.addCoupon() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Verify a coupon has been applied to the order (check discount/coupon field).
   *
   * @param couponCode  The coupon code expected to appear on the order
   */
  async verifyCouponApplied(couponCode: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // Find wherever applied coupons show (may be on Header tab or in a Discounts section)
    // await expect(this.page.getByText(couponCode)).toBeVisible({ timeout: 5_000 });
    console.warn('⚠ PricingPage.verifyCouponApplied() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.verifyCouponApplied() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Verify the price list applied to the order matches the expected value.
   *
   * Scenario 107: Moving customer up a tier → pricing updates on new orders.
   *
   * @param expectedPriceList  e.g. "Tier 2 Price List"
   */
  async verifyPriceList(expectedPriceList: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // Usually on the Header tab of the SO form
    // await expect(this.priceListField).toHaveValue(expectedPriceList, { timeout: 5_000 });
    console.warn('⚠ PricingPage.verifyPriceList() — TODO: locators not yet confirmed');
    throw new Error('PricingPage.verifyPriceList() not yet implemented — see TODO in Pages/PricingPage.ts');
  }

  /**
   * Navigate to the Customer Loyalty Tiers page and update a customer's tier.
   *
   * Scenarios 105, 107: Loyalty batch job, tier changes.
   *
   * TODO: Find the navigation path for customer loyalty tiers in D365.
   * Likely under: Retail and Commerce > Customers > Loyalty > Customer loyalty
   *
   * @param customerAccount  Customer account number
   * @param newTier          New tier name/value
   */
  async updateCustomerLoyaltyTier(customerAccount: string, newTier: string): Promise<void> {
    // TODO: implement after navigation path and locators are confirmed
    // await this.navigateTo('Customer loyalty', 'Customer loyalty Retail and Commerce');
    // Find the customer row, click, change tier...
    console.warn('⚠ PricingPage.updateCustomerLoyaltyTier() — TODO: not yet implemented');
    throw new Error('PricingPage.updateCustomerLoyaltyTier() not yet implemented — see TODO in Pages/PricingPage.ts');
  }
}
