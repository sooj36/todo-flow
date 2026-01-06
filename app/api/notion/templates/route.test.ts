// app/api/notion/templates/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required parameters are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notion/templates');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameters: apiKey, templateDbId, stepDbId');
  });

  it('should return templates with flow steps', async () => {
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

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/templates?apiKey=test&templateDbId=db1&stepDbId=db2'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(1);
    expect(data.templates[0].flowSteps).toHaveLength(1);
    expect(data.templates[0].flowSteps[0].name).toBe('Wake up');
  });

  it('should return 500 on error', async () => {
    vi.mocked(notionLib.createNotionClient).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notion/templates?apiKey=test&templateDbId=db1&stepDbId=db2'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch templates');
  });
});
