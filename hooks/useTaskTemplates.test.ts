// hooks/useTaskTemplates.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskTemplates } from './useTaskTemplates';

global.fetch = vi.fn();

describe('useTaskTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch templates successfully', async () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Morning Routine',
        icon: '☀️',
        color: 'yellow' as const,
        isRepeating: true,
        defaultFrequency: 'daily' as const,
        active: true,
        flowSteps: [],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    });

    const { result } = renderHook(() => useTaskTemplates());

    expect(result.current.loading).toBe(true);
    expect(result.current.templates).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
    });

    const { result } = renderHook(() => useTaskTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch templates');
  });
});
