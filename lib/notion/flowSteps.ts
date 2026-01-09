// lib/notion/flowSteps.ts
// Flow Steps domain logic

import { Client } from '@notionhq/client';
import type { FlowStep } from '@/types';
import {
    extractTitle,
    extractNumber,
    extractRelation,
    extractCheckbox,
} from './parsers';

/**
 * Get flow steps from Notion, optionally filtered by template
 * @param client - Notion client instance
 * @param databaseId - Flow Steps database ID
 * @param templateId - Optional template ID to filter by
 * @returns Array of flow steps
 */
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

        steps.push({
            id: page.id,
            name: extractTitle(properties['Step Name']),
            order: extractNumber(properties['Order'], 0),
            parentTemplateId: extractRelation(properties['Parent Template'], ''),
            done: extractCheckbox(properties['done'], false),
        });
    }

    return steps;
}

/**
 * Update the done status of a flow step
 * @param client - Notion client instance
 * @param stepId - Flow step page ID
 * @param done - New done status
 */
export async function updateFlowStepDone(
    client: Client,
    stepId: string,
    done: boolean
): Promise<void> {
    await client.pages.update({
        page_id: stepId,
        properties: {
            done: {
                checkbox: done,
            },
        },
    });
}
