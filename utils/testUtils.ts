/**
 * Stub — podchannel.spec.ts imports these but they are only called
 * from beforeAll/afterAll which never run when ROW_COUNT = 0.
 */
export async function loadTestData(_inputFile: string): Promise<void> {}
export async function writeOutput(_entityType: string, _outputFile: string): Promise<void> {}
export function printSummary(_entityType: string, _results: { status: string }[]): void {}
export function finalizeRun(_entityType: string): void {}
