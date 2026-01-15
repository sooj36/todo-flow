// app/api/agent/keywords/route.ts
import { NextResponse } from 'next/server';
import { getCompletedKeywordPages } from '@/lib/notion/keywords';
import { clusterKeywords } from '@/lib/agent/clustering';
import { buildFallbackResult } from '@/lib/agent/fallback';
import { ConfigError } from '@/lib/agent/errors';

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

    // Phase 13.2: Fetch completed keyword pages from Notion
    const pages = await getCompletedKeywordPages(queryText);

    // Early return if no pages found (skip LLM call)
    if (pages.length === 0) {
      return NextResponse.json(buildFallbackResult([]));
    }

    // Phase 13.3: Attempt Gemini clustering with 1 retry
    let clusterResult;
    let lastError;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        clusterResult = await clusterKeywords(pages);
        break; // Success, exit retry loop
      } catch (error) {
        // Fail fast on configuration errors - do NOT retry or fallback
        if (error instanceof ConfigError) {
          throw error;
        }

        lastError = error;
        console.warn(`Clustering attempt ${attempt + 1} failed:`, error);
      }
    }

    // Phase 13.3.4: If both attempts failed, use frequency-based fallback
    if (!clusterResult) {
      console.warn('All clustering attempts failed, using fallback');
      clusterResult = buildFallbackResult(pages);
    }

    return NextResponse.json(clusterResult);
  } catch (error) {
    console.error('Error in keywords agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process keywords';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
