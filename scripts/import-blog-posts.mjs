#!/usr/bin/env node
/**
 * Import Markdown posts from the standalone blog repo into src/content/blog/en/.
 *
 * Usage:
 *   node scripts/import-blog-posts.mjs
 *   node scripts/import-blog-posts.mjs /path/to/blog
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SOURCE_ROOT = resolve(process.argv[2] ?? join(ROOT, '..', 'blog'));
const SOURCE_DIR = join(SOURCE_ROOT, 'content', 'posts');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog', 'en');

function transformBody(body) {
  // Normalize legacy /blog links from intermediate imports to /posts.
  return body.replace(/\]\(\/blog\//g, '](/posts/');
}

function transformFrontmatter(data) {
  const next = { ...data };
  if (!next.description && next.excerpt) {
    next.description = next.excerpt;
  }
  delete next.excerpt;
  return next;
}

if (!existsSync(SOURCE_DIR)) {
  console.error(`Source posts directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

mkdirSync(BLOG_DIR, { recursive: true });

const files = readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.md'));
let imported = 0;

for (const file of files) {
  const raw = readFileSync(join(SOURCE_DIR, file), 'utf8');
  const { data, content } = matter(raw);
  const transformed = matter.stringify(transformBody(content), transformFrontmatter(data));
  writeFileSync(join(BLOG_DIR, file), transformed, 'utf8');
  imported += 1;
  console.log(`imported ${file}`);
}

console.log(`Done. Imported ${imported} posts into ${BLOG_DIR}`);
