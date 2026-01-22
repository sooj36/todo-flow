// app/api/notion/instances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createNotionClient,
  getTaskInstances,
  createTaskInstance,
  getTaskTemplates,
  getFlowSteps,
} from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const instanceDbId = process.env.NOTION_INSTANCE_DB_ID;
    const templateDbId = process.env.NOTION_TEMPLATE_DB_ID;
    const flowStepDbId = process.env.NOTION_STEP_DB_ID; // Corrected env variable name
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!apiKey || !instanceDbId || !templateDbId || !flowStepDbId) {
      const missing = [];
      if (!apiKey) missing.push('NOTION_API_KEY');
      if (!instanceDbId) missing.push('NOTION_INSTANCE_DB_ID');
      if (!templateDbId) missing.push('NOTION_TEMPLATE_DB_ID');
      if (!flowStepDbId) missing.push('NOTION_STEP_DB_ID');
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Create Notion client
    const notionClient = createNotionClient(apiKey);

    // Fetch all data in parallel
    const [instances, templates, flowSteps] = await Promise.all([
      getTaskInstances(notionClient, instanceDbId, date || undefined),
      getTaskTemplates(notionClient, templateDbId),
      getFlowSteps(notionClient, flowStepDbId),
    ]);

    // Group flow steps by their parent template ID for efficient lookup
    const flowStepsByTemplate = flowSteps.reduce((acc, step) => {
      const parentId = step.parentTemplateId;
      if (parentId) {
        if (!acc[parentId]) {
          acc[parentId] = [];
        }
        acc[parentId].push(step);
      }
      return acc;
    }, {} as Record<string, typeof flowSteps>);

    // Create a map of templates with their flow steps included
    const templatesWithSteps = templates.map(template => ({
      ...template,
      flowSteps: flowStepsByTemplate[template.id] || [],
    }));
    const templatesMap = new Map(templatesWithSteps.map(t => [t.id, t]));

    // Populate each instance with its full template data (including flow steps)
    const instancesWithTemplates = instances.map(instance => ({
      ...instance,
      template: templatesMap.get(instance.templateId) || {
        id: instance.templateId,
        name: 'Unknown Template',
        icon: '📋',
        color: 'gray' as const,
        isRepeating: false,
        defaultFrequency: 'daily' as const,
        active: false,
        flowSteps: [],
      },
    }));

    return NextResponse.json({ instances: instancesWithTemplates });
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
      const missing = [];
      if (!apiKey) missing.push('NOTION_API_KEY');
      if (!instanceDbId) missing.push('NOTION_INSTANCE_DB_ID');
      if (!templateDbId) missing.push('NOTION_TEMPLATE_DB_ID');
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Create Notion client
    const notionClient = createNotionClient(apiKey);

    const body = await request.json();
    const { templateId, date } = body;

    if (!templateId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: templateId, date' },
        { status: 400 }
      );
    }

    // Get template to fetch its name
    const templates = await getTaskTemplates(notionClient, templateDbId);
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create task instance
    const instance = await createTaskInstance(
      notionClient,
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
