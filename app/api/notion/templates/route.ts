// app/api/notion/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getTaskTemplates, getFlowSteps } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const templateDbId = searchParams.get('templateDbId');
    const stepDbId = searchParams.get('stepDbId');

    if (!apiKey || !templateDbId || !stepDbId) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, templateDbId, stepDbId' },
        { status: 400 }
      );
    }

    const client = createNotionClient(apiKey);

    // Get templates
    const templates = await getTaskTemplates(client, templateDbId);

    // Get all flow steps
    const allSteps = await getFlowSteps(client, stepDbId);

    // Attach flow steps to each template
    const templatesWithSteps = templates.map(template => ({
      ...template,
      flowSteps: allSteps.filter(step => step.parentTemplateId === template.id),
    }));

    return NextResponse.json({ templates: templatesWithSteps });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
