// lib/agent/project-summary.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ConfigError } from './errors';
import { ProjectSummarySchema, type ProjectSummary } from './schema';

const TOKEN_LIMIT = 120;
const INPUT_CLIP = 4000;

const LlmResponseSchema = z.object({
  bullets: z.array(z.string()).min(1).max(5),
});

export async function summarizeQualifications(
  pageId: string,
  title: string,
  plainText: string,
  source: ProjectSummary['source']['from']
): Promise<ProjectSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ConfigError('GEMINI_API_KEY is not configured');
  }

  const clipped = plainText.slice(0, INPUT_CLIP);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(title);
  const result = await model.generateContent([
    { text: prompt },
    { text: clipped },
  ]);

  const text = result.response.text();
  const parsed = LlmResponseSchema.parse(JSON.parse(text));

  return ProjectSummarySchema.parse({
    pageId,
    title,
    source: {
      from: source,
    },
    summary: {
      bullets: parsed.bullets,
      model: 'gemini-2.0-flash-exp',
      tokenLimit: TOKEN_LIMIT,
    },
  });
}

function buildPrompt(title: string): string {
  return `입력은 plain text입니다. 아래 규칙으로 지원자격/요구사항을 요약하세요.
- 맥락: ${title} 공고
- 출력: bullets 배열(JSON), 한국어, 최대 5개
- 글자수: 전체 120 tokens 이내
- 포함: 자격/요구사항만, 불필요한 서론/결론 금지
- 포맷: { "bullets": ["항목1", "항목2"] }`;
}
