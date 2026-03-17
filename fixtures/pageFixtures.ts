/**
 * Stub fixture file so podchannel.spec.ts compiles.
 * The real pageFixtures lives in the teammate's separate project.
 * PODchannel tests will self-skip via the ROW_COUNT=0 guard in the spec.
 */
import { test as base, expect } from '@playwright/test';

// Worker-scoped option that podchannel.spec.ts sets via test.use({ entityType })
type WorkerOptions = { entityType: string };

export const test = base.extend<Record<never, never>, WorkerOptions>({
  entityType: ['', { scope: 'worker', option: true }],
});

export { expect };
