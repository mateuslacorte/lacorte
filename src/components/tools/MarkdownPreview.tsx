'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

// Simple markdown parser
function parseMarkdown(md: string): string {
  let html = md;

  // Escape HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-bold mt-4 mb-2">$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-base font-bold mt-4 mb-2">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');

  // Blockquote
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-600 dark:text-gray-400">$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr class="my-6 border-t border-gray-300 dark:border-gray-600"/>');
  html = html.replace(/^\*\*\*$/gim, '<hr class="my-6 border-t border-gray-300 dark:border-gray-600"/>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>');

  // Wrap lists
  html = html.replace(/(<li class="ml-6 list-disc">.*<\/li>\n?)+/g, '<ul class="my-4">$&</ul>');
  html = html.replace(/(<li class="ml-6 list-decimal">.*<\/li>\n?)+/g, '<ol class="my-4">$&</ol>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-4"/>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-4">');
  html = '<p class="my-4">' + html + '</p>';

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  // Clean up empty paragraphs
  html = html.replace(/<p class="my-4"><\/p>/g, '');
  html = html.replace(/<p class="my-4"><br\/><\/p>/g, '');

  return html;
}

const SAMPLE_MARKDOWN = `# Markdown Preview

This is a **bold** and *italic* text demo.

## Features

- Headings
- **Bold** and *italic*
- ~~Strikethrough~~
- Lists (ordered and unordered)
- \`inline code\`
- Code blocks
- [Links](https://example.com)
- Blockquotes

### Code Block

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> This is a blockquote

---

1. First item
2. Second item
3. Third item
`;

export default function MarkdownPreview({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.markdown;
  const tc = translations.tools.common;

  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => parseMarkdown(markdown), [markdown]);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Editor and Preview Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-[var(--color-text)]">
              {t(tt.editor)}
            </label>
            <button
              onClick={() => setMarkdown('')}
              className="px-3 py-1 text-xs bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded transition-colors"
            >
              {t(tc.clear)}
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={t(tt.placeholder)}
            className="w-full h-[500px] px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-[var(--color-text)]">
              {t(tt.preview)}
            </label>
            <button
              onClick={copyHtml}
              className="px-3 py-1 text-xs bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded transition-colors"
            >
              {copied ? t(tc.copied) : 'Copy HTML'}
            </button>
          </div>
          <div
            className="w-full h-[500px] px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-bg)] overflow-y-auto prose prose-sm max-w-none
              dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Syntax Guide */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t(tt.syntaxGuide)}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[var(--color-text-muted)] font-mono">
          <span># H1</span>
          <span>## H2</span>
          <span>**bold**</span>
          <span>*italic*</span>
          <span>`code`</span>
          <span>[link](url)</span>
          <span>- list</span>
          <span>&gt; quote</span>
        </div>
      </div>
    </div>
  );
}
