// hooks/useTaskTemplates.ts
import { useState, useEffect } from 'react';
import { TaskTemplate } from '@/types';

interface UseTaskTemplatesReturn {
  templates: TaskTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<{ success: boolean; error?: string }>;
}

export const useTaskTemplates = (): UseTaskTemplatesReturn => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/notion/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
      setTemplates([]);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  };
};
