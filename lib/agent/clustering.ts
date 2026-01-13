// lib/agent/clustering.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClusterResultSchema } from './schema';
import type { ClusterResult } from './schema';

export interface KeywordPage {
  pageId: string;
  title: string;
  keywords: string[];
}

export type { ClusterResult };

export async function clusterKeywords(pages: KeywordPage[]): Promise<ClusterResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);

  // Create model with JSON response mode
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  // Build prompt with page data
  const prompt = buildClusteringPrompt(pages);

  // Call Gemini API
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON response
  const rawData = JSON.parse(text);

  // Validate with zod schema - throws ZodError if invalid
  const clusterResult = ClusterResultSchema.parse(rawData);

  return clusterResult;
}

function buildClusteringPrompt(pages: KeywordPage[]): string {
  const pagesData = pages.map(p => ({
    pageId: p.pageId,
    title: p.title,
    keywords: p.keywords,
  }));

  return `You are a keyword clustering expert. Analyze the following pages with their keywords and create semantic clusters.

Pages data:
${JSON.stringify(pagesData, null, 2)}

Requirements:
1. Create 5-8 semantic clusters based on keyword similarity
2. Unify synonyms (e.g., "react" and "reactjs" → "react")
3. Each cluster must include:
   - name: A descriptive cluster name
   - keywords: Unified list of keywords in this cluster
   - pageRefs: Array of pageId values that contain these keywords (at least 1 per cluster)
4. Calculate top 10 most frequent keywords across all pages
5. Return exact JSON schema:

{
  "meta": {
    "totalPages": <number>,
    "clustersFound": <number>
  },
  "clusters": [
    {
      "name": "<cluster name>",
      "keywords": ["<keyword1>", "<keyword2>"],
      "pageRefs": ["<pageId1>", "<pageId2>"]
    }
  ],
  "topKeywords": [
    {
      "keyword": "<keyword>",
      "count": <number>
    }
  ]
}

Return ONLY valid JSON, no markdown or explanation.`;
}
