// lib/agent/schema.ts
import { z } from 'zod';

// Schema for individual cluster
export const ClusterSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()),
  pageRefs: z.array(z.string()).min(1, 'Each cluster must have at least 1 pageRef'),
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
