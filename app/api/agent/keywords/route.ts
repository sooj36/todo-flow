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

    // Whitelist user-safe error messages; hide internal/third-party details
    const userSafeMessages = [
      '완료된 키워드 추출 페이지가 없습니다',
      '키워드가 하나도 없습니다',
      'NOTION_KEYWORD_DB_ID environment variable is not set',
    ];

    let errorMessage = '키워드 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    if (error instanceof ConfigError) {
      // ConfigError messages are safe to expose (e.g., API key not configured)
      errorMessage = error.message;
    } else if (error instanceof Error) {
      // Check if error message starts with any user-safe prefix
      const isSafe = userSafeMessages.some((safe) => error.message.startsWith(safe));
      if (isSafe) {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
