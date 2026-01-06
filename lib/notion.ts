// lib/notion.ts
import { Client } from '@notionhq/client';
import type { TaskTemplate, FlowStep, TaskInstance, TaskColor, Frequency, TaskStatus } from '@/types';

// Notion 클라이언트 초기화
export function createNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

// 기본 클라이언트 (환경 변수 사용)
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// ============================================
// Task Templates
// ============================================

export async function getTaskTemplates(client: Client, databaseId: string): Promise<TaskTemplate[]> {
  const response = await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Active',
      checkbox: {
        equals: true,
      },
    },
  });

  const templates: TaskTemplate[] = [];

  for (const page of response.results) {
    if (!('properties' in page)) continue;

    const properties = page.properties;

    // Name (Title)
    const nameProperty = properties['Name'];
    const name = nameProperty?.type === 'title' && nameProperty.title.length > 0
      ? nameProperty.title[0].plain_text
      : '';

    // Icon (Rich Text)
    const iconProperty = properties['Icon'];
    const icon = iconProperty?.type === 'rich_text' && iconProperty.rich_text.length > 0
      ? iconProperty.rich_text[0].plain_text
      : '📋';

    // Color (Select)
    const colorProperty = properties['Color'];
    const color = colorProperty?.type === 'select' && colorProperty.select
      ? (colorProperty.select.name as TaskColor)
      : 'gray';

    // Is Repeating (Checkbox)
    const isRepeatingProperty = properties['Is Repeating'];
    const isRepeating = isRepeatingProperty?.type === 'checkbox'
      ? isRepeatingProperty.checkbox
      : false;

    // Default Frequency (Select)
    const frequencyProperty = properties['Default Frequency'];
    const defaultFrequency = frequencyProperty?.type === 'select' && frequencyProperty.select
      ? (frequencyProperty.select.name as Frequency)
      : 'daily';

    // Active (Checkbox)
    const activeProperty = properties['Active'];
    const active = activeProperty?.type === 'checkbox'
      ? activeProperty.checkbox
      : true;

    templates.push({
      id: page.id,
      name,
      icon,
      color,
      isRepeating,
      defaultFrequency,
      active,
      flowSteps: [], // Will be populated by getFlowSteps
    });
  }

  return templates;
}

// ============================================
// Flow Steps
// ============================================

export async function getFlowSteps(client: Client, databaseId: string, templateId?: string): Promise<FlowStep[]> {
  const filter = templateId
    ? {
        property: 'Parent Template',
        relation: {
          contains: templateId,
        },
      }
    : undefined;

  const response = await client.databases.query({
    database_id: databaseId,
    filter,
    sorts: [
      {
        property: 'Order',
        direction: 'ascending',
      },
    ],
  });

  const steps: FlowStep[] = [];

  for (const page of response.results) {
    if (!('properties' in page)) continue;

    const properties = page.properties;

    // Step Name (Title)
    const stepNameProperty = properties['Step Name'];
    const name = stepNameProperty?.type === 'title' && stepNameProperty.title.length > 0
      ? stepNameProperty.title[0].plain_text
      : '';

    // Order (Number)
    const orderProperty = properties['Order'];
    const order = orderProperty?.type === 'number' && orderProperty.number !== null
      ? orderProperty.number
      : 0;

    // Parent Template (Relation)
    const parentProperty = properties['Parent Template'];
    const parentTemplateId = parentProperty?.type === 'relation' && parentProperty.relation.length > 0
      ? parentProperty.relation[0].id
      : '';

    steps.push({
      id: page.id,
      name,
      order,
      parentTemplateId,
    });
  }

  return steps;
}

// ============================================
// Task Instances
// ============================================

export async function getTaskInstances(
  client: Client,
  databaseId: string,
  date?: string
): Promise<TaskInstance[]> {
  const filter = date
    ? {
        property: 'Date',
        date: {
          equals: date,
        },
      }
    : undefined;

  const response = await client.databases.query({
    database_id: databaseId,
    filter,
  });

  const instances: TaskInstance[] = [];

  for (const page of response.results) {
    if (!('properties' in page)) continue;

    const properties = page.properties;

    // Name (Title)
    const nameProperty = properties['Name'];
    const name = nameProperty?.type === 'title' && nameProperty.title.length > 0
      ? nameProperty.title[0].plain_text
      : '';

    // Template (Relation)
    const templateProperty = properties['Template'];
    const templateId = templateProperty?.type === 'relation' && templateProperty.relation.length > 0
      ? templateProperty.relation[0].id
      : '';

    // Date (Date)
    const dateProperty = properties['Date'];
    const instanceDate = dateProperty?.type === 'date' && dateProperty.date
      ? dateProperty.date.start
      : '';

    // Status (Select)
    const statusProperty = properties['Status'];
    const status = statusProperty?.type === 'select' && statusProperty.select
      ? (statusProperty.select.name as TaskStatus)
      : 'todo';

    // Current Step (Relation)
    const currentStepProperty = properties['Current Step'];
    const currentStepId = currentStepProperty?.type === 'relation' && currentStepProperty.relation.length > 0
      ? currentStepProperty.relation[0].id
      : null;

    // Completed Steps (Relation - Multi)
    const completedStepsProperty = properties['Completed Steps'];
    const completedStepIds = completedStepsProperty?.type === 'relation'
      ? completedStepsProperty.relation.map(rel => rel.id)
      : [];

    // Created time
    const createdAt = 'created_time' in page ? page.created_time : new Date().toISOString();

    instances.push({
      id: page.id,
      templateId,
      template: {} as TaskTemplate, // Will be populated separately
      date: instanceDate,
      status,
      currentStepId,
      completedStepIds,
      createdAt,
      completedAt: status === 'done' ? createdAt : null,
    });
  }

  return instances;
}

// ============================================
// Create Task Instance
// ============================================

export async function createTaskInstance(
  client: Client,
  databaseId: string,
  templateId: string,
  templateName: string,
  date: string
): Promise<TaskInstance> {
  const response = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      'Name': {
        title: [
          {
            text: {
              content: `${templateName} - ${date}`,
            },
          },
        ],
      },
      'Template': {
        relation: [{ id: templateId }],
      },
      'Date': {
        date: {
          start: date,
        },
      },
      'Status': {
        select: {
          name: 'todo',
        },
      },
    },
  });

  return {
    id: response.id,
    templateId,
    template: {} as TaskTemplate,
    date,
    status: 'todo',
    currentStepId: null,
    completedStepIds: [],
    createdAt: 'created_time' in response ? response.created_time : new Date().toISOString(),
    completedAt: null,
  };
}
