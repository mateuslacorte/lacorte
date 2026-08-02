'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ConvertedImage {
  original: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
  converted: {
    url: string;
    size: number;
    format: string;
  } | null;
}

type OutputFormat = 'jpeg' | 'png' | 'webp';

export default function ImageConverter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.imageConverter;
  const common = translations.tools.common;

  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const supportedFormats = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
    'image/heic', 'image/heif', 'image/avif', 'image/tiff'
  ];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertImage = useCallback(async (file: File): Promise<ConvertedImage> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            resolve({
              original: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: e.target?.result as string,
              },
              converted: null,
            });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              original: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: e.target?.result as string,
              },
              converted: null,
            });
            return;
          }

          ctx.drawImage(img, 0, 0);

          const mimeType = `image/${outputFormat}`;
          const qualityValue = outputFormat === 'png' ? undefined : quality / 100;
          const dataUrl = canvas.toDataURL(mimeType, qualityValue);

          // Calculate approximate size
          const base64Length = dataUrl.length - `data:${mimeType};base64,`.length;
          const convertedSize = Math.round((base64Length * 3) / 4);

          resolve({
            original: {
              name: file.name,
              size: file.size,
              type: file.type || 'unknown',
              url: e.target?.result as string,
            },
            converted: {
              url: dataUrl,
              size: convertedSize,
              format: outputFormat.toUpperCase(),
            },
          });
        };

        img.onerror = () => {
          resolve({
            original: {
              name: file.name,
              size: file.size,
              type: file.type,
              url: '',
            },
            converted: null,
          });
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  }, [outputFormat, quality]);

  const handleFiles = async (files: FileList) => {
    setIsConverting(true);
    const newImages: ConvertedImage[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') || file.name.match(/\.(heic|heif|raw|cr2|nef|arw|dng|orf|rw2)$/i)) {
        const result = await convertImage(file);
        newImages.push(result);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsConverting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    if (!image.converted) return;
    const link = document.createElement('a');
    const baseName = image.original.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}.${image.converted.format.toLowerCase()}`;
    link.href = image.converted.url;
    link.click();
  };

  const downloadAll = () => {
    images.forEach((image) => {
      if (image.converted) {
        downloadImage(image);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setImages([]);
  };

  const reconvertAll = async () => {
    setIsConverting(true);
    const newImages: ConvertedImage[] = [];

    for (const image of images) {
      // Re-fetch the original image and convert
      const response = await fetch(image.original.url);
      const blob = await response.blob();
      const file = new File([blob], image.original.name, { type: image.original.type });
      const result = await convertImage(file);
      newImages.push(result);
    }

    setImages(newImages);
    setIsConverting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.raw,.cr2,.nef,.arw,.dng,.orf,.rw2"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Settings */}
      <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">
            {t(tc.outputFormat)}:
          </label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-bg)] text-[var(--color-text)]"
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        {outputFormat !== 'png' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text)]">
              {t(tc.quality)}:
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-24 accent-primary-500"
            />
            <span className="text-sm text-[var(--color-text-muted)] w-10">{quality}%</span>
          </div>
        )}

        {images.length > 0 && (
          <button
            onClick={reconvertAll}
            disabled={isConverting}
            className="px-3 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              transition-colors disabled:opacity-50"
          >
            {t(tc.reconvert)}
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed
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
        <div className="text-center">
          <p className="text-[var(--color-text)]">
            {t(tc.dropzone)}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {t(tc.dropzoneHint)}
          </p>
        </div>
      </div>

      {/* Converting indicator */}
      {isConverting && (
        <div className="flex items-center justify-center gap-2 p-4">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-text)]">
            {t(tc.converting)}
          </span>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg
                transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t(tc.downloadAll)}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {t(tc.clearAll)}
            </button>
          </div>

          {/* Image list */}
          <div className="space-y-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-bg)]">
                  {image.converted?.url ? (
                    <img
                      src={image.converted.url}
                      alt={image.original.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text)] truncate">{image.original.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                    <span>{t(tc.original)}: {formatBytes(image.original.size)}</span>
                    {image.converted && (
                      <>
                        <span>→</span>
                        <span className="text-green-500 font-medium">
                          {image.converted.format}: {formatBytes(image.converted.size)}
                        </span>
                        {image.original.size > 0 && (
                          <span className={image.converted.size < image.original.size ? 'text-green-500' : 'text-yellow-500'}>
                            ({image.converted.size < image.original.size ? '-' : '+'}
                            {Math.abs(Math.round((1 - image.converted.size / image.original.size) * 100))}%)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!image.converted && (
                    <p className="text-sm text-red-500">
                      {t(tc.conversionFailed)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {image.converted && (
                    <button
                      onClick={() => downloadImage(image)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      title={t(common.download)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    title={t(tc.remove)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {t(tc.aboutNote)}
        </p>
      </div>
    </div>
  );
}
