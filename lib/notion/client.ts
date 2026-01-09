// lib/notion/client.ts
// Notion client initialization

import { Client } from '@notionhq/client';

/**
 * Create a new Notion client with the provided API key
 * @param apiKey - Notion API key
 * @returns Initialized Notion client
 */
export function createNotionClient(apiKey: string): Client {
    if (!apiKey) {
        throw new Error('Notion API key is required');
    }
    return new Client({ auth: apiKey });
}

// Lazy initialization for default client
let _notionClient: Client | null = null;

/**
 * Get the default Notion client (singleton pattern)
 * Uses NOTION_API_KEY environment variable
 * @returns Initialized Notion client
 */
export function getNotionClient(): Client {
    if (!_notionClient) {
        const apiKey = process.env.NOTION_API_KEY;
        if (!apiKey) {
            throw new Error('NOTION_API_KEY environment variable is not set');
        }
        _notionClient = new Client({ auth: apiKey });
    }
    return _notionClient;
}
