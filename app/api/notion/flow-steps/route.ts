// app/api/notion/flow-steps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notion, getFlowSteps } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const stepDbId = process.env.NOTION_STEP_DB_ID;
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!apiKey || !stepDbId) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Notion API key or database IDs' },
        { status: 500 }
      );
    }

    // Get flow steps (optionally filtered by templateId)
    const steps = await getFlowSteps(
      notion,
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
