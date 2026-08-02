'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface DiffLine {
  type: 'same' | 'add' | 'remove' | 'modify';
  lineNum1?: number;
  lineNum2?: number;
  content: string;
  oldContent?: string;
}

function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  // Simple LCS-based diff
  const m = lines1.length;
  const n = lines2.length;

  // Create LCS table
  const lcs: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const diff: DiffLine[] = [];
  let i = m;
  let j = n;

  const tempDiff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      tempDiff.unshift({
        type: 'same',
        lineNum1: i,
        lineNum2: j,
        content: lines1[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      tempDiff.unshift({
        type: 'add',
        lineNum2: j,
        content: lines2[j - 1],
      });
      j--;
    } else {
      tempDiff.unshift({
        type: 'remove',
        lineNum1: i,
        content: lines1[i - 1],
      });
      i--;
    }
  }

  return tempDiff;
}

function getDiffStats(diff: DiffLine[]): { additions: number; deletions: number; unchanged: number } {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  diff.forEach((line) => {
    if (line.type === 'add') additions++;
    else if (line.type === 'remove') deletions++;
    else unchanged++;
  });

  return { additions, deletions, unchanged };
}

export default function DiffTool({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.diff;
  const common = translations.tools.common;

  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diff = useMemo(() => {
    let t1 = text1;
    let t2 = text2;

    if (ignoreWhitespace) {
      t1 = t1.replace(/\s+/g, ' ').trim();
      t2 = t2.replace(/\s+/g, ' ').trim();
    }

    return computeDiff(t1, t2);
  }, [text1, text2, ignoreWhitespace]);

  const stats = useMemo(() => getDiffStats(diff), [diff]);

  const loadExample = () => {
    setText1(`function hello() {
  console.log("Hello");
  return true;
}

const name = "World";`);
    setText2(`function hello() {
  console.log("Hello, World!");
  return true;
}

function goodbye() {
  console.log("Goodbye!");
}

const name = "Universe";`);
  };

  const swapTexts = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
  };

  const clearAll = () => {
    setText1('');
    setText2('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={loadExample}
          className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(common.loadExample)}
        </button>
        <button
          onClick={swapTexts}
          className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(tc.swap)}
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(common.clear)}
        </button>

        <div className="flex-1" />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLineNumbers}
            onChange={(e) => setShowLineNumbers(e.target.checked)}
            className="w-4 h-4 rounded text-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">
            {t(tc.lineNumbers)}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            className="w-4 h-4 rounded text-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">
            {t(tc.ignoreWhitespace)}
          </span>
        </label>
      </div>

      {/* Input Areas */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.originalText)}
          </label>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder={t(tc.originalPlaceholder)}
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-y
              focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.changedText)}
          </label>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder={t(tc.changedPlaceholder)}
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-y
              focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Stats */}
      {(text1 || text2) && (
        <div className="flex gap-4 justify-center">
          <span className="px-3 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
            +{stats.additions} {t(tc.additions)}
          </span>
          <span className="px-3 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            -{stats.deletions} {t(tc.deletions)}
          </span>
          <span className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
            {stats.unchanged} {t(tc.unchanged)}
          </span>
        </div>
      )}

      {/* Diff Output */}
      {diff.length > 0 && (text1 || text2) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.differences)}
          </label>
          <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg)]">
            <div className="overflow-x-auto">
              <pre className="text-sm font-mono">
                {diff.map((line, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      line.type === 'add'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : line.type === 'remove'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : ''
                    }`}
                  >
                    {showLineNumbers && (
                      <span className="w-16 px-2 py-0.5 text-right text-[var(--color-text-muted)] border-r border-[var(--color-border)] select-none flex-shrink-0">
                        {line.type === 'remove' ? line.lineNum1 : ''}
                        {line.type === 'same' ? line.lineNum1 : ''}
                        {line.type === 'add' ? '' : ''}
                      </span>
                    )}
                    {showLineNumbers && (
                      <span className="w-16 px-2 py-0.5 text-right text-[var(--color-text-muted)] border-r border-[var(--color-border)] select-none flex-shrink-0">
                        {line.type === 'add' ? line.lineNum2 : ''}
                        {line.type === 'same' ? line.lineNum2 : ''}
                        {line.type === 'remove' ? '' : ''}
                      </span>
                    )}
                    <span className={`w-6 px-2 py-0.5 text-center flex-shrink-0 ${
                      line.type === 'add'
                        ? 'text-green-600 dark:text-green-400'
                        : line.type === 'remove'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[var(--color-text-muted)]'
                    }`}>
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    <span className={`flex-1 px-2 py-0.5 whitespace-pre ${
                      line.type === 'add'
                        ? 'text-green-800 dark:text-green-200'
                        : line.type === 'remove'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-[var(--color-text)]'
                    }`}>
                      {line.content || ' '}
                    </span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          {t(tc.aboutNote)}
        </p>
      </div>
    </div>
  );
}
