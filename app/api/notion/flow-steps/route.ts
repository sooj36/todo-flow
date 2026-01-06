// app/api/notion/flow-steps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getFlowSteps } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const stepDbId = searchParams.get('stepDbId');
    const templateId = searchParams.get('templateId');

    if (!apiKey || !stepDbId) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, stepDbId' },
        { status: 400 }
      );
    }

    const client = createNotionClient(apiKey);

    // Get flow steps (optionally filtered by templateId)
    const steps = await getFlowSteps(
      client,
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
