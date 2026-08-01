import { describe, expect, it } from 'vitest';
import { curationResponseSchema } from '@/lib/content-curation/types';
import { extractJson } from '@/lib/content-curation/openrouter';

describe('curationResponseSchema', () => {
  it('parses valid payload', () => {
    const parsed = curationResponseSchema.parse({
      title: 'Building Agent Ops on Vercel Workflow',
      topic: 'Vercel Workflow',
      score: 88,
      status: 'ready',
      action: 'new-post',
      reason: 'Timely ops gap with reproducible steps.',
      markdownPost: '---\ntitle: Test\ndate: \'2026-07-27\'\ntags:\n  - backend\ndescription: >-\n  Test\n---\n\nBody...',
    });
    expect(parsed.score).toBe(88);
    expect(parsed.status).toBe('ready');
    expect(parsed.markdownPost).toContain('---');
  });

  it('rejects invalid score', () => {
    expect(() =>
      curationResponseSchema.parse({
        title: 'x',
        topic: 'y',
        score: 120,
        status: 'ready',
        action: 'skip',
        reason: 'z',
        markdownPost: 'p',
      }),
    ).toThrow();
  });

  it('rejects unknown status', () => {
    expect(() =>
      curationResponseSchema.parse({
        title: 'x',
        topic: 'y',
        score: 50,
        status: 'invalid',
        action: 'skip',
        reason: 'z',
        markdownPost: 'p',
      }),
    ).toThrow();
  });
});

describe('extractJson', () => {
  it('parses raw JSON', () => {
    expect(extractJson('{"markdown":"## Hi"}')).toEqual({ markdown: '## Hi' });
  });

  it('parses fenced JSON with trailing prose', () => {
    const raw = 'Here you go:\n```json\n{"markdown":"## Title\\n\\nBody"}\n```\nThanks!';
    expect(extractJson(raw)).toEqual({ markdown: '## Title\n\nBody' });
  });

  it('parses balanced object when truncated fences fail', () => {
    const raw = 'prefix {"markdown":"## A","extra":{"n":1}} trailing';
    expect(extractJson(raw)).toEqual({ markdown: '## A', extra: { n: 1 } });
  });
});
