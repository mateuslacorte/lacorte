'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';
import { IMAGE_CROP_PRESETS } from '../../lib/imageCropPresets';

interface ImageInfo {
  file: File;
  url: string;
  width: number;
  height: number;
}

type CropMode = 'free' | 'output';
type ResizeMode = 'custom' | 'preset';

const DEFAULT_CROP: Crop = {
  unit: '%',
  x: 5,
  y: 5,
  width: 90,
  height: 90,
};

const clampDimension = (value: number) => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10000, Math.max(1, Math.round(value)));
};

const SCALE_PRESETS = [
  { label: '50%', factor: 0.5 },
  { label: '75%', factor: 0.75 },
  { label: '100%', factor: 1 },
  { label: '150%', factor: 1.5 },
  { label: '200%', factor: 2 },
];

export default function ImageResizer({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.imageResizer;
  const tc = translations.tools.common;

  const [original, setOriginal] = useState<ImageInfo | null>(null);
  const [resized, setResized] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    width: 800,
    height: 600,
    keepAspectRatio: true,
    quality: 80,
    format: 'jpeg' as 'jpeg' | 'png' | 'webp',
  });
  const [crop, setCrop] = useState<Crop | undefined>();
  const [cropMode, setCropMode] = useState<CropMode>('free');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('custom');
  const [selectedPresetId, setSelectedPresetId] = useState(IMAGE_CROP_PRESETS[0].id);
  const [resizedSize, setResizedSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const renderVersionRef = useRef(0);

  const selectedPreset = IMAGE_CROP_PRESETS.find((preset) => preset.id === selectedPresetId) ?? IMAGE_CROP_PRESETS[0];
  const outputAspect = settings.width / settings.height;

  const createCenteredAspectCrop = useCallback((aspect: number, width: number, height: number) => {
    return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width,
      height
    );
  }, []);

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
      setSettings((prev) => ({
        ...prev,
        width: img.width,
        height: img.height,
      }));
      sourceImageRef.current = null;
      setCrop(undefined);
      setCropMode('free');
      setResized(null);
      setResizedSize(null);
    };

    img.src = url;
  }, []);

  useEffect(() => {
    if (resizeMode !== 'preset' || !selectedPreset) return;

    setSettings((prev) => {
      if (prev.width === selectedPreset.width && prev.height === selectedPreset.height) {
        return prev;
      }

      return {
        ...prev,
        width: selectedPreset.width,
        height: selectedPreset.height,
      };
    });
  }, [resizeMode, selectedPreset]);

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

  const handleWidthChange = (value: number) => {
    const nextWidth = clampDimension(value);

    if (settings.keepAspectRatio && original) {
      const ratio = original.height / original.width;
      setSettings((prev) => ({
        ...prev,
        width: nextWidth,
        height: clampDimension(nextWidth * ratio),
      }));
    } else {
      setSettings((prev) => ({ ...prev, width: nextWidth }));
    }
  };

  const handleHeightChange = (value: number) => {
    const nextHeight = clampDimension(value);

    if (settings.keepAspectRatio && original) {
      const ratio = original.width / original.height;
      setSettings((prev) => ({
        ...prev,
        height: nextHeight,
        width: clampDimension(nextHeight * ratio),
      }));
    } else {
      setSettings((prev) => ({ ...prev, height: nextHeight }));
    }
  };

  const onSourceImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    sourceImageRef.current = img;

    if (crop) return;

    if (cropMode === 'output') {
      setCrop(createCenteredAspectCrop(outputAspect, img.width, img.height));
      return;
    }

    setCrop(DEFAULT_CROP);
  }, [crop, cropMode, createCenteredAspectCrop, outputAspect]);

  useEffect(() => {
    if (!original) return;

    if (cropMode === 'output') {
      const nextCrop = createCenteredAspectCrop(outputAspect, original.width, original.height);
      setCrop((prev) => {
        if (
          prev &&
          prev.unit === nextCrop.unit &&
          prev.x === nextCrop.x &&
          prev.y === nextCrop.y &&
          prev.width === nextCrop.width &&
          prev.height === nextCrop.height
        ) {
          return prev;
        }
        return nextCrop;
      });
      return;
    }

    setCrop((prev) => prev ?? DEFAULT_CROP);
  }, [cropMode, createCenteredAspectCrop, original, outputAspect]);

  const renderPreview = useCallback(() => {
    if (!original || !crop || !sourceImageRef.current || !canvasRef.current) return;
    if (!crop.width || !crop.height) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = sourceImageRef.current;
    const naturalWidth = image.naturalWidth || original.width;
    const naturalHeight = image.naturalHeight || original.height;
    const cropX = ((crop.x ?? 0) / 100) * naturalWidth;
    const cropY = ((crop.y ?? 0) / 100) * naturalHeight;
    const cropWidth = (crop.width / 100) * naturalWidth;
    const cropHeight = (crop.height / 100) * naturalHeight;

    if (cropWidth <= 0 || cropHeight <= 0) return;

    canvas.width = settings.width;
    canvas.height = settings.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      settings.width,
      settings.height
    );

    const mimeType = `image/${settings.format}`;
    const quality = settings.format === 'png' ? undefined : settings.quality / 100;
    const renderVersion = ++renderVersionRef.current;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    setResized(dataUrl);
    canvas.toBlob((blob) => {
      if (renderVersion !== renderVersionRef.current) return;
      setResizedSize(blob ? blob.size : null);
    }, mimeType, quality);
  }, [crop, original, settings]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  useEffect(() => {
    return () => {
      if (original) {
        URL.revokeObjectURL(original.url);
      }
    };
  }, [original]);

  const download = () => {
    if (!resized) return;

    const fileName = resizeMode === 'preset'
      ? `${selectedPreset.id}.${settings.format}`
      : `resized.${settings.format}`;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = resized;
    link.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          {/* Resize Mode */}
          <div className="space-y-2">
            <span className="text-sm text-[var(--color-text)]">{t(tt.mode)}:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setResizeMode('custom')}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors
                  ${resizeMode === 'custom'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                  }`}
              >
                {t(tt.customMode)}
              </button>
              <button
                onClick={() => setResizeMode('preset')}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors
                  ${resizeMode === 'preset'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                  }`}
              >
                {t(tt.presetMode)}
              </button>
            </div>
          </div>

          {/* Settings */}
          {resizeMode === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Width */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.width)} (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
                  bg-[var(--color-card)] text-[var(--color-text)]
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

            {/* Height */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.height)} (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
                  bg-[var(--color-card)] text-[var(--color-text)]
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Preset Settings */}
          {resizeMode === 'preset' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text)]">
                {t(tt.preset)}
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
                  bg-[var(--color-card)] text-[var(--color-text)]
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {IMAGE_CROP_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {IMAGE_CROP_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`px-2 py-2 text-xs rounded-lg border transition-colors
                      ${selectedPresetId === preset.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                      }`}
                  >
                    {preset.width} x {preset.height}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t(tt.presetHint)}
              </p>
            </div>
          )}

          {/* Options */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Keep Aspect Ratio */}
            {resizeMode === 'custom' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.keepAspectRatio}
                  onChange={(e) => setSettings((prev) => ({ ...prev, keepAspectRatio: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-primary-500
                  focus:ring-primary-500"
                />
                <span className="text-sm text-[var(--color-text)]">{t(tt.keepAspectRatio)}</span>
              </label>
            )}

            {/* Quality */}
            {settings.format !== 'png' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--color-text)]">{t(tt.quality)}:</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => setSettings((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                  className="w-24 accent-primary-500"
                />
                <span className="text-sm text-[var(--color-text-muted)]">{settings.quality}%</span>
              </div>
            )}

            {/* Format */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--color-text)]">{t(tt.format)}:</label>
              <select
                value={settings.format}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  format: e.target.value as typeof settings.format,
                }))}
                className="px-3 py-1 rounded border border-[var(--color-border)]
                  bg-[var(--color-card)] text-[var(--color-text)]"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
          </div>

          {/* Crop Mode */}
          <div className="space-y-2">
            <span className="text-sm text-[var(--color-text)]">{t(tt.crop)}:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCropMode('free')}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors
                  ${cropMode === 'free'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                  }`}
              >
                {t(tt.cropFree)}
              </button>
              <button
                onClick={() => setCropMode('output')}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors
                  ${cropMode === 'output'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
                  }`}
              >
                {t(tt.cropLocked)}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{t(tt.autoApplied)}</p>
          </div>

          {/* Quick Presets */}
          {resizeMode === 'custom' && (
            <div className="flex flex-wrap gap-2">
              {SCALE_PRESETS.map(({ label, factor }) => (
                <button
                  key={label}
                  onClick={() => {
                    setSettings((prev) => ({
                      ...prev,
                      width: Math.round(original.width * factor),
                      height: Math.round(original.height * factor),
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                  border border-[var(--color-border)] rounded transition-colors"
                >
                  {label}
                </button>
              ))}
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
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)] p-3">
                <div className="flex justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                    aspect={cropMode === 'output' ? outputAspect : undefined}
                    ruleOfThirds
                  >
                    <img
                      src={original.url}
                      alt="Original"
                      onLoad={onSourceImageLoad}
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </ReactCrop>
                </div>
              </div>
            </div>

            {/* Resized */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-text)]">{t(tt.resized)}</span>
                {resized && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {t(tt.outputSize)}: {settings.width} x {settings.height}
                    {resizedSize ? ` • ${formatBytes(resizedSize)}` : ''}
                  </span>
                )}
              </div>
              {resizeMode === 'preset' && selectedPreset && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t(tt.presetOutput)}: {selectedPreset.label}
                </p>
              )}
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)] min-h-[200px] flex items-center justify-center">
                {resized ? (
                  <img
                    src={resized}
                    alt="Resized"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                ) : (
                  <span className="text-[var(--color-text-muted)] text-sm">
                    {t(tt.livePreview)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              setOriginal(null);
              setCrop(undefined);
              setResized(null);
              setResizedSize(null);
              sourceImageRef.current = null;
              setCropMode('free');
            }}
            className="w-full py-3 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors"
          >
            {t(tc.reset)}
          </button>

          {/* Download */}
          {resized && (
            <button
              onClick={download}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg
                font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t(tc.download)}
            </button>
          )}
        </>
      )}
    </div>
  );
}
