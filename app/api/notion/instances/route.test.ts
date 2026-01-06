// app/api/notion/instances/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/instances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required parameters are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notion/instances');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameters: apiKey, instanceDbId');
  });

  it('should return task instances', async () => {
    const mockInstances = [
      {
        id: 'instance-1',
        templateId: 'template-1',
        template: {} as any,
        date: '2026-01-07',
        status: 'todo' as const,
        currentStepId: null,
        completedStepIds: [],
        createdAt: '2026-01-07T00:00:00Z',
        completedAt: null,
      },
    ];

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskInstances).mockResolvedValue(mockInstances);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/instances?apiKey=test&instanceDbId=db3'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.instances).toHaveLength(1);
    expect(data.instances[0].date).toBe('2026-01-07');
  });

  it('should filter instances by date', async () => {
    const mockInstances = [
      {
        id: 'instance-1',
        templateId: 'template-1',
        template: {} as any,
        date: '2026-01-07',
        status: 'todo' as const,
        currentStepId: null,
        completedStepIds: [],
        createdAt: '2026-01-07T00:00:00Z',
        completedAt: null,
      },
    ];

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskInstances).mockResolvedValue(mockInstances);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/instances?apiKey=test&instanceDbId=db3&date=2026-01-07'
    );
    const response = await GET(request);

    expect(vi.mocked(notionLib.getTaskInstances)).toHaveBeenCalledWith(
      expect.anything(),
      'db3',
      '2026-01-07'
    );
  });

  it('should return 500 on error', async () => {
    vi.mocked(notionLib.createNotionClient).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notion/instances?apiKey=test&instanceDbId=db3'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch instances');
  });
});

describe('POST /api/notion/instances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required parameters are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required parameters');
  });

  it('should create a task instance', async () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Morning Routine',
      icon: '🌅',
      color: 'blue' as const,
      isRepeating: true,
      defaultFrequency: 'daily' as const,
      active: true,
      flowSteps: [],
    };

    const mockInstance = {
      id: 'instance-1',
      templateId: 'template-1',
      template: {} as any,
      date: '2026-01-07',
      status: 'todo' as const,
      currentStepId: null,
      completedStepIds: [],
      createdAt: '2026-01-07T00:00:00Z',
      completedAt: null,
    };

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue([mockTemplate]);
    vi.mocked(notionLib.createTaskInstance).mockResolvedValue(mockInstance);

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
        apiKey: 'test',
        instanceDbId: 'db3',
        templateDbId: 'db1',
        templateId: 'template-1',
        date: '2026-01-07',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.instance.id).toBe('instance-1');
  });

  it('should return 404 if template not found', async () => {
    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
        apiKey: 'test',
        instanceDbId: 'db3',
        templateDbId: 'db1',
        templateId: 'template-1',
        date: '2026-01-07',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Template not found');
  });

  it('should return 500 on error', async () => {
    vi.mocked(notionLib.createNotionClient).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
        apiKey: 'test',
        instanceDbId: 'db3',
        templateDbId: 'db1',
        templateId: 'template-1',
        date: '2026-01-07',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create instance');
  });
});
