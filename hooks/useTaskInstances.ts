// hooks/useTaskInstances.ts
import { useState, useEffect } from 'react';
import { TaskInstance } from '@/types';

interface UseTaskInstancesReturn {
  instances: TaskInstance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<{ success: boolean }>;
}

export const useTaskInstances = (date?: string): UseTaskInstancesReturn => {
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async (): Promise<{ success: boolean }> => {
    try {
      setLoading(true);
      setError(null);
      const url = date
        ? `/api/notion/instances?date=${date}`
        : '/api/notion/instances';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch instances');
      }

      const data = await response.json();
      setInstances(data.instances || []);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch instances');
      setInstances([]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [date]);

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
  };
};
