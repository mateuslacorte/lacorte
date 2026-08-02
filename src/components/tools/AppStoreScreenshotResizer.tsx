'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ScreenSize {
  id: string;
  label: string;
  width: number;
  height: number;
}

interface DeviceSpec {
  id: string;
  name: string;
  sizes: ScreenSize[];
}

const IPHONE_DEVICES: DeviceSpec[] = [
  {
    id: 'iphone-6.9',
    name: 'iPhone 6.9"',
    sizes: [
      { id: '6.9-1320x2868', label: '1320 × 2868', width: 1320, height: 2868 },
      { id: '6.9-1290x2796', label: '1290 × 2796', width: 1290, height: 2796 },
      { id: '6.9-1260x2736', label: '1260 × 2736', width: 1260, height: 2736 },
    ],
  },
  {
    id: 'iphone-6.5',
    name: 'iPhone 6.5"',
    sizes: [
      { id: '6.5-1284x2778', label: '1284 × 2778', width: 1284, height: 2778 },
      { id: '6.5-1242x2688', label: '1242 × 2688', width: 1242, height: 2688 },
    ],
  },
  {
    id: 'iphone-6.3',
    name: 'iPhone 6.3"',
    sizes: [
      { id: '6.3-1206x2622', label: '1206 × 2622', width: 1206, height: 2622 },
      { id: '6.3-1179x2556', label: '1179 × 2556', width: 1179, height: 2556 },
    ],
  },
  {
    id: 'iphone-6.1',
    name: 'iPhone 6.1"',
    sizes: [
      { id: '6.1-1170x2532', label: '1170 × 2532', width: 1170, height: 2532 },
      { id: '6.1-1125x2436', label: '1125 × 2436', width: 1125, height: 2436 },
      { id: '6.1-1080x2340', label: '1080 × 2340', width: 1080, height: 2340 },
    ],
  },
  {
    id: 'iphone-5.5',
    name: 'iPhone 5.5"',
    sizes: [
      { id: '5.5-1242x2208', label: '1242 × 2208', width: 1242, height: 2208 },
    ],
  },
];

const IPAD_DEVICES: DeviceSpec[] = [
  {
    id: 'ipad-13',
    name: 'iPad 13"',
    sizes: [
      { id: '13-2064x2752', label: '2064 × 2752', width: 2064, height: 2752 },
      { id: '13-2048x2732', label: '2048 × 2732', width: 2048, height: 2732 },
    ],
  },
  {
    id: 'ipad-11',
    name: 'iPad 11"',
    sizes: [
      { id: '11-1668x2388', label: '1668 × 2388', width: 1668, height: 2388 },
      { id: '11-1668x2420', label: '1668 × 2420', width: 1668, height: 2420 },
      { id: '11-1488x2266', label: '1488 × 2266', width: 1488, height: 2266 },
    ],
  },
];

interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  crop: Crop | null;
  processed: string | null;
  renderedWidth?: number;
  renderedHeight?: number;
}

type DeviceType = 'iphone' | 'ipad';
type Orientation = 'portrait' | 'landscape';

export default function AppStoreScreenshotResizer({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.appStoreScreenshot;
  const tc = translations.tools.common;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [deviceType, setDeviceType] = useState<DeviceType>('iphone');
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec>(IPHONE_DEVICES[0]);
  const [selectedSize, setSelectedSize] = useState<ScreenSize>(IPHONE_DEVICES[0].sizes[0]);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const devices = deviceType === 'iphone' ? IPHONE_DEVICES : IPAD_DEVICES;

  const targetWidth = orientation === 'portrait' ? selectedSize.width : selectedSize.height;
  const targetHeight = orientation === 'portrait' ? selectedSize.height : selectedSize.width;
  const aspect = targetWidth / targetHeight;

  const loadImages = useCallback((files: FileList) => {
    const newImages: ImageItem[] = [];
    const maxImages = 10;
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const url = URL.createObjectURL(file);
      const img = new Image();
      const id = `${Date.now()}-${i}`;

      img.onload = () => {
        const imageItem: ImageItem = {
          id,
          file,
          url,
          width: img.width,
          height: img.height,
          crop: null,
          processed: null,
        };
        setImages(prev => [...prev, imageItem]);
      };
      img.src = url;
    }
  }, [images.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadImages(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      loadImages(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDeviceTypeChange = (type: DeviceType) => {
    setDeviceType(type);
    const newDevices = type === 'iphone' ? IPHONE_DEVICES : IPAD_DEVICES;
    setSelectedDevice(newDevices[0]);
    setSelectedSize(newDevices[0].sizes[0]);
  };

  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setSelectedDevice(device);
      setSelectedSize(device.sizes[0]);
    }
  };

  const handleSizeChange = (sizeId: string) => {
    const size = selectedDevice.sizes.find(s => s.id === sizeId);
    if (size) {
      setSelectedSize(size);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Store rendered dimensions and set initial crop if needed
    setImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        if (!img.crop) {
          const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
            width,
            height
          );
          return { ...img, crop: initialCrop, renderedWidth: width, renderedHeight: height };
        }
        return { ...img, renderedWidth: width, renderedHeight: height };
      }
      return img;
    }));
  }, [aspect, activeImageIndex]);

  const handleCropChange = (crop: Crop, percentCrop: Crop) => {
    // Always store as percentage for consistency across different image sizes
    setImages(prev => prev.map((img, idx) =>
      idx === activeImageIndex ? { ...img, crop: percentCrop } : img
    ));
  };

  const applyToAll = () => {
    const currentCrop = images[activeImageIndex]?.crop;
    if (currentCrop) {
      setImages(prev => prev.map(img => ({ ...img, crop: currentCrop })));
    }
  };

  const processImage = useCallback(async (image: ImageItem): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!image.crop) {
        reject(new Error('No crop defined'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const img = new Image();
      img.onload = () => {
        const crop = image.crop!;

        // Crop values are always stored as percentages
        const cropX = (crop.x / 100) * img.naturalWidth;
        const cropY = (crop.y / 100) * img.naturalHeight;
        const cropWidth = (crop.width / 100) * img.naturalWidth;
        const cropHeight = (crop.height / 100) * img.naturalHeight;

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, targetWidth, targetHeight
        );

        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = image.url;
    });
  }, [targetWidth, targetHeight]);

  const processAll = async () => {
    setIsProcessing(true);
    try {
      const processed = await Promise.all(
        images.map(async (img) => {
          if (!img.crop) return img;
          const dataUrl = await processImage(img);
          return { ...img, processed: dataUrl };
        })
      );
      setImages(processed);
    } catch (error) {
      console.error('Processing failed:', error);
    }
    setIsProcessing(false);
  };

  const downloadImage = (image: ImageItem, index: number) => {
    if (!image.processed) return;
    const link = document.createElement('a');
    link.download = `screenshot_${selectedDevice.name}_${index + 1}.png`;
    link.href = image.processed;
    link.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      if (images[i].processed) {
        downloadImage(images[i], i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].url);
      return newImages;
    });
    if (activeImageIndex >= images.length - 1 && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  const reset = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setActiveImageIndex(0);
  };

  const activeImage = images[activeImageIndex];

  return (
    <div className="flex flex-col gap-6">
      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop Zone */}
      {images.length === 0 && (
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

      {images.length > 0 && (
        <>
          {/* Device Selection */}
          <div className="flex flex-col gap-4">
            {/* Device Type Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDeviceTypeChange('iphone')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${deviceType === 'iphone'
                    ? 'bg-primary-500 text-white'
                    : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)]'
                  }`}
              >
                iPhone
              </button>
              <button
                onClick={() => handleDeviceTypeChange('ipad')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${deviceType === 'ipad'
                    ? 'bg-primary-500 text-white'
                    : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)]'
                  }`}
              >
                iPad
              </button>
            </div>

            {/* Device & Size Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.selectDevice)}
                </label>
                <select
                  value={selectedDevice.id}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.selectSize)}
                </label>
                <select
                  value={selectedSize.id}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-card)] text-[var(--color-text)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {selectedDevice.sizes.map(size => (
                    <option key={size.id} value={size.id}>{size.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.orientation)}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors
                      ${orientation === 'portrait'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)]'
                      }`}
                  >
                    {t(tt.portrait)}
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors
                      ${orientation === 'landscape'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border)]'
                      }`}
                  >
                    {t(tt.landscape)}
                  </button>
                </div>
              </div>
            </div>

            {/* Target Size Info */}
            <div className="text-sm text-[var(--color-text-muted)] text-center">
              {t(tt.outputSize)}: <span className="font-medium text-[var(--color-text)]">{targetWidth} × {targetHeight}px</span>
            </div>
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-colors
                    ${idx === activeImageIndex ? 'border-primary-500' : 'border-[var(--color-border)]'}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img.url}
                    alt={`Image ${idx + 1}`}
                    className="w-16 h-16 object-cover"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-bl"
                  >
                    ×
                  </button>
                  {img.processed && (
                    <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center py-0.5">
                      ✓
                    </div>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-[var(--color-border)] rounded-lg
                    flex items-center justify-center text-2xl text-[var(--color-text-muted)] hover:border-primary-500"
                >
                  +
                </button>
              )}
            </div>
          )}

          {/* Crop Area */}
          {activeImage && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.adjustCrop)}
                </span>
                {images.length > 1 && (
                  <button
                    onClick={applyToAll}
                    className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                      border border-[var(--color-border)] rounded-lg transition-colors"
                  >
                    {t(tt.applyToAll)}
                  </button>
                )}
              </div>

              <div className="flex justify-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4">
                <ReactCrop
                  crop={activeImage.crop || undefined}
                  onChange={handleCropChange}
                  aspect={aspect}
                  ruleOfThirds
                >
                  <img
                    ref={imgRef}
                    src={activeImage.url}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[300px] max-w-full object-contain"
                  />
                </ReactCrop>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={processAll}
              disabled={isProcessing}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg
                font-medium transition-colors"
            >
              {isProcessing
                ? t(tt.processing)
                : t(tt.processAll)}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {t(tc.reset)}
            </button>
          </div>

          {/* Processed Results */}
          {images.some(img => img.processed) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {t(tt.processedImages)}
                </span>
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg
                    font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t(tt.downloadAll)}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => img.processed && (
                  <div
                    key={img.id}
                    className="relative border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]"
                  >
                    <img
                      src={img.processed}
                      alt={`Processed ${idx + 1}`}
                      className="w-full h-auto"
                    />
                    <button
                      onClick={() => downloadImage(img, idx)}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full
                        flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
