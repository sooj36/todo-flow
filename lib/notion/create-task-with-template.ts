// lib/notion/create-task-with-template.ts
// Transaction logic: Template → Steps → Instance creation with compensation

import { Client } from '@notionhq/client';
import type {
  CreateTaskTemplateInput,
  CreateTaskResponse,
} from '@/lib/schema/templates';
import { assignStepOrders, DEFAULT_ICON, DEFAULT_COLOR } from '@/lib/schema/templates';
import { localDateToUTC } from '@/lib/utils/dateTransform';

/**
 * Database IDs required for create-task operation
 */
export interface CreateTaskDatabaseIds {
  templateDbId: string;
  stepDbId: string;
  instanceDbId: string;
}

/**
 * Result of a single page creation
 */
interface PageCreationResult {
  id: string;
  success: boolean;
}

/**
 * Archive (soft delete) a Notion page by setting archived=true
 */
async function archivePage(client: Client, pageId: string): Promise<boolean> {
  try {
    await client.pages.update({
      page_id: pageId,
      archived: true,
    });
    return true;
  } catch (error) {
    console.error(`Failed to archive page ${pageId}:`, error);
    return false;
  }
}

/**
 * Archive multiple pages and return cleanup status
 */
async function archivePages(
  client: Client,
  pageIds: string[]
): Promise<{ cleanupIds: string[]; partialCleanup: boolean }> {
  const cleanupIds: string[] = [];
  let partialCleanup = false;

  for (const pageId of pageIds) {
    const archived = await archivePage(client, pageId);
    cleanupIds.push(pageId);
    if (!archived) {
      partialCleanup = true;
    }
  }

  return { cleanupIds, partialCleanup };
}

/**
 * Build Notion properties for repeat options
 * Maps to individual Notion fields: frequency (select), weekdays (multi-select),
 * repeat_end (date), repeat_limit (number)
 */
function buildRepeatOptionsProperties(
  repeatOptions: CreateTaskTemplateInput['repeatOptions']
): Record<string, unknown> {
  if (!repeatOptions) {
    return {};
  }

  const properties: Record<string, unknown> = {
    // frequency → select
    frequency: {
      select: { name: repeatOptions.frequency },
    },
  };

  // weekdays → multi-select (optional, required for custom frequency)
  if (repeatOptions.weekdays && repeatOptions.weekdays.length > 0) {
    properties['weekdays'] = {
      multi_select: repeatOptions.weekdays.map((day) => ({ name: day })),
    };
  }

  // repeat_end → date (optional)
  if (repeatOptions.repeatEnd) {
    properties['repeat_end'] = {
      date: { start: localDateToUTC(repeatOptions.repeatEnd) },
    };
  }

  // repeat_limit → number (optional)
  if (repeatOptions.repeatLimit !== undefined) {
    properties['repeat_limit'] = {
      number: repeatOptions.repeatLimit,
    };
  }

  return properties;
}

/**
 * Create Task Template in Notion
 */
async function createTemplate(
  client: Client,
  databaseId: string,
  input: CreateTaskTemplateInput
): Promise<PageCreationResult> {
  const icon = input.icon ?? DEFAULT_ICON;
  const color = input.color ?? DEFAULT_COLOR;

  // Build repeat options properties for individual Notion fields
  const repeatOptionsProperties = buildRepeatOptionsProperties(input.repeatOptions);

  const response = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: input.name } }],
      },
      Icon: {
        rich_text: [{ text: { content: icon } }],
      },
      Color: {
        select: { name: color },
      },
      'Is Repeating': {
        checkbox: input.isRepeating ?? false,
      },
      'Default Frequency': {
        select: { name: input.repeatOptions?.frequency ?? 'daily' },
      },
      Active: {
        checkbox: true,
      },
      // Spread individual repeat option fields
      ...repeatOptionsProperties,
    },
  });

  return { id: response.id, success: true };
}

/**
 * Create Flow Step in Notion
 */
async function createFlowStep(
  client: Client,
  databaseId: string,
  templateId: string,
  stepName: string,
  order: number
): Promise<PageCreationResult> {
  const response = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      'Step Name': {
        title: [{ text: { content: stepName } }],
      },
      Order: {
        number: order,
      },
      'Parent Template': {
        relation: [{ id: templateId }],
      },
      done: {
        checkbox: false,
      },
    },
  });

  return { id: response.id, success: true };
}

/**
 * Create Task Instance in Notion
 * Converts local date (YYYY-MM-DD) to UTC 00:00 for Notion storage
 */
async function createInstance(
  client: Client,
  databaseId: string,
  templateId: string,
  templateName: string,
  date: string,
  mood: CreateTaskTemplateInput['mood']
): Promise<PageCreationResult> {
  // Convert local date to UTC 00:00 for Notion storage
  const utcDate = localDateToUTC(date);

  const response = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: `${templateName} - ${date}` } }],
      },
      Template: {
        relation: [{ id: templateId }],
      },
      Date: {
        date: { start: utcDate },
      },
      Status: {
        select: { name: 'todo' },
      },
      Mood: {
        select: { name: mood },
      },
    },
  });

  return { id: response.id, success: true };
}

/**
 * Create Task Template → Flow Steps → Task Instance with compensating transaction
 *
 * On failure:
 * - Steps creation failure: Archive template
 * - Instance creation failure: Archive template + all steps
 *
 * @param client - Notion client instance
 * @param dbIds - Database IDs for template, step, instance DBs
 * @param input - Validated input from CreateTaskTemplateSchema
 * @returns CreateTaskResponse with created IDs or cleanup info
 */
export async function createTaskWithTemplate(
  client: Client,
  dbIds: CreateTaskDatabaseIds,
  input: CreateTaskTemplateInput
): Promise<CreateTaskResponse> {
  const createdIds: {
    templateId?: string;
    stepIds: string[];
    instanceId?: string;
  } = { stepIds: [] };

  try {
    // Step 1: Create Template
    const templateResult = await createTemplate(client, dbIds.templateDbId, input);
    createdIds.templateId = templateResult.id;

    // Step 2: Create Flow Steps (if any)
    if (input.steps && input.steps.length > 0) {
      const stepsWithOrder = assignStepOrders(input.steps);

      for (const step of stepsWithOrder) {
        try {
          const stepResult = await createFlowStep(
            client,
            dbIds.stepDbId,
            createdIds.templateId,
            step.name,
            step.order
          );
          createdIds.stepIds.push(stepResult.id);
        } catch (stepError) {
          // Step creation failed - archive template and any created steps
          console.error('Flow step creation failed:', stepError);
          const idsToCleanup = [createdIds.templateId, ...createdIds.stepIds];
          const cleanup = await archivePages(client, idsToCleanup);

          throw {
            message: 'Failed to create flow steps',
            cleanupIds: cleanup.cleanupIds,
            partialCleanup: cleanup.partialCleanup,
          };
        }
      }
    }

    // Step 3: Create Instance
    try {
      const instanceResult = await createInstance(
        client,
        dbIds.instanceDbId,
        createdIds.templateId,
        input.name,
        input.instanceDate,
        input.mood
      );
      createdIds.instanceId = instanceResult.id;
    } catch (instanceError) {
      // Instance creation failed - archive template + all steps
      console.error('Instance creation failed:', instanceError);
      const idsToCleanup = [createdIds.templateId, ...createdIds.stepIds];
      const cleanup = await archivePages(client, idsToCleanup);

      throw {
        message: 'Failed to create task instance',
        cleanupIds: cleanup.cleanupIds,
        partialCleanup: cleanup.partialCleanup,
      };
    }

    // All successful
    return {
      templateId: createdIds.templateId,
      stepIds: createdIds.stepIds,
      instanceId: createdIds.instanceId,
      cleanupIds: [],
      partialCleanup: false,
    };
  } catch (error) {
    // Handle errors with cleanup info
    if (
      error &&
      typeof error === 'object' &&
      'cleanupIds' in error &&
      'partialCleanup' in error
    ) {
      throw error;
    }

    // Template creation failed - no cleanup needed
    console.error('Template creation failed:', error);
    throw {
      message: 'Failed to create task template',
      cleanupIds: [],
      partialCleanup: false,
    };
  }
}

/**
 * Type for error thrown by createTaskWithTemplate
 */
export interface CreateTaskError {
  message: string;
  cleanupIds: string[];
  partialCleanup: boolean;
}

/**
 * Type guard for CreateTaskError
 */
export function isCreateTaskError(error: unknown): error is CreateTaskError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    'cleanupIds' in error &&
    'partialCleanup' in error
  );
}
