import { test } from '@playwright/test';
import { readScenario2Data, readScenarioData } from '../utils/excel-reader';
import { SalesOrderListPage } from '../Pages/SalesOrderListPage';
import { SalesOrderPage } from '../Pages/SalesOrderPage';
import { MCROrderRecapPage } from '../Pages/MCROrderRecapPage';
import { CandidateForShippingPage } from '../Pages/CandidateForShippingPage';
import { GroupingPage } from '../Pages/GroupingPage';
import { ShipmentBuilderPage } from '../Pages/ShipmentBuilderPage';
import { ShipmentsPage } from '../Pages/ShipmentsPage';
import type { Locator, Page } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isYes(value: string): boolean {
  return /^(yes|y|true|1)$/i.test((value || '').trim());
}

async function waitForShellUnblocked(page: Page): Promise<void> {
  const blocker = page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
  const visible = await blocker.isVisible({ timeout: 2_000 }).catch(() => false);
  if (visible) {
    await blocker.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
  }
}

async function clickWhenUnblocked(page: Page, locator: Locator): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 8; attempt++) {
    await waitForShellUnblocked(page);
    try {
      await locator.click({ timeout: 8_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500 * attempt);
    }
  }
  throw lastError;
}

async function selectExistingCardOrFirst(page: Page, hint: string): Promise<boolean> {
  const hintRow = page.getByRole('row').filter({ hasText: hint }).first();
  if (await hintRow.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await hintRow.click();
    return true;
  }

  const anyCardRow = page
    .locator('[role="row"]')
    .filter({ has: page.locator('[role="gridcell"]') })
    .first();
  if (await anyCardRow.isVisible({ timeout: 8_000 }).catch(() => false)) {
    console.warn(`Card ending ${hint} not found; selecting first available saved card row.`);
    await anyCardRow.click();
    return true;
  }
  return false;
}

async function closeDialogByFormNameIfOpen(page: Page, formName: string): Promise<void> {
  const dialog = page.locator(`div[role="dialog"][data-dyn-form-name="${formName}"]`).first();
  if (!(await dialog.isVisible({ timeout: 1_500 }).catch(() => false))) return;

  const cancelOrClose = dialog.getByRole('button', { name: /Cancel|Close/i }).first();
  if (await cancelOrClose.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await waitForShellUnblocked(page);
    await cancelOrClose.click({ force: true }).catch(async () => {
      await page.keyboard.press('Escape').catch(() => {});
    });
  } else {
    await page.keyboard.press('Escape').catch(() => {});
  }

  await dialog.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
}

const testData = readScenario2Data('Scenario-2.xlsx');
const [scenario1Fallback] = readScenarioData('Scenario-1.xlsx');
if (!scenario1Fallback) {
  throw new Error('Scenario-1.xlsx must contain at least one row to provide fallback credit-card data.');
}

for (const [index, data] of testData.entries()) {
  test.describe(`Scenario 2 - Row ${index + 1} (Customer: ${data.CustomerAccount})`, () => {
    test(`Create SO (ship complete / LTO), ship, invoice [${data.CustomerAccount} / ${data.ItemNumber}]`, async ({ page }) => {
      test.setTimeout(10 * 60 * 1000);

      const soListPage = new SalesOrderListPage(page);
      const soPage = new SalesOrderPage(page);
      const mcrPage = new MCROrderRecapPage(page);
      const cfsPage = new CandidateForShippingPage(page);
      const grpPage = new GroupingPage(page);
      const sbPage = new ShipmentBuilderPage(page);
      const shipPage = new ShipmentsPage(page);

      await page.goto('/');
      await soListPage.navigate();
      await soListPage.clickNew();
      await soPage.fillNewOrderDialog(data.CustomerAccount, data.CustomerPO);
      await waitForShellUnblocked(page);

      // Sell tab: Order Source + Ship Complete
      await clickWhenUnblocked(page, page.getByRole('button', { name: 'Sell' }));
      await page.waitForTimeout(300);

      const orderSourceField = page.getByRole('combobox', { name: /Order Source|Order source/i }).first();
      if (await orderSourceField.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await orderSourceField.fill(data.OrderSource);
        await orderSourceField.press('Tab');
        await page.waitForTimeout(300);
      }

      const shipCompleteSwitch = page.getByRole('switch', { name: /Ship complete/i }).first();
      if (await shipCompleteSwitch.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const targetYes = isYes(data.ShipComplete);
        const currentYes = (await shipCompleteSwitch.getAttribute('aria-checked')) === 'true';
        if (targetYes !== currentYes) {
          await shipCompleteSwitch.click();
          await page.waitForTimeout(300);
        }
      } else {
        const shipCompleteCombo = page.getByRole('combobox', { name: /Ship complete/i }).first();
        if (await shipCompleteCombo.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await shipCompleteCombo.fill(data.ShipComplete);
          await shipCompleteCombo.press('Tab');
          await page.waitForTimeout(300);
        }
      }

      await soPage.goToLinesTab();
      await soPage.enterItemNumber(data.ItemNumber);
      await soPage.setShipType(data.ShipType);
      let salesOrderNumber = await soPage.captureSalesOrderNumber();

      const mcrSubmitBtn = await soPage.clickComplete();

      // Payments: select existing credit card
      await mcrPage.ensurePaymentsExpanded();
      await page.locator('button[name="AddBtn"]').click();
      await page.waitForLoadState('networkidle');

      const cardHint = (data.ExistingCC || '').replace(/\D/g, '').slice(-4) || data.ExistingCC;
      const selectedSavedCard = await selectExistingCardOrFirst(page, cardHint);
      if (selectedSavedCard) {
        await page.getByRole('button', { name: 'OK' }).click();
        await page.waitForLoadState('networkidle');
      } else {
        console.warn(`No saved card rows found for hint ${cardHint}; adding card via Scenario 1 fallback data.`);
        await closeDialogByFormNameIfOpen(page, 'MCRCustPaymDialog');
        await mcrPage.addCreditCard({
          name: scenario1Fallback.CC_Name,
          number: scenario1Fallback.CC_Number,
          cvv: scenario1Fallback.CC_CVV,
          expMonth: scenario1Fallback.CC_ExpMonth,
          expYear: scenario1Fallback.CC_ExpYear,
          zip: scenario1Fallback.CC_Zip,
          address: scenario1Fallback.CC_Address,
        });
      }

      await mcrPage.submit(mcrSubmitBtn);
      await closeDialogByFormNameIfOpen(page, 'MCRSalesOrderRecap');
      await waitForShellUnblocked(page);

      salesOrderNumber = (await soPage.captureSalesOrderNumber()) || salesOrderNumber;
      if (!salesOrderNumber) {
        throw new Error('Could not capture Sales Order number after MCR submit.');
      }

      // Re-open the SO from list to ensure we are in the main Sales order form context.
      await soListPage.navigate();
      await page.waitForLoadState('networkidle');

      // D365 Quick Filter requires real keyboard events; pressSequentially fires them correctly.
      const filterCombo = page.getByRole('combobox', { name: 'Filter' }).first();
      if (await filterCombo.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await filterCombo.click();
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
        await filterCombo.pressSequentially(salesOrderNumber, { delay: 60 });
        await page.waitForTimeout(400);
        await filterCombo.press('Enter');
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(2_000);
      }

      // Wait for the specific SO's textbox to appear in the grid before clicking.
      const soTextboxInGrid = page.getByRole('textbox', { name: 'Sales order' })
        .filter({ hasText: new RegExp(`^${escapeRegExp(salesOrderNumber)}$`) }).first();
      if (await soTextboxInGrid.isVisible({ timeout: 15_000 }).catch(() => false)) {
        await soTextboxInGrid.click();
      } else {
        const soLinkInList = page.getByRole('link', { name: new RegExp(escapeRegExp(salesOrderNumber)) }).first();
        if (await soLinkInList.isVisible({ timeout: 8_000 }).catch(() => false)) {
          await soLinkInList.click();
        } else {
          const soGridCell = page.locator('[role="gridcell"]').filter({ hasText: new RegExp(`^${escapeRegExp(salesOrderNumber)}$`) }).first();
          await soGridCell.click({ timeout: 20_000 });
        }
      }
      await page.waitForLoadState('networkidle');

      await soPage.goToLinesTab();
      await soPage.reserveAllSubLines(data.ItemNumber, 0);

      await soPage.confirmNow();
      await soPage.viewOrderConfirmation();

      // Candidate for shipping: run for this SO only
      await cfsPage.navigate();
      await cfsPage.filterBySalesOrder(salesOrderNumber);

      await grpPage.navigate();
      await grpPage.run();

      await sbPage.navigate();
      const grpNumber = await sbPage.selectGrpRow(data.CustomerAccount);
      await sbPage.createShipment();
      await sbPage.verifyKoerberStatus(data.ExpectedKoerberStatus);

      // Click Sales order link back to SO
      const soLinkByText = page.getByRole('link', { name: new RegExp(escapeRegExp(salesOrderNumber)) }).first();
      if (await soLinkByText.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await soLinkByText.click();
      } else {
        await page.locator('[data-dyn-controlname*="SalesId"] a').first().click();
      }
      await page.waitForLoadState('networkidle');

      await shipPage.pickAndPack();
      await shipPage.postPackingSlip();
      await shipPage.invoice();

      await soPage.verifyDocumentStatus(data.ExpectedDocumentStatus);

      console.log(
        `Scenario 2 Row ${index + 1} completed end-to-end: SO ${salesOrderNumber}, GRP ${grpNumber}`,
      );
    });
  });
}
