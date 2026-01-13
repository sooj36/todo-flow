import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Set default environment variables for tests
process.env.NOTION_API_KEY = process.env.NOTION_API_KEY || 'test-api-key';
process.env.NOTION_TEMPLATE_DB_ID = process.env.NOTION_TEMPLATE_DB_ID || 'test-template-db';
process.env.NOTION_STEP_DB_ID = process.env.NOTION_STEP_DB_ID || 'test-step-db';
process.env.NOTION_INSTANCE_DB_ID = process.env.NOTION_INSTANCE_DB_ID || 'test-instance-db';
process.env.NOTION_KEYWORD_DB_ID = process.env.NOTION_KEYWORD_DB_ID || 'test-keyword-db';

// Mock ResizeObserver for React Flow tests
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage with in-memory storage
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] || null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storage[key]; }),
  clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
};
globalThis.localStorage = localStorageMock as any;
