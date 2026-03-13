import { Page, BrowserContext, Locator } from "@playwright/test";

/**
 * BasePage — shared helpers inherited by all D365 page object models.
 *
 * Provides:
 *   - safeFill / safeClick  : wait for visibility before interacting
 *   - waitForProcessing     : waits for network idle (D365 async round-trips)
 *   - captureInputValue     : reads an input's value and logs it
 *   - validateAndFormatDate : normalises date strings to MM/DD/YYYY
 *   - navigateTo (protected): uses the D365 top-bar search to open any page
 */
export class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly context: BrowserContext,
  ) {}

  // ── Interaction helpers ──────────────────────────────────────────────────

  async safeFill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: "visible" });
    await locator.fill(value);
  }

  async safeClick(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible" });
    // Move mouse away first to dismiss any D365 qtip super-tooltip that may
    // be blocking pointer events over the target element.
    await this.page.mouse.move(0, 0);
    await locator.click();
  }

  async waitForProcessing(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /** Wait for D365's global loading overlay to clear, then click. Retries up to 8 times. */
  async clickWhenUnblocked(locator: Locator): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 8; attempt++) {
      const shellBlocker = this.page.locator('#ShellBlockingDiv.applicationShell-blockingMessage');
      if (await shellBlocker.isVisible({ timeout: 1_500 }).catch(() => false)) {
        await shellBlocker.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
      }
      try {
        await locator.click({ timeout: 8_000 });
        return;
      } catch (error) {
        lastError = error;
        await this.page.waitForTimeout(300 * attempt);
      }
    }
    throw lastError;
  }

  // ── Data capture helpers ─────────────────────────────────────────────────

  async captureInputValue(fieldName: string, locator: Locator): Promise<string> {
    const value = await locator.inputValue({ timeout: 10_000 }).catch(() => "");
    console.log(`ℹ ${fieldName}: "${value}"`);
    return value;
  }

  validateAndFormatDate(fieldName: string, date: string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime()))
      throw new Error(`❌ Invalid date for field "${fieldName}": "${date}"`);
    return parsed.toLocaleDateString("en-US");
  }

  // ── Navigation helper ────────────────────────────────────────────────────

  /**
   * Open a D365 page via the top-bar search box.
   *
   * @param pageName   Text to type into the search box  (e.g. "All sales orders")
   * @param optionText Accessible name of the autocomplete option to click
   * @param urlPattern Optional URL glob to wait for after the option is clicked
   */
  protected async navigateTo(
    pageName: string,
    optionText: string,
    urlPattern?: string,
  ): Promise<void> {
    await this.page.getByRole("button", { name: "Search", exact: true }).click();
    await this.page.getByRole("textbox", { name: "Search for a page" }).fill(pageName);
    await this.page.getByRole("option", { name: optionText }).click();
    if (urlPattern) {
      await this.page.waitForURL(urlPattern);
    }
    await this.waitForProcessing();
  }
}
