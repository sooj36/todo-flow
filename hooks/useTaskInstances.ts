// hooks/useTaskInstances.ts
import { useState, useEffect, useRef } from 'react';
import { TaskInstance } from '@/types';

interface UseTaskInstancesReturn {
  instances: TaskInstance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<{ success: boolean; error?: string }>;
}

export const useTaskInstances = (date?: string): UseTaskInstancesReturn => {
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevDateRef = useRef<string | undefined>(date);

  const fetchInstances = async (): Promise<{ success: boolean; error?: string }> => {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch instances';
      setError(errorMessage);
      setInstances([]);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date !== prevDateRef.current) {
      setInstances([]);
      prevDateRef.current = date;
    }
    fetchInstances();
  }, [date]);

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
  };
};
