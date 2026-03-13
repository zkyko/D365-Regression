import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * VoyageCreateDialog — the "Create voyage" modal that opens when you click New
 * on the All Voyages list.
 *
 * Module path:  Landed cost → Voyages → All voyages → New
 */
export class VoyageCreateDialog extends BasePage {
  readonly descriptionInput: Locator;
  readonly vesselInput: Locator;
  readonly journeyTemplateInput: Locator;
  readonly okButton: Locator;

  constructor(page: Page) {
    super(page, page.context());
    this.descriptionInput      = page.locator('input[id$="ShipDescription_input"]');
    this.vesselInput           = page.locator('input[id$="ShipVesselId_input"]');
    this.journeyTemplateInput  = page.locator('input[id$="ShipJourneyId_input"]');
    this.okButton              = page.locator('button[id$="OK"]').first();
  }

  /**
   * Fills the voyage creation form.
   *
   * @param description Free-text voyage description (must be unique — e.g. include a timestamp)
   * @param vesselId    Vessel ID as configured in D365 (e.g. 'A VESSEL')
   * @param journeyId   Journey template ID (e.g. 'ART STUDIO-AUS'); optional
   */
  async fillForm(description: string, vesselId: string, journeyId?: string): Promise<void> {
    await this.safeFill(this.descriptionInput, description);

    await this.vesselInput.click();
    await this.vesselInput.fill(vesselId);
    await this.vesselInput.press('Tab');
    await this.page.waitForTimeout(500);

    if (journeyId) {
      await this.journeyTemplateInput.click();
      await this.journeyTemplateInput.fill(journeyId);
      await this.journeyTemplateInput.press('Tab');
      await this.page.waitForTimeout(500);
    }
  }

  async clickOk(): Promise<void> {
    await this.waitForProcessing();
    await this.safeClick(this.okButton);
    await this.waitForProcessing();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * VoyageListPage — All Voyages grid.
 *
 * Module path:  Landed cost → Voyages → All voyages
 */
export class VoyageListPage extends BasePage {
  readonly newButton: Locator;
  readonly grid: Locator;

  constructor(page: Page) {
    super(page, page.context());
    this.newButton = page
      .locator('button[id*="NewButton"]')
      .filter({ hasText: 'New' })
      .first();
    this.grid = page.locator('.public_fixedDataTable_main');
  }

  async navigate(): Promise<void> {
    await this.navigateTo(
      'All voyages',
      'All voyages Landed cost',
      '**/*ITMLVoyageTable*',
    );
  }

  async isLoaded(): Promise<boolean> {
    await this.waitForProcessing();
    await this.grid.waitFor({ state: 'visible', timeout: 15_000 });
    return this.grid.isVisible();
  }

  /** Clicks New and returns the filled-in create dialog. */
  async startCreateVoyage(): Promise<VoyageCreateDialog> {
    await this.safeClick(this.newButton);
    const dialog = new VoyageCreateDialog(this.page);
    await dialog.descriptionInput.waitFor({ state: 'visible', timeout: 15_000 });
    return dialog;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * VoyageEditorPage — the Voyage detail / editor form shown after creation.
 *
 * Covers: Add to staging, View staging list, container creation.
 */
export class VoyageEditorPage extends BasePage {
  readonly pageHeader: Locator;
  readonly addToStagingButton: Locator;
  readonly viewStagingButton: Locator;
  readonly selectRowCheckbox: Locator;
  readonly addToNewContainerButton: Locator;
  readonly shippingContainerInput: Locator;
  readonly containerOkButton: Locator;

  constructor(page: Page) {
    super(page, page.context());
    this.pageHeader              = page.locator('.group_title');
    this.addToStagingButton      = page.locator('button[id$="AddToBucket"]');
    this.viewStagingButton       = page.locator('button[id$="AddBucketContainer"]');
    this.selectRowCheckbox       = page.locator('input[id^="LineGrid_Selected_"]').first();
    this.addToNewContainerButton = page.locator('button[id$="AddToNewContainers"]');
    this.shippingContainerInput  = page.locator('input[id$="ShippingContainerId_input"]');
    this.containerOkButton       = page.locator('button[id$="OK"]').first();
  }

  async isLoaded(): Promise<boolean> {
    await this.waitForProcessing();
    await this.addToStagingButton.waitFor({ state: 'visible', timeout: 20_000 });
    return this.addToStagingButton.isVisible();
  }

  async clickAddToStaging(): Promise<void> {
    await this.waitForProcessing();
    await this.safeClick(this.addToStagingButton);
  }

  async clickViewStagingList(): Promise<void> {
    await this.waitForProcessing();
    await this.safeClick(this.viewStagingButton);
    await this.waitForProcessing();
  }

  /**
   * Selects the first staging-list row and adds it to a new shipping container.
   *
   * @throws Error if no staging-list rows exist (prerequisite POs missing) or if
   *         the "Add to new shipping container" button is disabled.
   */
  async createContainer(containerId: string): Promise<void> {
    await this.waitForProcessing();

    await this.selectRowCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
    await this.selectRowCheckbox.click();

    if (!await this.addToNewContainerButton.isEnabled()) {
      throw new Error('"Add to new shipping container" button is disabled — no eligible staging rows.');
    }

    await this.safeClick(this.addToNewContainerButton);
    await this.shippingContainerInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.shippingContainerInput.fill(containerId);
    await this.safeClick(this.containerOkButton);
    await this.waitForProcessing();
  }
}
