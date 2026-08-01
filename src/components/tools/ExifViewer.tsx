'use client';

import { useState, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ExifData {
  [key: string]: string | number | undefined;
}

// Simple EXIF parser (handles common JPEG EXIF data)
async function parseExif(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new DataView(e.target?.result as ArrayBuffer);
      const exif: ExifData = {};

      // Check for JPEG
      if (data.getUint16(0) !== 0xffd8) {
        resolve({ error: 'Not a JPEG file' });
        return;
      }

      let offset = 2;
      const length = data.byteLength;

      while (offset < length) {
        if (data.getUint8(offset) !== 0xff) {
          resolve({ error: 'Invalid JPEG marker' });
          return;
        }

        const marker = data.getUint8(offset + 1);

        // APP1 marker (EXIF)
        if (marker === 0xe1) {
          const exifOffset = offset + 4;

          // Check for "Exif\0\0"
          const exifHeader = String.fromCharCode(
            data.getUint8(exifOffset),
            data.getUint8(exifOffset + 1),
            data.getUint8(exifOffset + 2),
            data.getUint8(exifOffset + 3)
          );

          if (exifHeader !== 'Exif') {
            resolve({ error: 'No EXIF data found' });
            return;
          }

          const tiffOffset = exifOffset + 6;
          const littleEndian = data.getUint16(tiffOffset) === 0x4949;

          const getUint16 = (offset: number) =>
            littleEndian ? data.getUint16(offset, true) : data.getUint16(offset);
          const getUint32 = (offset: number) =>
            littleEndian ? data.getUint32(offset, true) : data.getUint32(offset);

          const ifdOffset = getUint32(tiffOffset + 4);
          const entries = getUint16(tiffOffset + ifdOffset);

          const tags: { [key: number]: string } = {
            0x010f: 'Make',
            0x0110: 'Model',
            0x0112: 'Orientation',
            0x011a: 'XResolution',
            0x011b: 'YResolution',
            0x0128: 'ResolutionUnit',
            0x0131: 'Software',
            0x0132: 'DateTime',
            0x829a: 'ExposureTime',
            0x829d: 'FNumber',
            0x8827: 'ISO',
            0x9003: 'DateTimeOriginal',
            0x920a: 'FocalLength',
            0xa002: 'ImageWidth',
            0xa003: 'ImageHeight',
            0xa405: 'FocalLengthIn35mmFilm',
          };

          for (let i = 0; i < entries; i++) {
            const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
            const tag = getUint16(entryOffset);
            const type = getUint16(entryOffset + 2);
            const count = getUint32(entryOffset + 4);
            const valueOffset = entryOffset + 8;

            if (tags[tag]) {
              const tagName = tags[tag];

              // Type 2 = ASCII
              if (type === 2) {
                let dataOffset = valueOffset;
                if (count > 4) {
                  dataOffset = tiffOffset + getUint32(valueOffset);
                }
                let str = '';
                for (let j = 0; j < count - 1; j++) {
                  str += String.fromCharCode(data.getUint8(dataOffset + j));
                }
                exif[tagName] = str;
              }
              // Type 3 = SHORT (16-bit)
              else if (type === 3) {
                exif[tagName] = getUint16(valueOffset);
              }
              // Type 4 = LONG (32-bit)
              else if (type === 4) {
                exif[tagName] = getUint32(valueOffset);
              }
              // Type 5 = RATIONAL
              else if (type === 5) {
                const dataOffset = tiffOffset + getUint32(valueOffset);
                const numerator = getUint32(dataOffset);
                const denominator = getUint32(dataOffset + 4);
                if (denominator !== 0) {
                  exif[tagName] = numerator / denominator;
                }
              }
            }
          }

          resolve(exif);
          return;
        }

        // Move to next marker
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
          offset += 2;
        } else {
          const segmentLength = data.getUint16(offset + 2);
          offset += 2 + segmentLength;
        }
      }

      resolve({ error: 'No EXIF data found' });
    };

    reader.readAsArrayBuffer(file);
  });
}

export default function ExifViewer({ lang: initialLang }: { lang?: Language } = {}) {
  const { t } = useTranslation(initialLang);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setImageName(file.name);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Parse EXIF
    const exif = await parseExif(file);
    setExifData(exif);
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatValue = (key: string, value: string | number | undefined): string => {
    if (value === undefined) return '-';

    switch (key) {
      case 'ExposureTime':
        return typeof value === 'number' ? `1/${Math.round(1 / value)}s` : String(value);
      case 'FNumber':
        return `f/${value}`;
      case 'FocalLength':
      case 'FocalLengthIn35mmFilm':
        return `${value}mm`;
      case 'ISO':
        return `ISO ${value}`;
      case 'Orientation':
        const orientations: { [key: number]: string } = {
          1: 'Normal',
          2: 'Flipped horizontal',
          3: 'Rotated 180°',
          4: 'Flipped vertical',
          5: 'Rotated 90° CW, flipped',
          6: 'Rotated 90° CCW',
          7: 'Rotated 90° CCW, flipped',
          8: 'Rotated 90° CW',
        };
        return orientations[value as number] || String(value);
      case 'ResolutionUnit':
        return value === 2 ? 'inches' : value === 3 ? 'centimeters' : String(value);
      case 'XResolution':
      case 'YResolution':
        return `${value} dpi`;
      default:
        return String(value);
    }
  };

  const exifCategories = [
    {
      name: t({ en: 'Camera Info', pt: 'Camera Info' }),
      fields: ['Make', 'Model', 'Software'],
    },
    {
      name: t({ en: 'Capture Settings', pt: 'Capture Settings' }),
      fields: ['ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'FocalLengthIn35mmFilm'],
    },
    {
      name: t({ en: 'Image Info', pt: 'Image Info' }),
      fields: ['ImageWidth', 'ImageHeight', 'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit'],
    },
    {
      name: t({ en: 'Date/Time', pt: 'Date/Time' }),
      fields: ['DateTime', 'DateTimeOriginal'],
    },
  ];

  const fieldLabels: { [key: string]: { en: string; pt?: string } } = {
    Make: { en: 'Make', pt: 'Make' },
    Model: { en: 'Model', pt: 'Model' },
    Software: { en: 'Software', pt: 'Software' },
    ExposureTime: { en: 'Exposure Time', pt: 'Exposure Time' },
    FNumber: { en: 'Aperture', pt: 'Aperture' },
    ISO: { en: 'ISO', pt: 'ISO' },
    FocalLength: { en: 'Focal Length', pt: 'Focal Length' },
    FocalLengthIn35mmFilm: { en: '35mm Equivalent', pt: '35mm Equivalent' },
    ImageWidth: { en: 'Width', pt: 'Width' },
    ImageHeight: { en: 'Height', pt: 'Height' },
    Orientation: { en: 'Orientation', pt: 'Orientation' },
    XResolution: { en: 'X Resolution', pt: 'X Resolution' },
    YResolution: { en: 'Y Resolution', pt: 'Y Resolution' },
    ResolutionUnit: { en: 'Resolution Unit', pt: 'Resolution Unit' },
    DateTime: { en: 'Modified', pt: 'Modified' },
    DateTimeOriginal: { en: 'Date Taken', pt: 'Date Taken' },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop Zone */}
      {!imageUrl && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
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
          <div className="text-center">
            <p className="text-[var(--color-text)]">
              {t({ en: 'Drag JPEG image or click to upload', pt: 'Drag JPEG image or click to upload' })}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {t({ en: 'EXIF data is only extracted from JPEG files', pt: 'EXIF data is only extracted from JPEG files' })}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-8">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-text)]">
            {t({ en: 'Analyzing...', pt: 'Analyzing...' })}
          </span>
        </div>
      )}

      {/* Results */}
      {imageUrl && exifData && !isLoading && (
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="rounded-lg overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                <img src={imageUrl} alt={imageName} className="w-full h-auto" />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-2 text-center truncate">{imageName}</p>
              <button
                onClick={() => {
                  setImageUrl(null);
                  setExifData(null);
                }}
                className="w-full mt-2 px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                  border border-[var(--color-border)] rounded-lg transition-colors text-sm"
              >
                {t({ en: 'Choose Another', pt: 'Choose Another' })}
              </button>
            </div>

            {/* EXIF Data */}
            <div className="md:w-2/3 space-y-4">
              {exifData.error ? (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {t({ en: 'No EXIF data found', pt: 'No EXIF data found' })}
                  </p>
                </div>
              ) : (
                exifCategories.map((category) => {
                  const hasData = category.fields.some((field) => exifData[field] !== undefined);
                  if (!hasData) return null;

                  return (
                    <div key={category.name} className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                      <div className="px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
                        <h3 className="font-medium text-[var(--color-text)]">{category.name}</h3>
                      </div>
                      <div className="divide-y divide-[var(--color-border)]">
                        {category.fields.map((field) => {
                          if (exifData[field] === undefined) return null;
                          return (
                            <div key={field} className="flex justify-between px-4 py-2">
                              <span className="text-[var(--color-text-muted)]">
                                {t(fieldLabels[field])}
                              </span>
                              <span className="font-mono text-[var(--color-text)]">
                                {formatValue(field, exifData[field])}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          {t({ en: 'EXIF (Exchangeable Image File Format) is metadata stored in images by digital cameras. It includes camera model, capture settings, date, and more.', pt: 'EXIF (Exchangeable Image File Format) is metadata stored in images by digital cameras. It includes camera model, capture settings, date, and more.' })}
        </p>
      </div>
    </div>
  );
}
