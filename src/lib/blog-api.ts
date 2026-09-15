// JSON serialization helpers for the public blog API (consumed by the RN app)
import type { BlogPost } from '@/lib/blog';
import { absoluteUrl } from '@/lib/site';

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string | null;
  tags: string[];
  image: string | null;
  lang: 'en' | 'pt';
  url: string;
}

export interface PostDetail extends PostSummary {
  content: string;
}

export function summarize(post: BlogPost): PostSummary {
  return {
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    date: post.data.date.toISOString(),
    updated: post.data.updated ? post.data.updated.toISOString() : null,
    tags: post.data.tags,
    image: post.data.image ?? null,
    lang: post.lang,
    url: absoluteUrl(`/posts/${post.slug}`),
  };
}

export function serializePost(post: BlogPost): PostDetail {
  return {
    ...summarize(post),
    content: post.content,
  };
}