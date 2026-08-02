'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

async function generateHash(text: string, algorithm: Algorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Simple MD5 implementation (for client-side, not crypto.subtle)
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const result = (x & 0x7fffffff) + (y & 0x7fffffff);
    if (x & 0x80000000 || y & 0x80000000) {
      return result ^ 0x80000000;
    }
    return result;
  }

  function F(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function I(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function wordToHex(value: number): string {
    let result = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      result += byte.toString(16).padStart(2, '0');
    }
    return result;
  }

  const bytes = new TextEncoder().encode(string);
  const words: number[] = [];

  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      bytes[i] |
      ((bytes[i + 1] || 0) << 8) |
      ((bytes[i + 2] || 0) << 16) |
      ((bytes[i + 3] || 0) << 24)
    );
  }

  const originalLength = bytes.length * 8;
  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);

  while (words.length % 16 !== 14) {
    words.push(0);
  }
  words.push(originalLength & 0xffffffff);
  words.push(0);

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let i = 0; i < words.length; i += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    const x = words.slice(i, i + 16);

    a = FF(a, b, c, d, x[0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[2], 17, 0x242070db);
    b = FF(b, c, d, a, x[3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[10], 9, 0x02441453);
    c = GG(c, d, a, b, x[15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[6], 23, 0x04881d05);
    a = HH(a, b, c, d, x[9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[0], 6, 0xf4292244);
    d = II(d, a, b, c, x[7], 10, 0x432aff97);
    c = II(c, d, a, b, x[14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[6], 15, 0xa3014314);
    b = II(b, c, d, a, x[13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type AllAlgorithm = typeof algorithms[number];

export default function HashGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.hash;
  const tc = translations.tools.common;

  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<AllAlgorithm, string>>({
    'MD5': '',
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  });
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({
        'MD5': '',
        'SHA-1': '',
        'SHA-256': '',
        'SHA-384': '',
        'SHA-512': '',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const results: Record<AllAlgorithm, string> = {
        'MD5': md5(text),
        'SHA-1': await generateHash(text, 'SHA-1'),
        'SHA-256': await generateHash(text, 'SHA-256'),
        'SHA-384': await generateHash(text, 'SHA-384'),
        'SHA-512': await generateHash(text, 'SHA-512'),
      };
      setHashes(results);
    } catch (err) {
      console.error('Hash generation error:', err);
    }

    setIsGenerating(false);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    generateHashes(value);
  };

  const copyHash = async (algo: AllAlgorithm) => {
    try {
      await navigator.clipboard.writeText(hashes[algo]);
      setCopiedAlgo(algo);
      setTimeout(() => setCopiedAlgo(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.input)}
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t(tt.inputPlaceholder)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] resize-y
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Hash Results */}
      <div className="space-y-3">
        {algorithms.map((algo) => (
          <div
            key={algo}
            className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--color-text)]">{algo}</span>
              <button
                onClick={() => copyHash(algo)}
                disabled={!hashes[algo]}
                className="px-3 py-1 text-xs bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
                  border border-[var(--color-border)] rounded transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedAlgo === algo ? t(tc.copied) : t(tc.copy)}
              </button>
            </div>
            <code className="block text-sm font-mono text-[var(--color-text-muted)] break-all min-h-[1.5rem]">
              {isGenerating ? '...' : hashes[algo] || '-'}
            </code>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t(tt.securityWarning)}
        </p>
      </div>
    </div>
  );
}
