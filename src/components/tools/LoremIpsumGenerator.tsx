'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi',
  'nesciunt', 'neque', 'porro', 'quisquam', 'nihil', 'impedit', 'quo', 'minus',
];

const FIRST_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

type GenerationType = 'paragraphs' | 'sentences' | 'words';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateSentence(wordCount?: number): string {
  const count = wordCount || Math.floor(Math.random() * 10) + 5;
  const words: string[] = [];

  for (let i = 0; i < count; i++) {
    words.push(randomWord());
  }

  return capitalize(words.join(' ')) + '.';
}

function generateParagraph(sentenceCount?: number): string {
  const count = sentenceCount || Math.floor(Math.random() * 4) + 3;
  const sentences: string[] = [];

  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }

  return sentences.join(' ');
}

export default function LoremIpsumGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.loremIpsum;
  const tc = translations.tools.common;

  const [type, setType] = useState<GenerationType>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let result = '';

    switch (type) {
      case 'paragraphs':
        const paragraphs: string[] = [];
        for (let i = 0; i < count; i++) {
          if (i === 0 && startWithLorem) {
            paragraphs.push(FIRST_SENTENCE + ' ' + generateParagraph(Math.floor(Math.random() * 3) + 2));
          } else {
            paragraphs.push(generateParagraph());
          }
        }
        result = paragraphs.join('\n\n');
        break;

      case 'sentences':
        const sentences: string[] = [];
        for (let i = 0; i < count; i++) {
          if (i === 0 && startWithLorem) {
            sentences.push(FIRST_SENTENCE);
          } else {
            sentences.push(generateSentence());
          }
        }
        result = sentences.join(' ');
        break;

      case 'words':
        const words: string[] = [];
        if (startWithLorem) {
          words.push('Lorem', 'ipsum');
        }
        for (let i = words.length; i < count; i++) {
          words.push(randomWord());
        }
        result = words.join(' ');
        break;
    }

    setOutput(result);
    setCopied(false);
  }, [type, count, startWithLorem]);

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const typeOptions: { value: GenerationType; label: { en: string; pt?: string } }[] = [
    { value: 'paragraphs', label: tt.paragraphs },
    { value: 'sentences', label: tt.sentences },
    { value: 'words', label: tt.words },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Type Selection */}
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        {typeOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setType(value);
              setCount(value === 'words' ? 50 : value === 'sentences' ? 5 : 3);
            }}
            className={`flex-1 py-3 font-medium transition-colors
              ${type === value
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
              }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">{t(tt.count)}:</label>
          <input
            type="number"
            min="1"
            max={type === 'words' ? 1000 : type === 'sentences' ? 100 : 20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
            className="w-20 px-3 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-center
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-primary-500
              focus:ring-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">{t(tt.startWithLorem)}</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
          font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t(tc.generate)}
      </button>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-[var(--color-text)]">
              {t(tc.result)}
            </label>
            <button
              onClick={copyOutput}
              className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {copied ? t(tc.copied) : t(tc.copy)}
            </button>
          </div>
          <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]
            max-h-96 overflow-y-auto">
            <p className="whitespace-pre-wrap text-[var(--color-text)]">{output}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-sm text-[var(--color-text-muted)] text-center">
        {t(tt.aboutNote)}
      </p>
    </div>
  );
}
