// app/api/notion/flow-steps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getFlowSteps } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const stepDbId = process.env.NOTION_STEP_DB_ID;
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!apiKey || !stepDbId) {
      const missing = [];
      if (!apiKey) missing.push('NOTION_API_KEY');
      if (!stepDbId) missing.push('NOTION_STEP_DB_ID');
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Create Notion client
    const notionClient = createNotionClient(apiKey);

    // Get flow steps (optionally filtered by templateId)
    const steps = await getFlowSteps(
      notionClient,
      stepDbId,
      templateId || undefined
    );

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('Error fetching flow steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow steps' },
      { status: 500 }
    );
  }
}
