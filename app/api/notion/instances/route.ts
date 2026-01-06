// app/api/notion/instances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getTaskInstances, createTaskInstance, getTaskTemplates } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const instanceDbId = searchParams.get('instanceDbId');
    const date = searchParams.get('date');

    if (!apiKey || !instanceDbId) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, instanceDbId' },
        { status: 400 }
      );
    }

    const client = createNotionClient(apiKey);

    // Get task instances (optionally filtered by date)
    const instances = await getTaskInstances(
      client,
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
    const body = await request.json();
    const { apiKey, instanceDbId, templateDbId, templateId, date } = body;

    if (!apiKey || !instanceDbId || !templateDbId || !templateId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, instanceDbId, templateDbId, templateId, date' },
        { status: 400 }
      );
    }

    const client = createNotionClient(apiKey);

    // Get template to fetch its name
    const templates = await getTaskTemplates(client, templateDbId);
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create task instance
    const instance = await createTaskInstance(
      client,
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
