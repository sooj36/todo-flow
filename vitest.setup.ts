import "@testing-library/jest-dom/vitest";

// Set default environment variables for tests
process.env.NOTION_API_KEY = process.env.NOTION_API_KEY || 'test-api-key';
process.env.NOTION_TEMPLATE_DB_ID = process.env.NOTION_TEMPLATE_DB_ID || 'test-template-db';
process.env.NOTION_STEP_DB_ID = process.env.NOTION_STEP_DB_ID || 'test-step-db';
process.env.NOTION_INSTANCE_DB_ID = process.env.NOTION_INSTANCE_DB_ID || 'test-instance-db';
