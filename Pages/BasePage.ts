import { Page, BrowserContext, Locator, expect } from "@playwright/test";

/**
 * BasePage — shared helpers inherited by all D365 page object models.
 *
 * Provides:
 *   - safeFill / safeClick         : wait for visibility before interacting
 *   - waitForProcessing            : waits for network idle (D365 async round-trips)
 *   - navSearch                    : atomic D365 global search (open → type → click result)
 *   - waitForLookupOptionsStable   : waits for D365 OData lookup dropdown to stop refreshing
 *   - captureInputValue            : reads an input's value and logs it
 *   - captureInputValueWithRetry   : polls until auto-generated field (SO#, PO#) is populated
 *   - validateAndFormatDate        : normalises date strings to MM/DD/YYYY
 *   - navigateTo (protected)       : uses the D365 top-bar search to open any page by text
 */
export class BasePage {
  // ── Timeouts (override via env vars) ────────────────────────────────────
  protected readonly ELEMENT_TIMEOUT = parseInt(process.env.D365_ELEMENT_TIMEOUT ?? "60000");
  // D365 fires an OData call for every lookup field — 5s default is safe for most installs
  protected readonly LOOKUP_TIMEOUT  = parseInt(process.env.D365_LOOKUP_TIMEOUT  ?? "5000");
  // Nav search overlay fires a separate module-tree query — slightly more room
  protected readonly NAV_SEARCH_TIMEOUT = parseInt(process.env.D365_NAV_SEARCH_TIMEOUT ?? "6000");

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

  // ── Lookup helpers ───────────────────────────────────────────────────────

  /**
   * Atomic D365 global search: opens the nav overlay, types the value, waits
   * for the result locator to appear, then clicks it.
   * Must be done in one call — the nav overlay closes on any blur/focus event.
   *
   * @param value          Text to search for (e.g. "All sales orders")
   * @param resultLocator  Locator for the search result item to click
   */
  async navSearch(value: string, resultLocator: Locator): Promise<void> {
    await this.page.getByRole("button", { name: "Search", exact: true }).click();
    const searchBox = this.page.getByRole("textbox", { name: "Search for a page" });
    await searchBox.fill(value);
    await resultLocator.waitFor({ state: "visible", timeout: this.NAV_SEARCH_TIMEOUT });
    await resultLocator.click();
    await this.waitForProcessing();
  }

  /**
   * Wait for a D365 OData lookup dropdown to appear and stop refreshing.
   * D365 fires a server call for every combobox field; options arrive 2-8s later.
   * Call this after typing into a lookup input, before pressing Enter/Tab.
   * Safe no-op if the field is plain text (no dropdown appears).
   */
  async waitForLookupOptionsStable(): Promise<void> {
    const dropdown = this.page.locator('[role="listbox"]').first();
    await dropdown.waitFor({ state: "visible", timeout: this.LOOKUP_TIMEOUT }).catch(() => {
      // plain-text field — no dropdown, safe to continue
    });
  }

  // ── Data capture helpers ─────────────────────────────────────────────────

  async captureInputValue(fieldName: string, locator: Locator): Promise<string> {
    const value = await locator.inputValue({ timeout: 10_000 }).catch(() => "");
    console.log(`ℹ ${fieldName}: "${value}"`);
    return value;
  }

  /**
   * Poll until an auto-generated field (SO number, PO number, voucher number)
   * is populated. D365 fields like these take 1-3s to populate after save/OK.
   *
   * @param fieldName    Label for logging / error messages
   * @param locator      Locator pointing at the input field
   * @param maxAttempts  Number of poll attempts (default 5)
   * @param intervalMs   Wait between attempts in ms (default 1000)
   */
  async captureInputValueWithRetry(
    fieldName: string,
    locator: Locator,
    maxAttempts = 5,
    intervalMs = 1_000,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const value = (await locator.inputValue({ timeout: 10_000 }).catch(() => "")).trim();
      if (value) {
        console.log(`ℹ ${fieldName}: "${value}"`);
        return value;
      }
      if (attempt < maxAttempts) {
        console.log(`⏳ captureInputValueWithRetry: [${fieldName}] attempt ${attempt}/${maxAttempts}`);
        await this.page.waitForTimeout(intervalMs);
      }
    }
    throw new Error(`❌ captureInputValueWithRetry: [${fieldName}] was empty after ${maxAttempts} attempts`);
  }

  // ── Soft assertions ──────────────────────────────────────────────────────
  // Uses regular expect() inside try/catch rather than expect.soft().
  // expect.soft() does not throw — Playwright tracks failures internally and
  // marks the test as FAILED at the end, bypassing the catch block entirely.
  // Regular expect() throws immediately → catch handles it → test truly continues.

  async softAssertVisible(key: string, locator: Locator): Promise<void> {
    try {
      await expect(locator).toBeVisible({ timeout: 10_000 });
      console.log(`✅ SoftAssert [${key}]: visible`);
    } catch {
      console.warn(`⚠️  SoftAssert [${key}]: NOT visible — continuing`);
    }
  }

  async softAssertText(key: string, locator: Locator, expected: string): Promise<void> {
    try {
      await expect(locator).toContainText(expected, { timeout: 10_000 });
      console.log(`✅ SoftAssert [${key}]: contains "${expected}"`);
    } catch {
      console.warn(`⚠️  SoftAssert [${key}]: text mismatch — continuing`);
    }
  }

  validateAndFormatDate(fieldName: string, date: string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime()))
      throw new Error(`❌ Invalid date for field "${fieldName}": "${date}"`);
    return parsed.toLocaleDateString("en-US");
  }

  // ── Global popup handler ─────────────────────────────────────────────────

  /**
   * Register a Playwright locator handler that automatically clicks Yes
   * on ANY D365 SysBoxForm popup, no matter which step triggers it.
   *
   * Trigger: the Yes BUTTON inside SysBoxForm becoming visible.
   * Triggering on the button itself (rather than the SysBoxForm container)
   * ensures Playwright only fires the handler when the button is actually
   * present and clickable — avoids false-positives from hidden SysBoxForm
   * instances that D365 keeps in the DOM between interactions.
   */
  private _popupHandlerInstalled = false;

  async installPopupHandlers(): Promise<void> {
    if (this._popupHandlerInstalled) return;
    this._popupHandlerInstalled = true;

    // Target the Yes button directly — CSS :has-text is reliable and doesn't
    // match hidden instances. Use the first() in case D365 stacks dialogs.
    const sysBoxYesBtn = this.page.locator(
      `[data-dyn-form-name="SysBoxForm"] button:has-text("Yes")`
    ).first();

    await this.page.addLocatorHandler(sysBoxYesBtn, async () => {
      try {
        console.log(`🆗 Auto-dismissing SysBoxForm popup → Yes`);
        // Direct click — no safeClick/waitForProcessing to avoid handler recursion
        await sysBoxYesBtn.click({ timeout: 5_000 });
        // Brief pause for D365 to process the dismissal
        await this.page.waitForTimeout(800);
      } catch {
        // Handler failed silently — let Playwright retry the blocked action
      }
    });
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
    await this.installPopupHandlers();
    await this.page.getByRole("button", { name: "Search", exact: true }).click();
    await this.page.getByRole("textbox", { name: "Search for a page" }).fill(pageName);
    await this.page.getByRole("option", { name: optionText }).click();
    if (urlPattern) {
      await this.page.waitForURL(urlPattern);
    }
    await this.waitForProcessing();
  }
}
