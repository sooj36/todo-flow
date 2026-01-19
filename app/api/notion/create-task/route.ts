// app/api/notion/create-task/route.ts
// POST: Create Task Template → Flow Steps → Task Instance (single transaction)

import { NextRequest, NextResponse } from 'next/server';
import {
  createNotionClient,
  createTaskWithTemplate,
  isCreateTaskError,
} from '@/lib/notion';
import { CreateTaskTemplateSchema } from '@/lib/schema/templates';

export async function POST(request: NextRequest) {
  try {
    // Environment validation
    const apiKey = process.env.NOTION_API_KEY;
    const templateDbId = process.env.NOTION_TEMPLATE_DB_ID;
    const stepDbId = process.env.NOTION_STEP_DB_ID;
    const instanceDbId = process.env.NOTION_INSTANCE_DB_ID;

    if (!apiKey || !templateDbId || !stepDbId || !instanceDbId) {
      const missing = [];
      if (!apiKey) missing.push('NOTION_API_KEY');
      if (!templateDbId) missing.push('NOTION_TEMPLATE_DB_ID');
      if (!stepDbId) missing.push('NOTION_STEP_DB_ID');
      if (!instanceDbId) missing.push('NOTION_INSTANCE_DB_ID');
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Parse request body (handle malformed JSON)
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body against schema
    const parseResult = CreateTaskTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create Notion client and execute transaction
    const notionClient = createNotionClient(apiKey);
    const result = await createTaskWithTemplate(
      notionClient,
      { templateDbId, stepDbId, instanceDbId },
      parseResult.data
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in create-task:', error);

    // Handle CreateTaskError with cleanup info
    if (isCreateTaskError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          cleanupIds: error.cleanupIds,
          partialCleanup: error.partialCleanup,
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to create task', cleanupIds: [], partialCleanup: false },
      { status: 500 }
    );
  }
}
