'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ImageInfo {
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function BackgroundRemover({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.backgroundRemover;
  const tc = translations.tools.common;

  const [original, setOriginal] = useState<ImageInfo | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [customColor, setCustomColor] = useState('#ffffff');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setOriginal({
        file,
        url,
        width: img.width,
        height: img.height,
      });
      setResult(null);
      setError(null);
      setProgress(0);
    };

    img.src = url;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeBackground = async () => {
    if (!original) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Dynamically import the library to avoid SSR issues
      const { removeBackground: removeBg } = await import('@imgly/background-removal');

      const blob = await removeBg(original.file, {
        progress: (key, current, total) => {
          const percent = Math.round((current / total) * 100);
          setProgress(percent);
        },
      });

      const resultUrl = URL.createObjectURL(blob);
      setResult(resultUrl);
    } catch (err) {
      console.error('Background removal error:', err);
      setError(t(tt.errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  const applyBackground = useCallback(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Fill background if not transparent
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor === 'custom' ? customColor : bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
    };
    img.src = result;
  }, [result, bgColor, customColor]);

  useEffect(() => {
    if (result) {
      applyBackground();
    }
  }, [result, bgColor, customColor, applyBackground]);

  const download = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const downloadOriginalResult = () => {
    if (!result) return;

    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = result;
    link.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const backgroundOptions = [
    { value: 'transparent', label: t(tt.transparent), color: 'transparent' },
    { value: 'white', label: t(tt.white), color: '#ffffff' },
    { value: 'black', label: t(tt.black), color: '#000000' },
    { value: 'custom', label: t(tt.customColor), color: customColor },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop Zone */}
      {!original && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed
            rounded-xl cursor-pointer transition-colors
            ${isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-[var(--color-border)] hover:border-primary-500 hover:bg-[var(--color-card)]'
            }`}
        >
          <svg className="w-12 h-12 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[var(--color-text-muted)] text-center">
            {t(tt.dropzone)}
          </p>
        </div>
      )}

      {/* Image Loaded */}
      {original && (
        <>
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={removeBackground}
              disabled={isProcessing}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
                font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t(tt.processing)} ({progress}%)
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t(tt.removeButton)}
                </>
              )}
            </button>
            <button
              onClick={() => {
                setOriginal(null);
                setResult(null);
                setError(null);
                setProgress(0);
              }}
              className="px-4 py-3 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {t(tc.reset)}
            </button>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-text)]">{t(tt.original)}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {original.width} x {original.height} • {formatBytes(original.file.size)}
                </span>
              </div>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]">
                <img
                  src={original.url}
                  alt="Original"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>

            {/* Result */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-text)]">{t(tt.result)}</span>
              </div>
              <div
                className="border border-[var(--color-border)] rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center"
                style={{
                  backgroundImage: result && bgColor === 'transparent'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : 'none',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: result && bgColor !== 'transparent'
                    ? (bgColor === 'custom' ? customColor : bgColor)
                    : 'var(--color-bg)',
                }}
              >
                {result ? (
                  <img
                    src={result}
                    alt="Result"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                ) : (
                  <span className="text-[var(--color-text-muted)] text-sm">
                    {t(tt.clickRemove)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Background Options */}
          {result && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                {t(tt.backgroundColor)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBgColor(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                      ${bgColor === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-[var(--color-border)] hover:border-primary-500'
                      }`}
                  >
                    <span
                      className="w-5 h-5 rounded border border-[var(--color-border)]"
                      style={{
                        backgroundColor: option.value === 'transparent' ? 'transparent' : option.color,
                        backgroundImage: option.value === 'transparent'
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                          : 'none',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                      }}
                    />
                    <span className="text-sm text-[var(--color-text)]">{option.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color Picker */}
              {bgColor === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)]
                      bg-[var(--color-card)] text-[var(--color-text)] w-28"
                  />
                </div>
              )}
            </div>
          )}

          {/* Download */}
          {result && (
            <div className="flex gap-2">
              <button
                onClick={bgColor === 'transparent' ? downloadOriginalResult : download}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg
                  font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t(tc.download)} (PNG)
              </button>
            </div>
          )}

          {/* Info Note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {t(tt.infoNote)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
