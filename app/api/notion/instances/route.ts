// app/api/notion/instances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notion, getTaskInstances, createTaskInstance, getTaskTemplates } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const instanceDbId = process.env.NOTION_INSTANCE_DB_ID;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!apiKey || !instanceDbId) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Notion API key or database IDs' },
        { status: 500 }
      );
    }

    // Get task instances (optionally filtered by date)
    const instances = await getTaskInstances(
      notion,
      instanceDbId,
      date || undefined
    );

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const instanceDbId = process.env.NOTION_INSTANCE_DB_ID;
    const templateDbId = process.env.NOTION_TEMPLATE_DB_ID;

    if (!apiKey || !instanceDbId || !templateDbId) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Notion API key or database IDs' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { templateId, date } = body;

    if (!templateId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: templateId, date' },
        { status: 400 }
      );
    }

    // Get template to fetch its name
    const templates = await getTaskTemplates(notion, templateDbId);
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create task instance
    const instance = await createTaskInstance(
      notion,
      instanceDbId,
      templateId,
      template.name,
      date
    );

    return NextResponse.json({ instance }, { status: 201 });
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}
