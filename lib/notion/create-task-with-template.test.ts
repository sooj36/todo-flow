// lib/notion/create-task-with-template.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTaskWithTemplate, isCreateTaskError } from './create-task-with-template';
import type { CreateTaskTemplateInput } from '@/lib/schema/templates';

// Mock the Notion client
const mockPageCreate = vi.fn();
const mockPageUpdate = vi.fn();
const mockClient = {
  pages: {
    create: mockPageCreate,
    update: mockPageUpdate,
  },
} as any;

const mockDbIds = {
  templateDbId: 'template-db-id',
  stepDbId: 'step-db-id',
  instanceDbId: 'instance-db-id',
};

describe('createTaskWithTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create template and instance without steps', async () => {
      // Mock page creations
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template
        .mockResolvedValueOnce({ id: 'instance-456' }); // Instance

      const input: CreateTaskTemplateInput = {
        name: 'Morning Routine',
        instanceDate: '2026-01-18',
        mood: '🙂',
        icon: '📋',
        color: 'gray',
        isRepeating: false,
        steps: [],
      };

      const result = await createTaskWithTemplate(mockClient, mockDbIds, input);

      expect(result.templateId).toBe('template-123');
      expect(result.stepIds).toEqual([]);
      expect(result.instanceId).toBe('instance-456');
      expect(result.cleanupIds).toEqual([]);
      expect(result.partialCleanup).toBe(false);

      // Should create template, then instance
      expect(mockPageCreate).toHaveBeenCalledTimes(2);
    });

    it('should create template, steps, and instance in order', async () => {
      // Mock page creations
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template
        .mockResolvedValueOnce({ id: 'step-1' }) // Step 1
        .mockResolvedValueOnce({ id: 'step-2' }) // Step 2
        .mockResolvedValueOnce({ id: 'step-3' }) // Step 3
        .mockResolvedValueOnce({ id: 'instance-456' }); // Instance

      const input: CreateTaskTemplateInput = {
        name: 'Morning Routine',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [
          { name: 'Wake up' },
          { name: 'Exercise' },
          { name: 'Shower' },
        ],
      };

      const result = await createTaskWithTemplate(mockClient, mockDbIds, input);

      expect(result.templateId).toBe('template-123');
      expect(result.stepIds).toEqual(['step-1', 'step-2', 'step-3']);
      expect(result.instanceId).toBe('instance-456');

      // Should create template, 3 steps, then instance
      expect(mockPageCreate).toHaveBeenCalledTimes(5);
    });

    it('should apply defaults for icon and color', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check template creation call
      expect(mockPageCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          parent: { database_id: 'template-db-id' },
          properties: expect.objectContaining({
            Icon: expect.objectContaining({
              rich_text: [{ text: { content: '📋' } }],
            }),
            Color: expect.objectContaining({
              select: { name: 'gray' },
            }),
          }),
        })
      );
    });

    it('should assign step orders sequentially starting from 1', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'step-1' })
        .mockResolvedValueOnce({ id: 'step-2' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [{ name: 'First' }, { name: 'Second' }],
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check step creation calls for order
      expect(mockPageCreate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          parent: { database_id: 'step-db-id' },
          properties: expect.objectContaining({
            Order: { number: 1 },
            'Parent Template': { relation: [{ id: 'template-123' }] },
          }),
        })
      );

      expect(mockPageCreate).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          properties: expect.objectContaining({
            Order: { number: 2 },
          }),
        })
      );
    });

    it('should set instance status to todo', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check instance creation call
      expect(mockPageCreate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          parent: { database_id: 'instance-db-id' },
          properties: expect.objectContaining({
            Status: { select: { name: 'todo' } },
          }),
        })
      );
    });

    it('should convert instance date to UTC format', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check instance creation call - date should be UTC ISO format
      expect(mockPageCreate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          properties: expect.objectContaining({
            Date: { date: { start: '2026-01-18T00:00:00.000Z' } },
          }),
        })
      );
    });

    it('should map repeat options to individual Notion fields', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Weekly Workout',
        instanceDate: '2026-01-18',
        mood: '🙂',
        isRepeating: true,
        repeatOptions: {
          frequency: 'custom',
          weekdays: ['월', '수', '금'],
          repeatEnd: '2026-06-30',
          repeatLimit: 24,
        },
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check template creation call - repeat options mapped to individual fields
      expect(mockPageCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          properties: expect.objectContaining({
            // frequency → select
            frequency: { select: { name: 'custom' } },
            // weekdays → multi-select
            weekdays: {
              multi_select: [{ name: '월' }, { name: '수' }, { name: '금' }],
            },
            // repeat_end → date (UTC)
            repeat_end: { date: { start: '2026-06-30T00:00:00.000Z' } },
            // repeat_limit → number
            repeat_limit: { number: 24 },
          }),
        })
      );
    });

    it('should not include optional repeat fields when not provided', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' })
        .mockResolvedValueOnce({ id: 'instance-456' });

      const input: CreateTaskTemplateInput = {
        name: 'Daily Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        isRepeating: true,
        repeatOptions: {
          frequency: 'daily',
        },
      };

      await createTaskWithTemplate(mockClient, mockDbIds, input);

      // Check template creation call
      const templateCall = mockPageCreate.mock.calls[0][0];
      expect(templateCall.properties.frequency).toEqual({ select: { name: 'daily' } });
      // Optional fields should not be present
      expect(templateCall.properties.weekdays).toBeUndefined();
      expect(templateCall.properties.repeat_end).toBeUndefined();
      expect(templateCall.properties.repeat_limit).toBeUndefined();
    });
  });

  describe('Compensating Transaction', () => {
    it('should archive template when step creation fails', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template succeeds
        .mockRejectedValueOnce(new Error('Step creation failed')); // Step fails

      mockPageUpdate.mockResolvedValue({}); // Archive succeeds

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [{ name: 'Step 1' }],
      };

      await expect(createTaskWithTemplate(mockClient, mockDbIds, input)).rejects.toMatchObject({
        message: 'Failed to create flow steps',
        cleanupIds: ['template-123'],
        partialCleanup: false,
      });

      // Should archive the template
      expect(mockPageUpdate).toHaveBeenCalledWith({
        page_id: 'template-123',
        archived: true,
      });
    });

    it('should archive template and created steps when later step fails', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template succeeds
        .mockResolvedValueOnce({ id: 'step-1' }) // Step 1 succeeds
        .mockRejectedValueOnce(new Error('Step 2 creation failed')); // Step 2 fails

      mockPageUpdate.mockResolvedValue({}); // Archive succeeds

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      };

      await expect(createTaskWithTemplate(mockClient, mockDbIds, input)).rejects.toMatchObject({
        message: 'Failed to create flow steps',
        cleanupIds: ['template-123', 'step-1'],
        partialCleanup: false,
      });

      // Should archive template and step-1
      expect(mockPageUpdate).toHaveBeenCalledTimes(2);
    });

    it('should archive template and all steps when instance creation fails', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template
        .mockResolvedValueOnce({ id: 'step-1' }) // Step 1
        .mockResolvedValueOnce({ id: 'step-2' }) // Step 2
        .mockRejectedValueOnce(new Error('Instance creation failed')); // Instance fails

      mockPageUpdate.mockResolvedValue({}); // Archive succeeds

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      };

      await expect(createTaskWithTemplate(mockClient, mockDbIds, input)).rejects.toMatchObject({
        message: 'Failed to create task instance',
        cleanupIds: ['template-123', 'step-1', 'step-2'],
        partialCleanup: false,
      });
    });

    it('should set partialCleanup=true when archive fails', async () => {
      mockPageCreate
        .mockResolvedValueOnce({ id: 'template-123' }) // Template
        .mockRejectedValueOnce(new Error('Step creation failed')); // Step fails

      mockPageUpdate.mockRejectedValue(new Error('Archive failed')); // Archive fails

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
        steps: [{ name: 'Step 1' }],
      };

      await expect(createTaskWithTemplate(mockClient, mockDbIds, input)).rejects.toMatchObject({
        message: 'Failed to create flow steps',
        cleanupIds: ['template-123'],
        partialCleanup: true,
      });
    });

    it('should return no cleanupIds when template creation fails', async () => {
      mockPageCreate.mockRejectedValueOnce(new Error('Template creation failed'));

      const input: CreateTaskTemplateInput = {
        name: 'Test Task',
        instanceDate: '2026-01-18',
        mood: '🙂',
      };

      await expect(createTaskWithTemplate(mockClient, mockDbIds, input)).rejects.toMatchObject({
        message: 'Failed to create task template',
        cleanupIds: [],
        partialCleanup: false,
      });

      // No archive calls since no pages were created
      expect(mockPageUpdate).not.toHaveBeenCalled();
    });
  });
});

describe('isCreateTaskError', () => {
  it('should return true for valid CreateTaskError', () => {
    const error = {
      message: 'Test error',
      cleanupIds: ['id1'],
      partialCleanup: false,
    };
    expect(isCreateTaskError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    expect(isCreateTaskError(new Error('Test'))).toBe(false);
  });

  it('should return false for null', () => {
    expect(isCreateTaskError(null)).toBe(false);
  });

  it('should return false for partial objects', () => {
    expect(isCreateTaskError({ message: 'Test' })).toBe(false);
    expect(isCreateTaskError({ cleanupIds: [] })).toBe(false);
  });
});
