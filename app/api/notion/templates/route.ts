// app/api/notion/templates/route.ts
import { NextResponse } from 'next/server';
import { notion, getTaskTemplates, getFlowSteps } from '@/lib/notion';

export async function GET() {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const templateDbId = process.env.NOTION_TEMPLATE_DB_ID;
    const stepDbId = process.env.NOTION_STEP_DB_ID;

    if (!apiKey || !templateDbId || !stepDbId) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Notion API key or database IDs' },
        { status: 500 }
      );
    }

    // Get templates
    const templates = await getTaskTemplates(notion, templateDbId);

    // Get all flow steps
    const allSteps = await getFlowSteps(notion, stepDbId);

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
