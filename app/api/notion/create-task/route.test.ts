// app/api/notion/create-task/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';
import type { CreateTaskResponse } from '@/lib/schema/templates';

vi.mock('@/lib/notion');

describe('POST /api/notion/create-task', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Environment validation tests
  describe('Environment Validation', () => {
    it('should return 500 if NOTION_API_KEY is missing', async () => {
      delete process.env.NOTION_API_KEY;
      process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
      process.env.NOTION_STEP_DB_ID = 'step-db-id';
      process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', instanceDate: '2026-01-18' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing NOTION_API_KEY');
    });

    it('should return 500 if all env vars are missing', async () => {
      delete process.env.NOTION_API_KEY;
      delete process.env.NOTION_TEMPLATE_DB_ID;
      delete process.env.NOTION_STEP_DB_ID;
      delete process.env.NOTION_INSTANCE_DB_ID;

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', instanceDate: '2026-01-18' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(
        'Server configuration error: Missing NOTION_API_KEY, NOTION_TEMPLATE_DB_ID, NOTION_STEP_DB_ID, NOTION_INSTANCE_DB_ID'
      );
    });
  });

  // Validation tests
  describe('Request Validation', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
      process.env.NOTION_STEP_DB_ID = 'step-db-id';
      process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: 'not valid json {',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 if name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({ instanceDate: '2026-01-18' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContainEqual(
        expect.objectContaining({ path: 'name' })
      );
    });

    it('should return 400 if instanceDate is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Task' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContainEqual(
        expect.objectContaining({ path: 'instanceDate' })
      );
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', instanceDate: '2026/01/18' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid color', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          instanceDate: '2026-01-18',
          color: 'invalid-color',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 if isRepeating=true but repeatOptions missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          instanceDate: '2026-01-18',
          isRepeating: true,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContainEqual(
        expect.objectContaining({ path: 'repeatOptions' })
      );
    });
  });

  // Happy path tests
  describe('Success Cases', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
      process.env.NOTION_STEP_DB_ID = 'step-db-id';
      process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    });

    it('should create task with minimal input (defaults applied)', async () => {
      const mockResult: CreateTaskResponse = {
        templateId: 'template-123',
        stepIds: [],
        instanceId: 'instance-456',
        cleanupIds: [],
        partialCleanup: false,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Morning Routine',
          instanceDate: '2026-01-18',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.templateId).toBe('template-123');
      expect(data.instanceId).toBe('instance-456');
      expect(data.stepIds).toEqual([]);
      expect(data.cleanupIds).toEqual([]);
      expect(data.partialCleanup).toBe(false);

      // Verify defaults are applied
      expect(vi.mocked(notionLib.createTaskWithTemplate)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          templateDbId: 'template-db-id',
          stepDbId: 'step-db-id',
          instanceDbId: 'instance-db-id',
        }),
        expect.objectContaining({
          name: 'Morning Routine',
          icon: '📋', // default
          color: 'gray', // default
          isRepeating: false, // default
          steps: [], // default
          instanceDate: '2026-01-18',
        })
      );
    });

    it('should create task with steps', async () => {
      const mockResult: CreateTaskResponse = {
        templateId: 'template-123',
        stepIds: ['step-1', 'step-2', 'step-3'],
        instanceId: 'instance-456',
        cleanupIds: [],
        partialCleanup: false,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Morning Routine',
          instanceDate: '2026-01-18',
          icon: 'sun', // Use Lucide icon name instead of emoji
          color: 'yellow',
          steps: [
            { name: 'Wake up' },
            { name: 'Exercise' },
            { name: 'Shower' },
          ],
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.stepIds).toHaveLength(3);
    });

    it('should create repeating task with weekly frequency', async () => {
      const mockResult: CreateTaskResponse = {
        templateId: 'template-123',
        stepIds: [],
        instanceId: 'instance-456',
        cleanupIds: [],
        partialCleanup: false,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Weekly Review',
          instanceDate: '2026-01-18',
          isRepeating: true,
          repeatOptions: {
            frequency: 'weekly',
          },
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.templateId).toBe('template-123');
    });

    it('should create repeating task with custom frequency and weekdays', async () => {
      const mockResult: CreateTaskResponse = {
        templateId: 'template-123',
        stepIds: [],
        instanceId: 'instance-456',
        cleanupIds: [],
        partialCleanup: false,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'MWF Workout',
          instanceDate: '2026-01-18',
          isRepeating: true,
          repeatOptions: {
            frequency: 'custom',
            weekdays: ['월', '수', '금'],
            repeatLimit: 12,
          },
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_TEMPLATE_DB_ID = 'template-db-id';
      process.env.NOTION_STEP_DB_ID = 'step-db-id';
      process.env.NOTION_INSTANCE_DB_ID = 'instance-db-id';
    });

    it('should return 500 with cleanupIds on step creation failure', async () => {
      const mockError = {
        message: 'Failed to create flow steps',
        cleanupIds: ['template-123', 'step-1'],
        partialCleanup: false,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockRejectedValue(mockError);
      vi.mocked(notionLib.isCreateTaskError).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Task',
          instanceDate: '2026-01-18',
          steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create flow steps');
      expect(data.cleanupIds).toEqual(['template-123', 'step-1']);
      expect(data.partialCleanup).toBe(false);
    });

    it('should return 500 with partialCleanup=true when cleanup fails', async () => {
      const mockError = {
        message: 'Failed to create task instance',
        cleanupIds: ['template-123', 'step-1', 'step-2'],
        partialCleanup: true,
      };

      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockRejectedValue(mockError);
      vi.mocked(notionLib.isCreateTaskError).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Task',
          instanceDate: '2026-01-18',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.partialCleanup).toBe(true);
    });

    it('should return 500 with generic error for unexpected failures', async () => {
      vi.mocked(notionLib.createNotionClient).mockReturnValue({} as any);
      vi.mocked(notionLib.createTaskWithTemplate).mockRejectedValue(
        new Error('Network error')
      );
      vi.mocked(notionLib.isCreateTaskError).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/notion/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Task',
          instanceDate: '2026-01-18',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create task');
      expect(data.cleanupIds).toEqual([]);
      expect(data.partialCleanup).toBe(false);
    });
  });
});
