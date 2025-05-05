import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// Import jest-dom to automatically extend expect with its matchers
import '@testing-library/jest-dom';

// No need to explicitly extend expect if the import above works
// import matchers from '@testing-library/jest-dom/matchers';
// expect.extend(matchers);

// Clean up the DOM after each test
afterEach(() => {
  cleanup();
});

// Mock the window.matchMedia method that's required by some components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockImplementation(blob => 'mock-url'),
});

// Mock console methods to avoid noisy output in tests but maintain tracking
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = vi.fn((...args) => {
  // Filter out certain React warnings and errors in tests
  const message = args.join(' ');
  if (
    message.includes('Warning:') ||
    message.includes('React does not recognize the') ||
    message.includes('Invalid DOM property')
  ) {
    return;
  }
  originalConsoleError(...args);
});

console.warn = vi.fn((...args) => {
  // Filter out certain React warnings in tests
  const message = args.join(' ');
  if (message.includes('Warning:')) {
    return;
  }
  originalConsoleWarn(...args);
});

console.log = vi.fn((...args) => {
  // Only show essential logs in tests
  const message = args.join(' ');
  if (
    message.includes('[TEST]') || // Special log tag for tests
    process.env.DEBUG === 'true'
  ) {
    originalConsoleLog(...args);
  }
});

// Global environment variables mocks
vi.stubGlobal('import.meta.env', {
  VITE_API_URL: 'http://localhost:3000',
  MODE: 'test',
}); 