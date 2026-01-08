// app/api/notion/flow-steps/[stepId]/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PATCH } from './route';
import { NextRequest } from 'next/server';
import * as notionLib from '@/lib/notion';

vi.mock('@/lib/notion');

describe('PATCH /api/notion/flow-steps/[stepId]', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 500 if NOTION_API_KEY is missing', async () => {
    delete process.env.NOTION_API_KEY;

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps/step-1', {
      method: 'PATCH',
      body: JSON.stringify({ done: true }),
    });

    const response = await PATCH(request, { params: { stepId: 'step-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error: Missing NOTION_API_KEY');
  });

  it('should return 400 for invalid payload', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps/step-1', {
      method: 'PATCH',
      body: JSON.stringify({ done: 'yes' }),
    });

    const response = await PATCH(request, { params: { stepId: 'step-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payload: done must be a boolean');
  });

  it('should update flow step done', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';

    vi.mocked(notionLib.updateFlowStepDone).mockResolvedValue();

    const request = new NextRequest('http://localhost:3000/api/notion/flow-steps/step-1', {
      method: 'PATCH',
      body: JSON.stringify({ done: true }),
    });

    const response = await PATCH(request, { params: { stepId: 'step-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(notionLib.updateFlowStepDone)).toHaveBeenCalledWith(
      expect.anything(),
      'step-1',
      true
    );
  });
});
