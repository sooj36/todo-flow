// app/api/agent/keywords/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Parse request body with strict error handling
    let body: { queryText?: string } = {};

    // Read body text first to distinguish empty body from malformed JSON
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (error) {
        // Return 400 only for malformed JSON (not empty body)
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    }

    // Extract queryText with default value
    const queryText = body.queryText ?? '';

    // TODO: Phase 13.3.2 - Integrate Notion query
    // TODO: Phase 13.3.2 - Integrate Gemini clustering
    // TODO: Phase 13.3.3 - Validate with zod schema

    // Temporary response structure
    return NextResponse.json({
      meta: {
        totalPages: 0,
        clustersFound: 0,
        queryText,
      },
      clusters: [],
      topKeywords: [],
    });
  } catch (error) {
    console.error('Error in keywords agent:', error);
    return NextResponse.json(
      { error: 'Failed to process keywords' },
      { status: 500 }
    );
  }
}
