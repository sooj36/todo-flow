import { useState, useRef } from 'react';

export type Phase = 'idle' | 'fetch' | 'normalize' | 'cluster' | 'done' | 'error';

export interface ClusterResult {
  meta: {
    totalPages: number;
  };
  clusters: Array<{
    label: string;
    keywords: string[];
    pageRefs: string[];
  }>;
  topKeywords: string[];
}

export interface UseAgentQueryReturn {
  phase: Phase;
  data: ClusterResult | null;
  error: string | null;
  executeQuery: (text: string) => Promise<void>;
  retry: () => Promise<void>;
}

export function useAgentQuery(): UseAgentQueryReturn {
  const [phase, setPhase] = useState<Phase>('idle');
  const [data, setData] = useState<ClusterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastQueryText = useRef<string>('');

  const executeQuery = async (text: string): Promise<void> => {
    lastQueryText.current = text;
    setPhase('fetch');
    setError(null);

    try {
      const response = await fetch('/api/agent/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: text }),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'API request failed');
      }

      setPhase('normalize');

      const result = await response.json();

      setPhase('cluster');

      // Simulate clustering phase
      await new Promise((resolve) => setTimeout(resolve, 100));

      setPhase('done');
      setData(result);
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
