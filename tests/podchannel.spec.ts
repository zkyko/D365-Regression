import { test, expect } from "../fixtures/pageFixtures";
import { loadTestData, writeOutput, printSummary, finalizeRun } from "../utils/testUtils";
import { scanRowCount } from "../utils/dataLoader";
import { getFlowConfig } from "../config/flows.config";

// --- entity type -- must match data-input folder name (PascalCase) -----------
const ENTITY_TYPE = "PODchannel";
const INPUT_FILE  = "PODchannel_Input_TestData.xlsx";
const OUTPUT_FILE = "PODchannel_Output_TestData.xlsx";
const FLOW        = getFlowConfig(ENTITY_TYPE);
const ROW_COUNT   = scanRowCount(ENTITY_TYPE, INPUT_FILE);
const results: { status: string }[] = [];

// ─── guard: if Excel has no rows, fail visibly rather than silently ────────
// Without this, ROW_COUNT=0 means the for-loop never runs, Playwright
// reports "0 tests" with exit code 0, and CI goes green with nothing tested.
if (ROW_COUNT === 0) {
  test(`[SETUP REQUIRED] ${ENTITY_TYPE} — fill Input Excel before running`, async () => {
    throw new Error(
      `No test data rows found in: test-data/data-input/${ENTITY_TYPE}/${INPUT_FILE}\n` +
      `Open the Excel file, add at least one data row, and re-run.\n` +
      `If this is a first run, the converter created the file — you need to fill it in.`
    );
  });
}

test.use({ entityType: ENTITY_TYPE });
// D365 flows involve multiple form fills, lookup waits, and document creation—
// 120s is not sufficient for a 8-12 field form on loaded UAT/Prod D365 instances.
// 300s (5 min) is the production-safe default. Override via .env TEST_TIMEOUT.
test.setTimeout(parseInt(process.env.TEST_TIMEOUT ?? "300000"));

// --- parallel or serial -- controlled via .env TEST_MODE ---------------------
test.describe.configure({
  mode: (process.env.TEST_MODE ?? "serial") as "serial" | "parallel",
});

test.describe(`${FLOW.displayName} ${FLOW.tags.join(" ")}`, () => {

  // --- load test data once ---------------------------------------------------
  test.beforeAll(async () => {
    await loadTestData(INPUT_FILE);
    console.log(`\n[OK] Test data loaded for [${ENTITY_TYPE}]`);
  });

  // --- write output Excel after all tests -----------------------------------
  test.afterAll(async () => {
    await writeOutput(ENTITY_TYPE, OUTPUT_FILE);
    printSummary(ENTITY_TYPE, results);
    finalizeRun(ENTITY_TYPE);
  });

  // --- one test per data row ------------------------------------------------
  // Add rows to Input Excel -> more tests run automatically. No code change needed.
  for (let row = 1; row <= ROW_COUNT; row++) {
    test(
      `[TC-${String(row).padStart(3, "0")}] ${FLOW.displayName}`,
      { tag: FLOW.tags, annotation: { type: "entityType", description: ENTITY_TYPE } },
      async ({ pODchannelPage, testRow, completeTest }) => {

        let status: "completed" | "failed" = "failed";
        let capturedError: unknown;

        try {

          await test.step("Navigate to D365 base URL", async () => {
            await pODchannelPage.navigateToBase();
            await pODchannelPage.isLoaded();
          });

          await test.step("Fill SearchBox", async () => {
            await pODchannelPage.fillSearchBox(String(testRow.data["searchBox"] ?? `all sales orders`));
          });

          await test.step("Click NewButton", async () => {
            await pODchannelPage.clickNewButton();
          });

          await test.step("Fill CustAccount", async () => {
            await pODchannelPage.fillCustAccount(String(testRow.data["custAccount"] ?? `167505`));
          });

          await test.step("Click RsmDelayPayment", async () => {
            await pODchannelPage.clickRsmDelayPayment();
          });

          await test.step("Click ShippingDateRequested", async () => {
            await pODchannelPage.clickShippingDateRequested();
          });

          await test.step("Fill ShippingDateRequested", async () => {
            await pODchannelPage.fillShippingDateRequested(String(testRow.data["shippingDateRequested"] ?? `5/1/2026`));
          });

          await test.step("Click OK", async () => {
            await pODchannelPage.clickOK();
          });

          await test.step("Assert headerTitle", async () => {
            await pODchannelPage.assertHeaderTitleVisible();
          });

          await test.step("Fill ItemId", async () => {
            await pODchannelPage.fillItemId(String(testRow.data["itemId"] ?? `248878-001`));
          });

          await test.step("Click Div1773346990910", async () => {
            await pODchannelPage.clickDiv1773346990910();
          });

          await test.step("Fill SalesQty", async () => {
            await pODchannelPage.fillSalesQty(String(testRow.data["salesQty"] ?? `25`));
          });

          await test.step("Click HeaderViewHeader", async () => {
            await pODchannelPage.clickHeaderViewHeader();
          });

          await test.step("Fill RsmHeaderShipmentWindowRsmShippingStartDate", async () => {
            await pODchannelPage.fillRsmHeaderShipmentWindowRsmShippingStartDate(String(testRow.data["rsmHeaderShipmentWindowRsmShippingStartDate"] ?? `5/1/2026`));
          });

          await test.step("Fill RsmHeaderShipmentWindowRsmShippingEndDate", async () => {
            await pODchannelPage.fillRsmHeaderShipmentWindowRsmShippingEndDate(String(testRow.data["rsmHeaderShipmentWindowRsmShippingEndDate"] ?? ``));
          });

          await test.step("Click Yes", async () => {
            await pODchannelPage.clickYes();
          });

          await test.step("Fill RsmHeaderShipmentWindowRsmShippingEndDate", async () => {
            await pODchannelPage.fillRsmHeaderShipmentWindowRsmShippingEndDate2(String(testRow.data["rsmHeaderShipmentWindowRsmShippingEndDate"] ?? `5/11/2026`));
          });

          await test.step("Click Complete", async () => {
            await pODchannelPage.clickComplete();
          });

          await test.step("Click Yes", async () => {
            await pODchannelPage.clickYes2();
          });

          await test.step("Click AddBtn", async () => {
            await pODchannelPage.clickAddBtn();
          });

          await test.step("Fill IdentificationTenderTypeId", async () => {
            await pODchannelPage.fillIdentificationTenderTypeId(String(testRow.data["identificationTenderTypeId"] ?? `3`));
          });

          await test.step("Click OKButton", async () => {
            await pODchannelPage.clickOKButton();
          });

          await test.step("Click SubmitButton", async () => {
            await pODchannelPage.clickSubmitButton();
          });

          await test.step("Click SalesOrder", async () => {
            await pODchannelPage.clickSalesOrder();
          });

          await test.step("Click ButtonCreateDropShipment", async () => {
            await pODchannelPage.clickButtonCreateDropShipment();
          });

          await test.step("Click Rect1773347247383", async () => {
            await pODchannelPage.clickRect1773347247383();
          });

          await test.step("Click CommandButtonOK", async () => {
            await pODchannelPage.clickCommandButtonOK();
          });

          await test.step("Click General", async () => {
            await pODchannelPage.clickGeneral();
          });

          await test.step("Click ButtonReferences", async () => {
            await pODchannelPage.clickButtonReferences();
          });

          await test.step("Assert purchId", async () => {
            await pODchannelPage.assertPurchIdVisible();
          });

          await test.step("Click OkButton", async () => {
            await pODchannelPage.clickOkButton();
          });

          await test.step("Click ButtonPurchTable", async () => {
            await pODchannelPage.clickButtonPurchTable();
          });

          await test.step("Assert headerTitle", async () => {
            await pODchannelPage.assertHeaderTitleVisible();
          });

          await test.step("Check for D365 errors", async () => {
            await pODchannelPage.checkForD365Errors();
          });

          status = "completed";

        } catch (error) {
          status = "failed";
          capturedError = error;
          throw error;

        } finally {
          // results.push MUST come first — completeTest can throw (e.g. page closed
          // after test) and would prevent the push, making Summary always show Total: 0.
          results.push({ status });
          await completeTest(status, {
            ...pODchannelPage.getCollectedResults(),
          }, capturedError).catch((e: unknown) => {
            console.warn(`⚠️  completeTest error (non-fatal): ${(e as Error)?.message ?? e}`);
          });
        }
      },
    );
  }
});
