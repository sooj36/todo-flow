import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import * as projects from '@/lib/notion/projects';
import * as summaries from '@/lib/agent/project-summary';
import { ConfigError } from '@/lib/agent/errors';

describe('POST /api/agent/project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns summarized bullets for the first matched project page', async () => {
    vi.spyOn(projects, 'getProjectPages').mockResolvedValue([
      { pageId: 'page-1', title: '뱅크샐러드', summary: '' },
    ]);

    vi.spyOn(projects, 'getProjectPageContent').mockResolvedValue({
      text: '공고 내용',
      source: 'toggle',
      rawLength: 10,
    });

    vi.spyOn(summaries, 'summarizeQualifications').mockResolvedValue({
      pageId: 'page-1',
      title: '뱅크샐러드',
      source: { from: 'toggle' },
      summary: {
        bullets: ['조건1', '조건2'],
        model: 'gemini-2.0-flash-exp',
        tokenLimit: 120,
      },
    });

    const request = new Request('http://localhost:3000/api/agent/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: '뱅크샐러드 지원자격' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(projects.getProjectPages).toHaveBeenCalledWith('뱅크샐러드 지원자격');
    expect(projects.getProjectPageContent).toHaveBeenCalledWith({
      pageId: 'page-1',
      title: '뱅크샐러드',
      summary: '',
    });
    expect(summaries.summarizeQualifications).toHaveBeenCalledWith(
      'page-1',
      '뱅크샐러드',
      '공고 내용',
      'toggle'
    );
    expect(data.summary.bullets).toEqual(['조건1', '조건2']);
    expect(data.source.rawLength).toBe(10);
  });

  it('returns 400 when queryText is missing', async () => {
    const request = new Request('http://localhost:3000/api/agent/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('queryText is required');
  });

  it('exposes safe error message when no page matches', async () => {
    vi.spyOn(projects, 'getProjectPages').mockRejectedValue(
      new Error('프로젝트 DB에 일치하는 페이지가 없습니다')
    );

    const request = new Request('http://localhost:3000/api/agent/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: '없는 페이지' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('프로젝트 DB에 일치하는 페이지가 없습니다');
  });

  it('fails fast on ConfigError from Gemini', async () => {
    vi.spyOn(projects, 'getProjectPages').mockResolvedValue([
      { pageId: 'page-1', title: '테스트', summary: '' },
    ]);
    vi.spyOn(projects, 'getProjectPageContent').mockResolvedValue({
      text: '내용',
      source: 'page',
      rawLength: 5,
    });
    vi.spyOn(summaries, 'summarizeQualifications').mockRejectedValue(
      new ConfigError('GEMINI_API_KEY is not configured')
    );

    const request = new Request('http://localhost:3000/api/agent/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: '테스트' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('GEMINI_API_KEY is not configured');
  });
});
