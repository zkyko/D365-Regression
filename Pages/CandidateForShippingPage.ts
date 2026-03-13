
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.js';


export class CandidateForShippingPage extends (BasePage as any) {
    page: Page;

    constructor(page: Page) {
        super(page);
        this.page = page;
    }

    async waitForProcessing(timeout = 10000) {
        const processingLocators = [
            this.page.getByText("Please wait. We're processing your request."),
            this.page.getByText("Working on it..."),
            this.page.locator('.waitingImage')
        ];
        await Promise.all(
            processingLocators.map(loc =>
                loc.waitFor({ state: 'hidden', timeout }).catch(() => { })
            )
        );
    }

    // Only candidate-for-shipping-specific actions below

    async searchCandidateForShipping() {
        console.log('Searching for Candidate for Shipping page...');

        await this.dismissLightboxOverlay();

        // Step 1: Click the search button
        const searchButton = this.page.locator('//div[@id="NavigationSearch"]//span[@class="button-commandRing Find-symbol"]').first();
        await searchButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.dismissLightboxOverlay();
        await searchButton.click();
        console.log('Clicked on search button (Find-symbol)');
        await this.page.waitForTimeout(500);

        // Step 2: In the search box, enter text
        const searchInput = this.page.locator('[aria-label="Search for a page"]').first();
        await searchInput.waitFor({ state: 'visible', timeout: 10000 });
        try {
            await searchInput.click();
        } catch {
            await this.dismissLightboxOverlay();
            await searchInput.click({ force: true });
        }
        await searchInput.fill('candidate for shipping');
        console.log('Entered search text: candidate for shipping');
        await this.page.waitForTimeout(2000); // Wait for search results to appear

        // Step 3: Click the first option with the correct title
        const candidateOption = this.page.locator('[title="Candidate for shipping"]').first();
        await candidateOption.waitFor({ state: 'visible', timeout: 10000 });
        await candidateOption.click();
        console.log('Clicked on Candidate for shipping option');

        // Wait for the page to load
        await this.waitForProcessing();
        await this.page.waitForTimeout(3000); // Wait for page to load
        console.log('Navigated to Candidate for Shipping page');
    }

    async filterCandidateForShipping(criteria: string) {
        console.log(`Filtering Candidate for Shipping with criteria: ${criteria}`);
        await this.waitForProcessing();
        await this.page.waitForTimeout(2000);

        await this.dismissLightboxOverlay();

        // Step 1: Click "Records to include" button
        const recordsToInclude = this.page.locator('[aria-label="Records to include"]').first();
        await recordsToInclude.waitFor({ state: 'visible', timeout: 10000 });
        await recordsToInclude.click();
        console.log('Clicked on Records to include');
        await this.page.waitForTimeout(1000);

        // Step 2: Click Filter button
        const filterButton = this.page.locator("//span[contains(text(),'Filter')]").first();
        await filterButton.waitFor({ state: 'visible', timeout: 10000 });
        await filterButton.click();
        console.log('Clicked on Filter button');

        await this.waitForProcessing();
        await this.page.waitForTimeout(2000); // Wait for filter dialog to load
        console.log('Filter dialog loaded');

        // Step 3: In the dialog, select the second RangeValue input, clear, and enter today's date in M/D/YYYY
        const dateInput = this.page.locator('(//div[@data-dyn-controlname="RangeValue"]//input[@class="dyn-field _tqmjor"])[2]');
        await dateInput.waitFor({ state: 'visible', timeout: 10000 });
        await dateInput.click();
        await dateInput.clear();
        // Get today's date in M/D/YYYY format
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const year = today.getFullYear();
        const formattedDate = `${month}/${day}/${year}`;
        await dateInput.fill(formattedDate);
        console.log(`Entered date: ${formattedDate}`);
        await this.page.waitForTimeout(1000);

        // Step 4: Click OK button in filter dialog
        const okButton1 = this.page.locator('//span[contains(@aria-describedby,"OkButton_helptext")]').first();
        await okButton1.waitFor({ state: 'visible', timeout: 10000 });
        await okButton1.click();
        console.log('Clicked first OK button (OkButton_helptext)');
        await this.page.waitForTimeout(1500);

        // Step 5: Click second OK button in dialog
        const okButton2 = this.page.locator('//span[contains(@aria-describedby,"CommandButton_helptext")]').first();
        await okButton2.waitFor({ state: 'visible', timeout: 10000 });
        await okButton2.click();
        console.log('Clicked second OK button (CommandButton_helptext)');
        await this.page.waitForTimeout(2000);

        // Step 6: Wait for page to load
        await this.waitForProcessing();
        await this.page.waitForTimeout(2500);

        // Step 7: Click search box, clear text, wait, enter 'candidate for shipping orders', wait for options, click first [title="Candidate for shipping orders"], then wait
        if (!this._alreadySearchedOrders) {
            const searchButton = this.page.locator('//div[@id="NavigationSearch"]//span[@class="button-commandRing Find-symbol"]').first();
            await searchButton.waitFor({ state: 'visible', timeout: 10000 });
            await this.dismissLightboxOverlay();
            await searchButton.click();
            await this.page.waitForTimeout(500);

            const searchInput = this.page.locator('[aria-label="Search for a page"]').first();
            await searchInput.waitFor({ state: 'visible', timeout: 10000 });
            try {
                await searchInput.click();
            } catch {
                await this.dismissLightboxOverlay();
                await searchInput.click({ force: true });
            }
            await searchInput.clear();
            await this.page.waitForTimeout(1200);
            await searchInput.fill('candidate for shipping orders');
            await this.page.waitForTimeout(2200); // Wait for options to show

            const ordersOption = this.page.locator('[title="Candidate for shipping orders"]').first();
            await ordersOption.waitFor({ state: 'visible', timeout: 10000 });
            await ordersOption.click();
            console.log('Clicked Candidate for Shipping Orders and done.');
            this._alreadySearchedOrders = true;
            await this.page.waitForTimeout(2200);
        }
    }

    async openCandidateForShippingOrders() {
        // ...existing code...
        // This method is now deprecated in the flow. Navigation is handled in filterCandidateForShipping.
    }

    async selectCandidateOrder(orderNumber: string) {
        console.log(`Selecting candidate order: ${orderNumber}`);
        await this.waitForProcessing();

        // Try to find the order in the grid
        const orderLink = this.page.locator(`a:has-text("${orderNumber}"), [role="link"]:has-text("${orderNumber}")`).first();
        if (await orderLink.isVisible({ timeout: 10000 }).catch(() => false)) {
            await orderLink.click();
            console.log(`Clicked on order: ${orderNumber}`);
        } else {
            // Fallback: filter the grid first
            const filterInput = this.page.locator('input[id*="QuickFilterControl"], input[data-dyn-controlname*="QuickFilter"]').first();
            if (await filterInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                await filterInput.fill(orderNumber);
                await filterInput.press('Enter');
                await this.waitForProcessing();
                await this.page.waitForTimeout(1000);
            }

            // Try clicking the order again
            const orderCell = this.page.locator(`text="${orderNumber}"`).first();
            if (await orderCell.isVisible({ timeout: 5000 }).catch(() => false)) {
                await orderCell.click();
                console.log(`Selected order from filtered results: ${orderNumber}`);
            } else {
                console.warn(`Order ${orderNumber} not found in grid`);
            }
        }

        await this.waitForProcessing();
        await this.page.waitForTimeout(1000);
    }
}
