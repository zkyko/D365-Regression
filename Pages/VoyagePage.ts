import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class VoyagePage extends BasePage {

  // ─── navigation locators ──────────────────────────────────────────────────
  readonly navigationSearchBox: Locator = this.page.locator('input[aria-label="Search for a page"]');
  readonly allVoyagesResult: Locator = this.page.locator('#NavigationSearchBox_listbox_item0');

  // ─── create voyage form locators ──────────────────────────────────────────
  readonly newButton: Locator = this.page.locator('[data-dyn-controlname="NewButton"][name="NewButton"]');
  readonly shipDescriptionField: Locator = this.page.locator('[name="ITMTable_ShipDescription"]');
  readonly vesselIdField: Locator = this.page.locator('[name="ITMTable_ShipVesselId"]');
  readonly departureDateField: Locator = this.page.locator('[data-dyn-controlname="ITMTable_ITMDepartureDate"] input');
  readonly journeyIdField: Locator = this.page.locator('[name="ITMTable_ShipJourneyId"]');
  readonly okButton: Locator = this.page.locator('[data-dyn-controlname="OK"][name="OK"]');

  // ─── voyage editor locators ───────────────────────────────────────────────
  readonly daysAfterField: Locator = this.page.locator('[data-dyn-controlname="DaysAfterCtrl"]');
  readonly purchIdField: Locator = this.page.locator('[data-dyn-controlname="editPurchId"]');
  readonly generateDataButton: Locator = this.page.locator('[data-dyn-controlname="GenerateData"][name="GenerateData"]');

  // ─── bucket / container locators ──────────────────────────────────────────
  readonly addToBucketButton: Locator = this.page.locator('[data-dyn-controlname="AddToBucket"][name="AddToBucket"]');
  readonly addBucketContainerButton: Locator = this.page.locator('[data-dyn-controlname="AddBucketContainer"][name="AddBucketContainer"]');
  readonly transferQtyField: Locator = this.page.locator('input[aria-label="Transfer quantity"]');
  readonly addToNewContainersButton: Locator = this.page.locator('[data-dyn-controlname="AddToNewContainers"][name="AddToNewContainers"]');
  readonly containerIdField: Locator = this.page.locator('[name="ITMContainers_ShipContainerId"]');
  readonly containerShipDateField: Locator = this.page.locator('[data-dyn-controlname="ITMContainers_ShipDate"] input');
  readonly closeButton: Locator = this.page.locator('#ITMAddBucketContainer_11_SystemDefinedCloseButton');

  // ─── voyage search / filter locators ─────────────────────────────────────
  readonly voyageIdField: Locator = this.page.locator('[data-dyn-controlname="ITMTable_ShipId"]').first();
  readonly voyageFilterInput: Locator = this.page.locator('input[aria-label="Filter field: Voyage, operator: contains"]');
  readonly applyFiltersButton: Locator = this.page.locator('[data-dyn-controlname="ITMTable_ShipId_ApplyFilters"][name="ITMTable_ShipId_ApplyFilters"]');
  readonly headerTitle: Locator = this.page.locator('[data-dyn-controlname="HeaderTitle"]');

  // ─── in-transit locators ──────────────────────────────────────────────────
  readonly manageTab: Locator = this.page.locator('[data-dyn-form-name="ITMTable"] [data-dyn-controlname="Manage"]');
  readonly inTransitButton: Locator = this.page.locator('#ITMTable_17_ITMUpdate_InTransit');
  readonly voyageStatusField: Locator = this.page.locator('[data-dyn-controlname="Status_ShipStatusId"]');

  // ─── invoice locators ─────────────────────────────────────────────────────
  readonly containerLineShipContainerIdField: Locator = this.page.locator('input[aria-label="Shipping container"]');
  readonly generalTab: Locator = this.page.locator('[data-dyn-form-name="ITMContainers"] [data-dyn-controlname="General"]');
  readonly invoiceButton: Locator = this.page.locator('#ITMContainers_20_ITMPurchFormLetter_Invoice');
  readonly noButton: Locator = this.page.locator('[data-dyn-controlname="No"][name="No"]');
  readonly specQtyDropDialog: Locator = this.page.locator('[data-dyn-controlname="SpecQtyDropDialog"][name="SpecQtyDropDialog"]');
  readonly specQtyField: Locator = this.page.locator('[data-dyn-controlname="SpecQty"]');
  readonly invoiceNumberField: Locator = this.page.locator('[data-dyn-controlname="PurchParmTable_Num"]');
  readonly documentDateField: Locator = this.page.locator('[data-dyn-controlname="PurchParmTable_DocumentDate"] input');
  readonly invoiceHeaderTitle: Locator = this.page.locator('#ITMContainers_20_HeaderTitle');

  constructor(page: Page) {
    super(page, page.context());
  }

  // ─── navigate to voyages via search box ───────────────────────────────────
  async navigateToVoyages(): Promise<void> {
    await this.safeFill(this.navigationSearchBox, "All voyages");
    await this.navigationSearchBox.press("Enter");
    await this.waitForProcessing();
    await this.safeClick(this.allVoyagesResult);
    await this.waitForProcessing();
  }

  // ─── click new button ─────────────────────────────────────────────────────
  async clickNew(): Promise<void> {
    await this.safeClick(this.newButton);
    await this.waitForProcessing();
  }

  // ─── fill create voyage form — only fills fields present in data ──────────
  // User provides dates in ISO format YYYY-MM-DD in Excel
  // Framework converts to D365 environment format via D365_DATE_FORMAT in .env
  async fillCreateVoyageForm(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    if (data["shipDescription"]) {
      await this.safeFill(this.shipDescriptionField, data["shipDescription"].toString());
      await this.shipDescriptionField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["vesselId"]) {
      await this.safeFill(this.vesselIdField, data["vesselId"].toString());
      await this.vesselIdField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["departureDate"]) {
      const formatted = this.validateAndFormatDate("departureDate", data["departureDate"].toString());
      await this.safeFill(this.departureDateField, formatted);
      await this.departureDateField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["journeyId"]) {
      await this.safeFill(this.journeyIdField, data["journeyId"].toString());
      await this.journeyIdField.press("Tab");
      await this.waitForProcessing();
    }
  }

  // ─── click ok ─────────────────────────────────────────────────────────────
  async clickOk(): Promise<void> {
    await this.safeClick(this.okButton);
    await this.waitForProcessing();
  }

  // ─── fill voyage editor — only fills fields present in data ──────────────
  async fillVoyageEditor(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    if (data["daysAfter"]) {
      await this.safeFill(this.daysAfterField, data["daysAfter"].toString());
      await this.daysAfterField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["purchId"]) {
      await this.safeFill(this.purchIdField, data["purchId"].toString());
      await this.purchIdField.press("Tab");
      await this.waitForProcessing();
    }
  }

  // ─── click generate data ──────────────────────────────────────────────────
  async clickGenerateData(): Promise<void> {
    await this.safeClick(this.generateDataButton);
    await this.waitForProcessing();
  }

  // ─── add PO lines to bucket and create container ──────────────────────────
  // User provides containerShipDate in ISO format YYYY-MM-DD in Excel
  async addToContainer(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await this.safeClick(this.addToBucketButton);
    await this.waitForProcessing();
    await this.safeClick(this.addBucketContainerButton);
    await this.waitForProcessing();

    if (data["transferQty"]) {
      await this.safeFill(this.transferQtyField, data["transferQty"].toString());
      await this.transferQtyField.press("Tab");
      await this.waitForProcessing();
    }

    await this.safeClick(this.addToNewContainersButton);
    await this.waitForProcessing();

    if (data["containerId"]) {
      await this.safeFill(this.containerIdField, data["containerId"].toString());
      await this.containerIdField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["containerShipDate"]) {
      const formatted = this.validateAndFormatDate("containerShipDate", data["containerShipDate"].toString());
      await this.safeFill(this.containerShipDateField, formatted);
      await this.containerShipDateField.press("Tab");
      await this.waitForProcessing();
    }

    await this.safeClick(this.closeButton);
    await this.waitForProcessing();
  }

  // ─── search for voyage by ID in list filter ───────────────────────────────
  async searchVoyage(voyageId: string): Promise<void> {
    await this.safeClick(this.voyageIdField);
    await this.waitForProcessing();
    await this.safeFill(this.voyageFilterInput, voyageId);
    await this.voyageFilterInput.press("Tab");
    await this.waitForProcessing();
    await this.safeClick(this.applyFiltersButton);
    await this.waitForProcessing();
    await this.safeClick(this.headerTitle);
    await this.waitForProcessing();
  }

  // ─── assert voyage editor header shows expected voyage ID ─────────────────
  async assertVoyageEditorVisible(voyageId: string): Promise<void> {
    const voyageEditorHeader = this.page.locator(`span:has-text("Voyage editor : ${voyageId}")`);
    await voyageEditorHeader.waitFor({ state: "visible" });
  }

  // ─── update voyage status to in-transit ───────────────────────────────────
  async updateToInTransit(): Promise<void> {
    await this.safeClick(this.manageTab);
    await this.waitForProcessing();
    await this.safeClick(this.inTransitButton);
    await this.waitForProcessing();
    await this.voyageStatusField.waitFor({ state: "visible" });
  }

  // ─── post invoice for container ───────────────────────────────────────────
  // User provides documentDate in ISO format YYYY-MM-DD in Excel
  async postInvoice(
    data: Record<string, string | number | boolean | null>
  ): Promise<void> {
    if (data["containerShipContainerId"]) {
      await this.safeFill(this.containerLineShipContainerIdField, data["containerShipContainerId"].toString());
      await this.containerLineShipContainerIdField.press("Tab");
      await this.waitForProcessing();
    }

    await this.safeClick(this.generalTab);
    await this.waitForProcessing();
    await this.safeClick(this.invoiceButton);
    await this.waitForProcessing();

    // ─── dismiss update matching records confirmation ──────────────────────
    await this.safeClick(this.noButton);
    await this.waitForProcessing();

    // ─── select spec qty type from drop dialog ────────────────────────────
    await this.safeClick(this.specQtyDropDialog);
    await this.waitForProcessing();

    if (data["specQty"]) {
      await this.safeFill(this.specQtyField, data["specQty"].toString());
      await this.specQtyField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["invoiceNumber"]) {
      await this.safeFill(this.invoiceNumberField, data["invoiceNumber"].toString());
      await this.invoiceNumberField.press("Tab");
      await this.waitForProcessing();
    }
    if (data["documentDate"]) {
      const formatted = this.validateAndFormatDate("documentDate", data["documentDate"].toString());
      await this.safeFill(this.documentDateField, formatted);
      await this.documentDateField.press("Tab");
      await this.waitForProcessing();
    }

    await this.invoiceHeaderTitle.waitFor({ state: "visible" });
  }

  // ─── capture only fields D365 GENERATES — never capture input data fields ──
  async captureVoyageDetails(): Promise<string> {
    const voyageId = await this.captureInputValue("voyageId", this.voyageIdField);
    return voyageId;
  }

  // ─── log created voyage ───────────────────────────────────────────────────
  async logVoyageCreated(voyageId: string): Promise<void> {
    console.log(`✅ Voyage Created: ${voyageId}`);
  }
}