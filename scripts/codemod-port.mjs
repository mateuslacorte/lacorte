// One-shot codemod: adapt components copied from the Astro site to Next.js.
// - Adds 'use client' to interactive components/hooks
// - Rebrands restato -> lacorte storage keys and UI strings
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET_DIRS = ['src/components', 'src/hooks'];

const HOOK_RE = /\buse(State|Effect|Ref|Callback|Memo|Reducer|LayoutEffect|Translation|ChatService|ScrollToBottom|TimeFormat)\b|\bonClick=|\bonChange=|\bonSubmit=|\bwindow\.|\bdocument\.|\blocalStorage\b/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

let clientCount = 0;
let brandCount = 0;

for (const dir of TARGET_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (!/\.(tsx|ts)$/.test(file)) continue;
    if (file.includes('__tests__') || file.includes('.test.')) continue;
    let src = readFileSync(file, 'utf8');
    const original = src;

    // Brand: storage keys and visible strings
    src = src
      .replaceAll('restato_', 'lacorte_')
      .replaceAll('restato-llm-wiki', 'lacorte-llm-wiki')
      .replaceAll('restato.github.io', 'lacorte.dev')
      .replaceAll('Restato', 'lacorte.dev');

    if (src !== original) brandCount++;

    // 'use client' for interactive .tsx components
    if (
      file.endsWith('.tsx') &&
      !src.startsWith("'use client'") &&
      !src.startsWith('"use client"') &&
      HOOK_RE.test(src)
    ) {
      src = "'use client';\n\n" + src;
      clientCount++;
    }

    if (src !== original) writeFileSync(file, src);
  }
}

console.log(`use client added: ${clientCount}, rebranded files: ${brandCount}`);
