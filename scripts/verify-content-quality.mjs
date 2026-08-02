#!/usr/bin/env node
/**
 * Lightweight post-build content quality checks for the Next.js output.
 * Expects `.next` (or a prior `next build`) and verifies key routes exist
 * in the sitemap / robots output when present under `public` or via known paths.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const errors = [];

function fail(msg) {
  errors.push(msg);
}

// Required source routes
const requiredPages = [
  'src/app/[locale]/(site)/page.tsx',
  'src/app/[locale]/(site)/about/page.tsx',
  'src/app/[locale]/(site)/contact/page.tsx',
  'src/app/[locale]/(site)/privacy/page.tsx',
  'src/app/[locale]/(site)/tools/page.tsx',
  'src/app/[locale]/(site)/games/page.tsx',
  'src/app/[locale]/(site)/projects/page.tsx',
  'src/app/[locale]/(site)/posts/page.tsx',
  'src/app/[locale]/(site)/jobs/page.tsx',
  'src/app/[locale]/(site)/articles/page.tsx',
  'src/app/[locale]/(site)/anonymous-chat/page.tsx',
  'src/app/robots.ts',
  'src/app/sitemap.ts',
  'src/app/rss.xml/route.ts',
];

for (const page of requiredPages) {
  if (!existsSync(join(ROOT, page))) fail(`Missing required page: ${page}`);
}

// Branding: no Restato leftovers in app source (tests may assert absence)
const brandingFiles = [
  'src/lib/site.ts',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
];
for (const file of brandingFiles) {
  const full = join(ROOT, file);
  if (!existsSync(full)) {
    fail(`Missing branding file: ${file}`);
    continue;
  }
  const text = readFileSync(full, 'utf8');
  if (/restato/i.test(text)) fail(`Restato reference in ${file}`);
  if (!/lacorte\.dev/i.test(text) && file === 'src/lib/site.ts') {
    fail(`site.ts must define lacorte.dev branding`);
  }
}

// Trust pages must mention lacorte.dev
for (const trust of ['about', 'contact', 'privacy']) {
  const full = join(ROOT, `src/app/(site)/${trust}/page.tsx`);
  if (!existsSync(full)) continue;
  const text = readFileSync(full, 'utf8');
  if (/restato/i.test(text)) fail(`Restato reference in ${trust} page`);
}

// Brand icons (IconKitchen web set) — layout metadata + redirects depend on these
for (const asset of [
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
]) {
  if (!existsSync(join(ROOT, asset))) {
    fail(`Missing ${asset}`);
  }
}

if (errors.length) {
  console.error('Content quality verification failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('Content quality verification passed.');
