import { useState, useRef } from 'react';
import { ProjectSummarySchema, type ProjectSummary } from '@/lib/agent/schema';

export type Phase = 'idle' | 'fetch' | 'normalize' | 'cluster' | 'done' | 'error';

export interface UseAgentQueryReturn {
  phase: Phase;
  data: ProjectSummary | null;
  error: string | null;
  executeQuery: (text: string) => Promise<void>;
  retry: () => Promise<void>;
}

export function useAgentQuery(): UseAgentQueryReturn {
  const [phase, setPhase] = useState<Phase>('idle');
  const [data, setData] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastQueryText = useRef<string>('');

  const executeQuery = async (text: string): Promise<void> => {
    lastQueryText.current = text;
    setPhase('fetch');
    setError(null);

    try {
      const response = await fetch('/api/agent/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: text }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || response.statusText || 'API request failed');
      }

      setPhase('normalize');

      const rawResult = await response.json();

      // Validate response with zod schema
      const parseResult = ProjectSummarySchema.safeParse(rawResult);
      if (!parseResult.success) {
        throw new Error(`Invalid API response: ${parseResult.error.message}`);
      }

      setPhase('cluster');

      // Simulate clustering phase
      await new Promise((resolve) => setTimeout(resolve, 100));

      setPhase('done');
      setData(parseResult.data);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    }
  };

  const retry = async (): Promise<void> => {
    if (!lastQueryText.current) {
      console.warn('재시도할 검색어가 없습니다');
      return;
    }

    await executeQuery(lastQueryText.current);
  };

  return {
    phase,
    data,
    error,
    executeQuery,
    retry,
  };
}
