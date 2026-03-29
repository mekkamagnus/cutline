/**
 * Test Setup
 *
 * This file is run before each test file to set up the testing environment.
 */
import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll } from 'vitest';
import 'fake-indexeddb/auto';

// Mock crypto.randomUUID if needed
if (!globalThis.crypto?.randomUUID) {
  // @ts-expect-error - Mock for testing
  globalThis.crypto = {
    randomUUID: () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`,
  };
}

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
