import { z } from "zod";

export const PageRefSchema = z.object({
  pageId: z.string(),
  title: z.string(),
});

export const ClusterSchema = z.object({
  label: z.string(),
  keywords: z.array(z.string()),
  pageRefs: z.array(PageRefSchema),
});

export const TopKeywordSchema = z.object({
  keyword: z.string(),
  count: z.number(),
});

export const ClusterResultSchema = z.object({
  meta: z.object({
    totalPages: z.number(),
    totalKeywords: z.number(),
  }),
  clusters: z.array(ClusterSchema),
  topKeywords: z.array(TopKeywordSchema),
});

export type ClusterResult = z.infer<typeof ClusterResultSchema>;
