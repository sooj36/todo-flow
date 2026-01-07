// hooks/useTaskInstances.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskInstances } from './useTaskInstances';

global.fetch = vi.fn();

describe('useTaskInstances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch instances for a specific date', async () => {
    const mockInstances = [
      {
        id: '1',
        templateId: 'template-1',
        template: {
          id: 'template-1',
          name: 'Morning Routine',
          icon: '☀️',
          color: 'yellow' as const,
          isRepeating: true,
          defaultFrequency: 'daily' as const,
          active: true,
          flowSteps: [],
        },
        date: '2026-01-07',
        status: 'todo' as const,
        currentStepId: null,
        completedStepIds: [],
        createdAt: '2026-01-07T00:00:00Z',
        completedAt: null,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instances: mockInstances }),
    });

    const { result } = renderHook(() => useTaskInstances('2026-01-07'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.instances).toEqual(mockInstances);
    expect(result.current.error).toBe(null);
  });

  it('should fetch all instances when no date provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instances: [] }),
    });

    const { result } = renderHook(() => useTaskInstances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/notion/instances');
  });

  it('should handle fetch error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
    });

    const { result } = renderHook(() => useTaskInstances('2026-01-07'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.instances).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch instances');
  });
});
