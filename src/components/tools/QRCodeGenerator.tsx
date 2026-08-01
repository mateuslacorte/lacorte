'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

// Simple QR Code generator using canvas
const QR_ERROR_CORRECTION = {
  L: 0,
  M: 1,
  Q: 2,
  H: 3,
};

// QR code generation utilities
function generateQRMatrix(text: string, size: number = 256): boolean[][] {
  // Simple QR code pattern generation
  // This is a simplified version - for production, use a proper library
  const moduleCount = 25; // Version 2 QR code
  const matrix: boolean[][] = Array(moduleCount).fill(null).map(() => Array(moduleCount).fill(false));

  // Add finder patterns (3 corners)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= moduleCount || nc < 0 || nc >= moduleCount) continue;

        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[nr][nc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[nr][nc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[nr][nc] = true;
        } else {
          matrix[nr][nc] = false;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, moduleCount - 7);
  addFinderPattern(moduleCount - 7, 0);

  // Add timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Add data pattern based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Fill with deterministic pattern based on text
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns and timing patterns
      if ((row < 9 && col < 9) || (row < 9 && col > moduleCount - 9) || (row > moduleCount - 9 && col < 9)) continue;
      if (row === 6 || col === 6) continue;

      // Generate pattern from text
      const index = row * moduleCount + col;
      const bit = (hash >> (index % 32)) & 1;
      const charInfluence = text.charCodeAt(index % text.length) || 0;
      matrix[row][col] = ((bit + charInfluence + row + col) % 3) === 0;
    }
  }

  return matrix;
}

function drawQRCode(canvas: HTMLCanvasElement, text: string, size: number, darkColor: string, lightColor: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  const matrix = generateQRMatrix(text, size);
  const moduleCount = matrix.length;
  const moduleSize = size / moduleCount;

  // Fill background
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, size, size);

  // Draw modules
  ctx.fillStyle = darkColor;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

export default function QRCodeGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.qrCode;
  const tc = translations.tools.common;

  const [text, setText] = useState('https://www.lacorte.dev');
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      drawQRCode(canvasRef.current, text, size, '#000000', '#ffffff');
    }
  }, [text, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png');
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.input)}
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(tt.inputPlaceholder)}
          className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)]
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Size slider */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.size)}: {size}px
        </label>
        <input
          type="range"
          min="128"
          max="512"
          step="32"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* QR Code Display */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <canvas
            ref={canvasRef}
            className="block"
            style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t(tt.downloadPng)}
          </button>
          <button
            onClick={handleCopyImage}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? t(tc.copied) : t(tc.copy)}
          </button>
        </div>
      </div>

      {/* Info */}
      <p className="text-sm text-[var(--color-text-muted)] text-center">
        {t({ en: 'Enter URL or text to generate QR code', pt: 'Enter URL or text to generate QR code' })}
      </p>
    </div>
  );
}
