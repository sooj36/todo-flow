// app/api/notion/flow-steps/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/flow-steps', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 500 if environment variables are missing', async () => {
    delete process.env.NOTION_STEP_DB_ID;

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error: Missing Notion database IDs');
  });

  it('should return flow steps', async () => {
    process.env.NOTION_STEP_DB_ID = 'step-db-id';

    const mockSteps = [
      {
        id: 'step-1',
        name: 'Wake up',
        order: 1,
        parentTemplateId: 'template-1',
      },
      {
        id: 'step-2',
        name: 'Brush teeth',
        order: 2,
        parentTemplateId: 'template-1',
      },
    ];

    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.steps).toHaveLength(2);
    expect(data.steps[0].name).toBe('Wake up');
  });

  it('should filter steps by templateId', async () => {
    process.env.NOTION_STEP_DB_ID = 'step-db-id';

    const mockSteps = [
      {
        id: 'step-1',
        name: 'Wake up',
        order: 1,
        parentTemplateId: 'template-1',
      },
    ];

    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/flow-steps?templateId=template-1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.steps).toHaveLength(1);
    expect(vi.mocked(notionLib.getFlowSteps)).toHaveBeenCalledWith(
      expect.anything(),
      'step-db-id',
      'template-1'
    );
  });

  it('should return 500 on error', async () => {
    process.env.NOTION_STEP_DB_ID = 'step-db-id';

    vi.mocked(notionLib.getFlowSteps).mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch flow steps');
  });
});
