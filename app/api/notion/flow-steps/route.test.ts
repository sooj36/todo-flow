// app/api/notion/flow-steps/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/flow-steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required parameters are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameters: apiKey, stepDbId');
  });

  it('should return flow steps', async () => {
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

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/flow-steps?apiKey=test&stepDbId=db2'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.steps).toHaveLength(2);
    expect(data.steps[0].name).toBe('Wake up');
  });

  it('should filter steps by templateId', async () => {
    const mockSteps = [
      {
        id: 'step-1',
        name: 'Wake up',
        order: 1,
        parentTemplateId: 'template-1',
      },
    ];

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getFlowSteps).mockResolvedValue(mockSteps);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/flow-steps?apiKey=test&stepDbId=db2&templateId=template-1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.steps).toHaveLength(1);
    expect(vi.mocked(notionLib.getFlowSteps)).toHaveBeenCalledWith(
      expect.anything(),
      'db2',
      'template-1'
    );
  });

  it('should return 500 on error', async () => {
    vi.mocked(notionLib.createNotionClient).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notion/flow-steps?apiKey=test&stepDbId=db2'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch flow steps');
  });
});
