// app/api/agent/project/route.ts
import { NextResponse } from 'next/server';
import { queryProjectPages, getProjectPageContent } from '@/lib/notion/projects';
import { summarizeQualifications } from '@/lib/agent/project-summary';
import { ConfigError } from '@/lib/agent/errors';

export async function POST(req: Request) {
  try {
    let body: { queryText?: string } = {};

    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
    }

    const queryText = body.queryText?.trim();
    if (!queryText) {
      return NextResponse.json({ error: 'queryText is required' }, { status: 400 });
    }

    const pages = await queryProjectPages(queryText);
    const target = pages[0];

    const content = await getProjectPageContent(target);
    const summary = await summarizeQualifications(target.pageId, target.title, content.text, content.source);

    return NextResponse.json({
      ...summary,
      source: {
        ...summary.source,
        rawLength: content.rawLength,
      },
    });
  } catch (error) {
    console.error('Error in project agent:', error);

    const userSafeMessages = [
      '프로젝트 DB에 일치하는 페이지가 없습니다',
      '공고 내용이 비어있습니다',
      '검색어가 비어있습니다',
      'NOTION_PROJECT_DB_ID environment variable is not set',
    ];

    let errorMessage = '프로젝트 요약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    let status = 500;

    if (error instanceof ConfigError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      const isSafe = userSafeMessages.some((safe) => error.message.startsWith(safe));
      if (isSafe) {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
