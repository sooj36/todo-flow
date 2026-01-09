// app/api/notion/flow-steps/[stepId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, updateFlowStepDone } from '@/lib/notion';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const { stepId } = await params;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing NOTION_API_KEY' },
        { status: 500 }
      );
    }

    if (!stepId) {
      return NextResponse.json(
        { error: 'Flow step id is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const done = body?.done;

    if (typeof done !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid payload: done must be a boolean' },
        { status: 400 }
      );
    }

    const notionClient = createNotionClient(apiKey);
    await updateFlowStepDone(notionClient, stepId, done);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating flow step:', error);
    return NextResponse.json(
      { error: 'Failed to update flow step' },
      { status: 500 }
    );
  }
}
