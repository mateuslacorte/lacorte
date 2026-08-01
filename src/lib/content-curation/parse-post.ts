import matter from 'gray-matter';

export interface ParsedMarkdownPost {
  title: string;
  description: string;
  date: Date | null;
  tags: string[];
  content: string;
}

export function parseMarkdownPost(markdown: string): ParsedMarkdownPost | null {
  const trimmed = markdown.trim();
  if (!trimmed) return null;

  try {
    const { data, content } = matter(trimmed);
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === 'string')
      : [];

    let date: Date | null = null;
    if (data.date) {
      const parsed = new Date(data.date as string | Date);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }

    return {
      title: typeof data.title === 'string' ? data.title : '',
      description: typeof data.description === 'string' ? data.description : '',
      date,
      tags,
      content: content.trim(),
    };
  } catch {
    return null;
  }
}
