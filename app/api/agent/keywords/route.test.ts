// app/api/agent/keywords/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';

describe('POST /api/agent/keywords', () => {
  it('should parse queryText from request body', async () => {
    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queryText: 'test query' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(data.meta.queryText).toBe('test query');
  });

  it('should use empty string as default when queryText is not provided', async () => {
    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(data.meta.queryText).toBe('');
  });

  it('should handle missing request body', async () => {
    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(data.meta.queryText).toBe('');
  });

  it('should return 400 on malformed JSON', async () => {
    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });
});
