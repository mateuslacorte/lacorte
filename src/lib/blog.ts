// File-based Markdown/MDX blog content layer (per-locale directories)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { defaultLang, type Language } from '@/i18n';

const BLOG_ROOT = join(process.cwd(), 'src/content/blog');

const frontmatterSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const data = raw as Record<string, unknown>;
    if (!data.description && data.excerpt) {
      return { ...data, description: data.excerpt };
    }
    return data;
  },
  z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    updated: z.coerce.date().optional(),
  }),
);

export type BlogFrontmatter = z.infer<typeof frontmatterSchema>;

export interface BlogPost {
  slug: string;
  data: BlogFrontmatter;
  content: string;
  lang: Language;
}

function langDir(lang: Language): string {
  return join(BLOG_ROOT, lang);
}

function parsePostFile(dir: string, file: string, lang: Language): BlogPost {
  const raw = readFileSync(join(dir, file), 'utf8');
  const { data, content } = matter(raw);
  return {
    slug: file.replace(/\.mdx?$/, ''),
    data: frontmatterSchema.parse(data),
    content,
    lang,
  };
}

function listPostFiles(lang: Language): string[] {
  const dir = langDir(lang);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => /\.mdx?$/.test(file));
}

export function getAllPosts(lang: Language = defaultLang): BlogPost[] {
  const primary = listPostFiles(lang)
    .map((file) => parsePostFile(langDir(lang), file, lang))
    .filter((post) => !post.data.draft);

  if (lang === defaultLang) {
    return primary.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  }

  // Fall back to EN posts missing a PT translation
  const have = new Set(primary.map((p) => p.slug));
  const fallbacks = listPostFiles(defaultLang)
    .map((file) => parsePostFile(langDir(defaultLang), file, defaultLang))
    .filter((post) => !post.data.draft && !have.has(post.slug));

  return [...primary, ...fallbacks].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function getPostBySlug(slug: string, lang: Language = defaultLang): BlogPost | undefined {
  const preferredDir = langDir(lang);
  for (const file of listPostFiles(lang)) {
    if (file.replace(/\.mdx?$/, '') !== slug) continue;
    const post = parsePostFile(preferredDir, file, lang);
    if (post.data.draft) return undefined;
    return post;
  }

  if (lang !== defaultLang) {
    return getPostBySlug(slug, defaultLang);
  }

  return undefined;
}

export function getAllTags(lang: Language = defaultLang): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts(lang)) {
    for (const tag of post.data.tags) tags.add(tag);
  }
  return [...tags].sort();
}
