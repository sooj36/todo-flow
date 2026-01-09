// lib/notion/instances.ts
// Task Instances domain logic

import { Client } from '@notionhq/client';
import type { TaskInstance, TaskTemplate, TaskStatus } from '@/types';
import {
    extractTitle,
    extractRelation,
    extractDate,
    extractSelect,
    extractRelationNullable,
    extractRelationMulti,
    extractDateNullable,
} from './parsers';

/**
 * Get task instances from Notion, optionally filtered by date
 * @param client - Notion client instance
 * @param databaseId - Task Instances database ID
 * @param date - Optional date to filter by (YYYY-MM-DD format)
 * @returns Array of task instances
 */
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

        // Created time
        const createdAt = 'created_time' in page ? page.created_time : new Date().toISOString();

        instances.push({
            id: page.id,
            templateId: extractRelation(properties['Template'], ''),
            template: {} as TaskTemplate, // Will be populated separately
            date: extractDate(properties['Date'], ''),
            status: extractSelect<TaskStatus>(properties['Status'], 'todo'),
            currentStepId: extractRelationNullable(properties['Current Step']),
            completedStepIds: extractRelationMulti(properties['Completed Steps']),
            createdAt,
            completedAt: extractDateNullable(properties['Completed At']),
        });
    }

    return instances;
}

/**
 * Create a new task instance in Notion
 * @param client - Notion client instance
 * @param databaseId - Task Instances database ID
 * @param templateId - Template ID to create instance from
 * @param templateName - Template name for instance title
 * @param date - Date for the instance (YYYY-MM-DD format)
 * @returns Created task instance
 */
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
