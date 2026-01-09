// app/api/notion/instances/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('GET /api/notion/instances', () => {
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
    delete process.env.NOTION_INSTANCE_DB_ID;
    delete process.env.NOTION_TEMPLATE_DB_ID;

    const request = new NextRequest('http://localhost:3000/api/notion/instances');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error: Missing NOTION_API_KEY, NOTION_INSTANCE_DB_ID, NOTION_TEMPLATE_DB_ID');
  });

  it('should return task instances', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Morning Routine',
        icon: '☀️',
        color: 'yellow' as const,
        isRepeating: true,
        defaultFrequency: 'daily' as const,
        active: true,
        flowSteps: [],
      },
    ];

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
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(notionLib.getTaskInstances).mockResolvedValue(mockInstances);

    const request = new NextRequest('http://localhost:3000/api/notion/instances');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.instances).toHaveLength(1);
    expect(data.instances[0].date).toBe('2026-01-07');
    expect(data.instances[0].template.name).toBe('Morning Routine');
  });

  it('should filter instances by date', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Morning Routine',
        icon: '☀️',
        color: 'yellow' as const,
        isRepeating: true,
        defaultFrequency: 'daily' as const,
        active: true,
        flowSteps: [],
      },
    ];

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

    const mockClient = {} as any;
    vi.mocked(notionLib.createNotionClient).mockReturnValue(mockClient);
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(notionLib.getTaskInstances).mockResolvedValue(mockInstances);

    const request = new NextRequest(
      'http://localhost:3000/api/notion/instances?date=2026-01-07'
    );
    const response = await GET(request);

    expect(vi.mocked(notionLib.getTaskInstances)).toHaveBeenCalledWith(
      mockClient,
      'instance-db-id',
      '2026-01-07'
    );
  });

  it('should return 500 on error', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskInstances).mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/notion/instances');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch instances');
  });
});

describe('POST /api/notion/instances', () => {
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
    delete process.env.NOTION_INSTANCE_DB_ID;
    delete process.env.NOTION_TEMPLATE_DB_ID;

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'template-1',
        date: '2026-01-07',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error: Missing NOTION_API_KEY, NOTION_INSTANCE_DB_ID, NOTION_TEMPLATE_DB_ID');
  });

  it('should return 400 if required parameters are missing', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameters: templateId, date');
  });

  it('should create a task instance', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

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
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskTemplates).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
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
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';

    vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
    vi.mocked(notionLib.getTaskTemplates).mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/notion/instances', {
      method: 'POST',
      body: JSON.stringify({
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
