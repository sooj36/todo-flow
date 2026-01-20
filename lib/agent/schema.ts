// lib/agent/schema.ts
import { z } from 'zod';

// Schema for page reference with title
export const PageRefSchema = z.object({
  pageId: z.string(),
  title: z.string(),
});

// Schema for individual cluster
export const ClusterSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()),
  pageRefs: z.array(PageRefSchema).min(1, 'Each cluster must have at least 1 pageRef'),
});

// Schema for top keyword frequency
export const TopKeywordSchema = z.object({
  keyword: z.string(),
  count: z.number(),
});

// Schema for meta information
export const MetaSchema = z.object({
  totalPages: z.number(),
  clustersFound: z.number(),
});

// Main schema for cluster result
export const ClusterResultSchema = z.object({
  meta: MetaSchema,
  clusters: z.array(ClusterSchema),
  topKeywords: z.array(TopKeywordSchema),
});

// Type inference from schema
export type ClusterResult = z.infer<typeof ClusterResultSchema>;

// Project summary (지원자격 요약) schema
export const ProjectSummarySchema = z.object({
  pageId: z.string(),
  title: z.string(),
  source: z.object({
    from: z.enum(['toggle', 'page', 'summary']),
    note: z.string().optional(),
    rawLength: z.number().optional(),
  }),
  summary: z.object({
    bullets: z.array(z.string()).min(1),
    model: z.string(),
    tokenLimit: z.number(),
  }),
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
