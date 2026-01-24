// lib/notion/templates.ts
// Task Templates domain logic

import { Client } from '@notionhq/client';
import type { TaskTemplate, TaskColor, Frequency } from '@/types';
import { DEFAULT_COLOR, isValidColor } from '@/lib/schema/templates';
import {
    extractTitle,
    extractRichText,
    extractSelect,
    extractCheckbox,
} from './parsers';

/**
 * Get all active task templates from Notion
 * @param client - Notion client instance
 * @param databaseId - Task Templates database ID
 * @returns Array of task templates
 */
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

        const rawColor = extractSelect<string>(properties['Color'], DEFAULT_COLOR);
        const normalizedColor = rawColor.trim().toLowerCase();
        const color: TaskColor = isValidColor(normalizedColor)
            ? (normalizedColor as TaskColor)
            : DEFAULT_COLOR;

        templates.push({
            id: page.id,
            name: extractTitle(properties['Name']),
            icon: extractRichText(properties['Icon'], '📋'),
            color,
            isRepeating: extractCheckbox(properties['Is Repeating'], false),
            defaultFrequency: extractSelect<Frequency>(properties['Default Frequency'], 'daily'),
            active: extractCheckbox(properties['Active'], true),
            flowSteps: [], // Will be populated by getFlowSteps
        });
    }

    return templates;
}
