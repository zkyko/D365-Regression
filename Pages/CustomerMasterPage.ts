import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * CustomerMasterPage — Customer account maintenance in D365.
 *
 * Used by: tests/customer-master.spec.ts
 * Scenarios: 56, 57
 *
 * ─── HOW TO FIND LOCATORS ────────────────────────────────────────────────────
 * 1. Navigate: Accounts receivable > Customers > All customers
 *    OR: Sales and marketing > Customers > All customers
 * 2. Search for a customer account number and open the customer form.
 * 3. The customer form has tabs: General, Credit and collections, Payment defaults, etc.
 * 4. Scenario 56 fields:
 *    - "Charges group" — likely on the Payment defaults or General tab
 *    - "Account status" — may be "Customer stop" or a Hold field
 *    - "AE/SS" — not a standard D365 field, likely a custom field. Inspect to find.
 * 5. Scenario 57 fields:
 *    - "Payment method" / "Method of payment" — on Payment defaults tab
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class CustomerMasterPage extends BasePage {

  // ─── TODO: Locators — all need confirming against live D365 ───────────────

  // ─── Customer search / filter ─────────────────────────────────────────────
  // TODO: On the All Customers list, find the search/filter input
  // readonly customerSearchInput: Locator = this.page.getByRole('combobox', { name: 'Filter' });

  // ─── Charges group (Scenario 56) ─────────────────────────────────────────
  // TODO: On customer form → find "Charges group" field
  // Likely under: Action Pane → Edit → then on a tab
  // readonly chargesGroupCombo: Locator = this.page.getByRole('combobox', { name: 'Charges group' });

  // ─── Account status / Customer hold (Scenario 56) ─────────────────────────
  // TODO: Find account status field — may be "Customer stop" on the Credit tab
  // readonly accountStatusCombo: Locator = this.page.getByRole('combobox', { name: 'Customer stop' });

  // ─── AE/SS field (Scenario 56) ────────────────────────────────────────────
  // TODO: "AE/SS" is likely a custom D365 field. Inspect the customer form to find it.
  // May be an abbreviation for "Account Executive / Sales Support" assignment
  // readonly aeSSInput: Locator = this.page.locator('input[name="TODO_AESS"]');

  // ─── Payment method (Scenario 57) ─────────────────────────────────────────
  // TODO: Find "Method of payment" field on customer form → Payment defaults tab
  // readonly paymentMethodCombo: Locator = this.page.getByRole('combobox', { name: 'Method of payment' });

  // ─── Save button ──────────────────────────────────────────────────────────
  // TODO: Standard D365 save — may be the same button as other pages
  // readonly saveBtn: Locator = this.page.getByRole('button', { name: 'Save' });

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── Methods ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the All Customers list page.
   *
   * TODO: Confirm search term and result option text.
   */
  async navigate(): Promise<void> {
    // TODO: confirm option text — may be "Customers All customers" or "All customers Accounts receivable"
    // await this.navigateTo('All customers', 'All customers Accounts receivable');
    console.warn('⚠ CustomerMasterPage.navigate() — TODO: confirm navigation path');
    throw new Error('CustomerMasterPage.navigate() not yet implemented');
  }

  /**
   * Search for and open a customer account.
   *
   * @param accountNumber  Customer account number (e.g. "100012")
   */
  async openCustomer(accountNumber: string): Promise<void> {
    // TODO: implement — filter the list and click the matching row
    // await this.customerSearchInput.fill(accountNumber);
    // await this.customerSearchInput.press('Enter');
    // await this.page.waitForTimeout(500);
    // await this.page.getByRole('row').filter({ hasText: accountNumber }).first().click();
    // await this.waitForProcessing();
    console.warn('⚠ CustomerMasterPage.openCustomer() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.openCustomer() not yet implemented');
  }

  /**
   * Change the charges group on the customer account.
   *
   * Scenario 56: "Modify the customer account (change charges group, ...)."
   *
   * @param newChargesGroup  The new charges group value
   */
  async changeChargesGroup(newChargesGroup: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.chargesGroupCombo.fill(newChargesGroup);
    // await this.chargesGroupCombo.press('Tab');
    console.warn('⚠ CustomerMasterPage.changeChargesGroup() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.changeChargesGroup() not yet implemented');
  }

  /**
   * Change the account status on the customer account.
   *
   * Scenario 56: "change ... account status ..."
   *
   * @param newStatus  e.g. "No", "Invoice", "All" (D365 "Customer stop" values)
   */
  async changeAccountStatus(newStatus: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.accountStatusCombo.fill(newStatus);
    // await this.accountStatusCombo.press('Tab');
    console.warn('⚠ CustomerMasterPage.changeAccountStatus() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.changeAccountStatus() not yet implemented');
  }

  /**
   * Update the AE/SS (Account Executive / Sales Support) field.
   *
   * Scenario 56: "change ... AE/SS ..."
   * NOTE: This is likely a custom field. Inspect the customer form to find it.
   *
   * @param value  New AE/SS value
   */
  async changeAESS(value: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await this.aeSSInput.fill(value);
    // await this.aeSSInput.press('Tab');
    console.warn('⚠ CustomerMasterPage.changeAESS() — TODO: custom field, inspect customer form');
    throw new Error('CustomerMasterPage.changeAESS() not yet implemented');
  }

  /**
   * Update the payment method on the customer account.
   *
   * Scenario 57: "Update the payment method on a customer account."
   *
   * @param newPaymentMethod  e.g. "CHECK", "CREDITCARD", "NET30"
   */
  async updatePaymentMethod(newPaymentMethod: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // May need to click "Payment defaults" tab first
    // await this.page.getByText('Payment defaults').click();
    // await this.paymentMethodCombo.fill(newPaymentMethod);
    // await this.paymentMethodCombo.press('Tab');
    console.warn('⚠ CustomerMasterPage.updatePaymentMethod() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.updatePaymentMethod() not yet implemented');
  }

  /**
   * Save changes to the customer record.
   */
  async save(): Promise<void> {
    // TODO: implement — standard save pattern
    // await this.saveBtn.click();
    // await this.waitForProcessing();
    console.warn('⚠ CustomerMasterPage.save() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.save() not yet implemented');
  }

  /**
   * Verify the current payment method on the customer account.
   *
   * Scenario 57: "verify transaction processing."
   *
   * @param expectedMethod  Expected method of payment value
   */
  async verifyPaymentMethod(expectedMethod: string): Promise<void> {
    // TODO: implement after locators are confirmed
    // await expect(this.paymentMethodCombo).toHaveValue(expectedMethod, { timeout: 5_000 });
    console.warn('⚠ CustomerMasterPage.verifyPaymentMethod() — TODO: not yet implemented');
    throw new Error('CustomerMasterPage.verifyPaymentMethod() not yet implemented');
  }
}
