import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * NavigationPage — helpers for navigating D365 via the left-side navigation pane.
 *
 * Use this when you need to click through Modules → Module → Sub-menu → Page,
 * instead of the top-bar search shortcut provided by BasePage.navigateTo().
 *
 * Most specs should prefer BasePage.navigateTo() (search-bar approach) for speed.
 * Use NavigationPage when the test specifically validates the nav-pane path or
 * when the search-bar option name is ambiguous.
 */
export class NavigationPage extends BasePage {
  private readonly expandNavButton: Locator;
  private readonly modulesTreeItem: Locator;

  constructor(page: Page) {
    super(page, page.context());
    this.expandNavButton = page.getByRole('button', { name: 'Expand the navigation pane' });
    this.modulesTreeItem = page.getByRole('treeitem', { name: 'Modules' });
  }

  // ── Open the navigation sidebar ───────────────────────────────────────────

  async openNavigation(): Promise<void> {
    if (await this.expandNavButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.expandNavButton.click();
      await this.page.waitForTimeout(800);
    }
    if (await this.modulesTreeItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.modulesTreeItem.click();
      await this.page.waitForTimeout(500);
    }
  }

  async expandNavigationMenu(): Promise<void> {
    await this.openNavigation();
  }

  // ── Navigate to a top-level module ────────────────────────────────────────

  async navigateToModule(moduleName: string): Promise<void> {
    await this.openNavigation();
    await this.page.waitForTimeout(500);
    const moduleLink = this.page.getByRole('link', { name: moduleName, exact: true })
      .or(this.page.getByRole('treeitem', { name: moduleName, exact: true }));
    await moduleLink.click({ timeout: 15_000 });
    await this.waitForProcessing();
  }

  // ── Navigate to a module + sub-menu item ──────────────────────────────────

  /**
   * Navigates via the left nav pane to moduleName → subItemName.
   *
   * @param moduleName  Top-level module (e.g. "Landed cost", "Sales and marketing")
   * @param subItemName Final menu item to click (e.g. "All voyages", "All sales orders")
   * @param parentMenuName Optional intermediate sub-menu to expand first
   *                       (e.g. "Sales orders" before "All sales orders")
   */
  async navigateViaMenu(
    moduleName: string,
    subItemName: string,
    parentMenuName?: string,
  ): Promise<void> {
    await this.openNavigation();

    const moduleItem = this.page.getByRole('treeitem', { name: moduleName, exact: true });
    await moduleItem.waitFor({ state: 'visible', timeout: 10_000 });
    await moduleItem.click();
    await this.page.waitForTimeout(500);

    if (parentMenuName) {
      const parentItem = this.page.getByRole('treeitem', { name: parentMenuName, exact: true });
      if (await parentItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await parentItem.click();
        await this.page.waitForTimeout(500);
      }
    }

    const subLink = this.page.getByRole('link', { name: subItemName, exact: true });
    await subLink.waitFor({ state: 'visible', timeout: 10_000 });
    await subLink.click();
    await this.waitForProcessing();
  }
}
