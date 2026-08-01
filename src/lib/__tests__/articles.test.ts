import { describe, expect, it } from 'vitest';
import { sanitizeArticleText } from '@/lib/articles';

describe('sanitizeArticleText', () => {
  it('decodes entities and strips paragraph tags', () => {
    expect(sanitizeArticleText('&lt;p&gt;Hello world&lt;/p&gt;')).toBe('Hello world');
  });

  it('keeps link text and drops anchor markup', () => {
    expect(
      sanitizeArticleText(
        '&lt;p&gt;Subscribe to our &lt;a href="https://newsletter.tinyinterpreters.dev/subscribe" rel="noopener noreferrer"&gt;newsletter&lt;/a&gt; today.&lt;/p&gt;',
      ),
    ).toBe('Subscribe to our newsletter today.');
  });

  it('strips strong tags', () => {
    expect(sanitizeArticleText('&lt;strong&gt;Important&lt;/strong&gt; update')).toBe('Important update');
  });

  it('handles raw html', () => {
    expect(sanitizeArticleText('<p>Line one</p><p>Line two</p>')).toBe('Line one Line two');
  });

  it('collapses whitespace', () => {
    expect(sanitizeArticleText('  too   many   spaces  ')).toBe('too many spaces');
  });

  it('truncates when max length is set', () => {
    const long = 'a'.repeat(520);
    expect(sanitizeArticleText(long, 100)).toHaveLength(100);
    expect(sanitizeArticleText(long, 100).endsWith('...')).toBe(true);
  });

  it('does not truncate when max length is 0', () => {
    const long = 'a'.repeat(520);
    expect(sanitizeArticleText(long, 0)).toHaveLength(520);
  });
});
