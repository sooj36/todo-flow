// app/api/notion/templates/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/templates', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 500 if environment variables are missing', async () => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_TEMPLATE_DB_ID;
    delete process.env.NOTION_STEP_DB_ID;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error: Missing NOTION_API_KEY, NOTION_TEMPLATE_DB_ID, NOTION_STEP_DB_ID');
  });

  it('should return templates with flow steps', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
    process.env.NOTION_STEP_DB_ID = 'step-db-id';

    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Morning Routine',
        icon: '🌅',
        color: 'blue' as const,
        isRepeating: true,
        defaultFrequency: 'daily' as const,
        active: true,
        flowSteps: [],
      },
    ];

    const mockSteps = [
      {
        id: 'step-1',
        name: 'Wake up',
        order: 1,
        parentTemplateId: 'template-1',
      },
    ];

    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(1);
    expect(data.templates[0].flowSteps).toHaveLength(1);
    expect(data.templates[0].flowSteps[0].name).toBe('Wake up');
  });

  it('should return 500 on error', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
    process.env.NOTION_STEP_DB_ID = 'step-db-id';

    vi.mocked(notionLib.getTaskTemplates).mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch templates');
  });
});
