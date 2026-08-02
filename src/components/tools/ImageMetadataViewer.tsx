'use client';

import { useState, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface ExifData {
  // Basic
  fileName?: string;
  fileSize?: number;
  fileType?: string;

  // Camera
  make?: string;
  model?: string;
  software?: string;

  // Image
  width?: number;
  height?: number;
  orientation?: number;
  colorSpace?: string;

  // Capture Settings
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  focalLength35mm?: number;
  exposureProgram?: number;
  meteringMode?: number;
  flash?: number;
  whiteBalance?: number;

  // Date/Time
  dateTime?: string;
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;

  // GPS
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  gpsLatitudeRef?: string;
  gpsLongitudeRef?: string;

  // Lens
  lensModel?: string;
  lensMake?: string;

  // Other
  copyright?: string;
  artist?: string;

  error?: string;
}

// Enhanced EXIF parser with GPS support
async function parseExif(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new DataView(e.target?.result as ArrayBuffer);
      const exif: ExifData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };

      // Check for JPEG
      if (data.getUint16(0) !== 0xffd8) {
        resolve({ ...exif, error: 'Not a JPEG file' });
        return;
      }

      let offset = 2;
      const length = data.byteLength;
      let littleEndian = false;
      let tiffOffset = 0;

      const tags: { [key: number]: keyof ExifData } = {
        0x010f: 'make',
        0x0110: 'model',
        0x0112: 'orientation',
        0x0131: 'software',
        0x0132: 'dateTime',
        0x8298: 'copyright',
        0x829a: 'exposureTime',
        0x829d: 'fNumber',
        0x8822: 'exposureProgram',
        0x8827: 'iso',
        0x9003: 'dateTimeOriginal',
        0x9004: 'dateTimeDigitized',
        0x9207: 'meteringMode',
        0x9209: 'flash',
        0x920a: 'focalLength',
        0xa001: 'colorSpace',
        0xa002: 'width',
        0xa003: 'height',
        0xa405: 'focalLength35mm',
        0xa406: 'whiteBalance',
        0xa432: 'lensModel',
        0xa433: 'lensMake',
        0x013b: 'artist',
      };

      const gpsTags: { [key: number]: string } = {
        0x0001: 'gpsLatitudeRef',
        0x0002: 'gpsLatitude',
        0x0003: 'gpsLongitudeRef',
        0x0004: 'gpsLongitude',
        0x0006: 'gpsAltitude',
      };

      const getUint16 = (offset: number) =>
        littleEndian ? data.getUint16(offset, true) : data.getUint16(offset);
      const getUint32 = (offset: number) =>
        littleEndian ? data.getUint32(offset, true) : data.getUint32(offset);

      const readRational = (offset: number): number => {
        const numerator = getUint32(offset);
        const denominator = getUint32(offset + 4);
        return denominator !== 0 ? numerator / denominator : 0;
      };

      const readGpsCoordinate = (offset: number): number => {
        const degrees = readRational(offset);
        const minutes = readRational(offset + 8);
        const seconds = readRational(offset + 16);
        return degrees + minutes / 60 + seconds / 3600;
      };

      const readString = (offset: number, count: number): string => {
        let str = '';
        for (let i = 0; i < count - 1; i++) {
          const char = data.getUint8(offset + i);
          if (char === 0) break;
          str += String.fromCharCode(char);
        }
        return str.trim();
      };

      const readIFD = (ifdOffset: number, isGps = false) => {
        const entries = getUint16(tiffOffset + ifdOffset);

        for (let i = 0; i < entries; i++) {
          const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
          const tag = getUint16(entryOffset);
          const type = getUint16(entryOffset + 2);
          const count = getUint32(entryOffset + 4);
          const valueOffset = entryOffset + 8;

          const tagMap = isGps ? gpsTags : tags;
          const tagName = tagMap[tag];

          if (!tagName) continue;

          try {
            let dataOffset = valueOffset;
            const valueSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] || 1;
            if (count * valueSize > 4) {
              dataOffset = tiffOffset + getUint32(valueOffset);
            }

            if (isGps) {
              if (tagName === 'gpsLatitudeRef' || tagName === 'gpsLongitudeRef') {
                (exif as any)[tagName] = String.fromCharCode(data.getUint8(dataOffset));
              } else if (tagName === 'gpsLatitude' || tagName === 'gpsLongitude') {
                (exif as any)[tagName] = readGpsCoordinate(dataOffset);
              } else if (tagName === 'gpsAltitude') {
                (exif as any)[tagName] = readRational(dataOffset);
              }
            } else {
              // Type 2 = ASCII
              if (type === 2) {
                (exif as any)[tagName] = readString(dataOffset, count);
              }
              // Type 3 = SHORT (16-bit)
              else if (type === 3) {
                (exif as any)[tagName] = getUint16(dataOffset);
              }
              // Type 4 = LONG (32-bit)
              else if (type === 4) {
                (exif as any)[tagName] = getUint32(dataOffset);
              }
              // Type 5 = RATIONAL
              else if (type === 5) {
                (exif as any)[tagName] = readRational(dataOffset);
              }
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      };

      while (offset < length) {
        if (data.getUint8(offset) !== 0xff) break;

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

          if (exifHeader === 'Exif') {
            tiffOffset = exifOffset + 6;
            littleEndian = data.getUint16(tiffOffset) === 0x4949;

            const ifdOffset = getUint32(tiffOffset + 4);
            readIFD(ifdOffset);

            // Look for EXIF IFD pointer
            const entries = getUint16(tiffOffset + ifdOffset);
            for (let i = 0; i < entries; i++) {
              const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
              const tag = getUint16(entryOffset);

              // EXIF IFD pointer
              if (tag === 0x8769) {
                const exifIfdOffset = getUint32(entryOffset + 8);
                readIFD(exifIfdOffset);
              }

              // GPS IFD pointer
              if (tag === 0x8825) {
                const gpsIfdOffset = getUint32(entryOffset + 8);
                readIFD(gpsIfdOffset, true);
              }
            }
          }
          break;
        }

        // Move to next marker
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
          offset += 2;
        } else {
          const segmentLength = data.getUint16(offset + 2);
          offset += 2 + segmentLength;
        }
      }

      // Apply GPS reference
      if (exif.gpsLatitude && exif.gpsLatitudeRef === 'S') {
        exif.gpsLatitude = -exif.gpsLatitude;
      }
      if (exif.gpsLongitude && exif.gpsLongitudeRef === 'W') {
        exif.gpsLongitude = -exif.gpsLongitude;
      }

      resolve(exif);
    };

    reader.readAsArrayBuffer(file);
  });
}

// Device detection
function detectDevice(make?: string, model?: string): { brand: string; icon: string; type: string } {
  const makeUpper = (make || '').toUpperCase();
  const modelUpper = (model || '').toUpperCase();

  if (makeUpper.includes('APPLE') || modelUpper.includes('IPHONE')) {
    const iphoneMatch = modelUpper.match(/IPHONE\s*(\d+)/);
    return { brand: 'Apple', icon: '🍎', type: iphoneMatch ? `iPhone ${iphoneMatch[1]}` : 'iPhone' };
  }
  if (makeUpper.includes('SAMSUNG') || modelUpper.includes('GALAXY') || modelUpper.includes('SM-')) {
    return { brand: 'Samsung', icon: '📱', type: 'Galaxy' };
  }
  if (makeUpper.includes('GOOGLE') || modelUpper.includes('PIXEL')) {
    return { brand: 'Google', icon: '📱', type: 'Pixel' };
  }
  if (makeUpper.includes('HUAWEI')) {
    return { brand: 'Huawei', icon: '📱', type: 'Huawei' };
  }
  if (makeUpper.includes('XIAOMI') || makeUpper.includes('REDMI')) {
    return { brand: 'Xiaomi', icon: '📱', type: 'Xiaomi' };
  }
  if (makeUpper.includes('LG')) {
    return { brand: 'LG', icon: '📱', type: 'LG' };
  }
  if (makeUpper.includes('SONY')) {
    return { brand: 'Sony', icon: '📷', type: modelUpper.includes('XPERIA') ? 'Xperia' : 'Sony Camera' };
  }
  if (makeUpper.includes('CANON')) {
    return { brand: 'Canon', icon: '📷', type: 'DSLR/Mirrorless' };
  }
  if (makeUpper.includes('NIKON')) {
    return { brand: 'Nikon', icon: '📷', type: 'DSLR/Mirrorless' };
  }
  if (makeUpper.includes('FUJIFILM') || makeUpper.includes('FUJI')) {
    return { brand: 'Fujifilm', icon: '📷', type: 'Mirrorless' };
  }
  if (makeUpper.includes('PANASONIC') || makeUpper.includes('LUMIX')) {
    return { brand: 'Panasonic', icon: '📷', type: 'Lumix' };
  }
  if (makeUpper.includes('OLYMPUS') || makeUpper.includes('OM SYSTEM')) {
    return { brand: 'Olympus', icon: '📷', type: 'Mirrorless' };
  }
  if (makeUpper.includes('GOPRO')) {
    return { brand: 'GoPro', icon: '🎬', type: 'Action Camera' };
  }
  if (makeUpper.includes('DJI')) {
    return { brand: 'DJI', icon: '🚁', type: 'Drone' };
  }

  if (make) {
    return { brand: make, icon: '📷', type: 'Camera' };
  }

  return { brand: 'Unknown', icon: '❓', type: 'Unknown' };
}

export default function ImageMetadataViewer({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.imageMetadata;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'camera' | 'gps' | 'all'>('basic');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Get image dimensions
    const img = new Image();
    img.onload = async () => {
      const exif = await parseExif(file);
      if (!exif.width) exif.width = img.width;
      if (!exif.height) exif.height = img.height;
      setExifData(exif);
      setIsLoading(false);
    };
    img.onerror = async () => {
      const exif = await parseExif(file);
      setExifData(exif);
      setIsLoading(false);
    };
    img.src = url;
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const device = exifData ? detectDevice(exifData.make, exifData.model) : null;

  const exposurePrograms: { [key: number]: string } = {
    0: t(tc.expNotDefined),
    1: t(tc.expManual),
    2: t(tc.expProgramAe),
    3: t(tc.expAperturePriority),
    4: t(tc.expShutterPriority),
    5: t(tc.expCreative),
    6: t(tc.expAction),
    7: t(tc.expPortrait),
    8: t(tc.expLandscape),
  };

  const meteringModes: { [key: number]: string } = {
    0: t(tc.meterUnknown),
    1: t(tc.meterAverage),
    2: t(tc.meterCenterWeighted),
    3: t(tc.meterSpot),
    4: t(tc.meterMultiSpot),
    5: t(tc.meterPattern),
    6: t(tc.meterPartial),
  };

  const flashModes: { [key: number]: string } = {
    0: t(tc.flashDidNotFire),
    1: t(tc.flashFired),
    5: t(tc.flashFiredNoStrobeReturn),
    7: t(tc.flashFiredStrobeReturn),
    16: t(tc.flashDidNotFireForced),
    24: t(tc.flashDidNotFireAuto),
    25: t(tc.flashFiredAuto),
  };

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
              {t(tc.dropzone)}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {t(tc.dropzoneHint)}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-8">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-text)]">{t(tc.analyzing)}</span>
        </div>
      )}

      {/* Results */}
      {imageUrl && exifData && !isLoading && (
        <div className="space-y-6">
          {/* Device Summary Card */}
          {device && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-500/5 border border-primary-500/20">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{device.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    {device.brand} {device.type}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {exifData.model || t(tc.noModelInfo)}
                  </p>
                </div>
                {exifData.gpsLatitude && exifData.gpsLongitude && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                    <span>📍</span>
                    <span className="text-sm font-medium">{t(tc.locationAvailable)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Preview */}
            <div className="md:w-1/3">
              <div className="rounded-lg overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                <img src={imageUrl} alt={exifData.fileName} className="w-full h-auto" />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-2 text-center truncate">
                {exifData.fileName}
              </p>
              <button
                onClick={() => {
                  setImageUrl(null);
                  setExifData(null);
                }}
                className="w-full mt-2 px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                  border border-[var(--color-border)] rounded-lg transition-colors text-sm"
              >
                {t(tc.chooseAnother)}
              </button>
            </div>

            {/* Metadata */}
            <div className="md:w-2/3 space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
                {[
                  { id: 'basic', label: t(tc.tabBasic) },
                  { id: 'camera', label: t(tc.tabCamera) },
                  { id: 'gps', label: t(tc.tabGps) },
                  { id: 'all', label: t(tc.tabAll) },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-[var(--color-card)] text-[var(--color-text-muted)]'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {/* Basic Info */}
                {(activeTab === 'basic' || activeTab === 'all') && (
                  <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                    <div className="px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
                      <h3 className="font-medium text-[var(--color-text)]">{t(tc.fileInfo)}</h3>
                    </div>
                    <div className="divide-y divide-[var(--color-border)]">
                      <Row label={t(tc.fileName)} value={exifData.fileName} />
                      <Row label={t(tc.fileSize)} value={exifData.fileSize ? formatFileSize(exifData.fileSize) : undefined} />
                      <Row label={t(tc.fileType)} value={exifData.fileType} />
                      <Row label={t(tc.resolution)} value={exifData.width && exifData.height ? `${exifData.width} × ${exifData.height}` : undefined} />
                      <Row label={t(tc.dateTaken)} value={exifData.dateTimeOriginal || exifData.dateTime} />
                    </div>
                  </div>
                )}

                {/* Camera Info */}
                {(activeTab === 'camera' || activeTab === 'all') && (
                  <>
                    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                      <div className="px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
                        <h3 className="font-medium text-[var(--color-text)]">{t(tc.cameraInfo)}</h3>
                      </div>
                      <div className="divide-y divide-[var(--color-border)]">
                        <Row label={t(tc.manufacturer)} value={exifData.make} />
                        <Row label={t(tc.model)} value={exifData.model} />
                        <Row label={t(tc.software)} value={exifData.software} />
                        <Row label={t(tc.lens)} value={exifData.lensModel} />
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                      <div className="px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
                        <h3 className="font-medium text-[var(--color-text)]">{t(tc.captureSettings)}</h3>
                      </div>
                      <div className="divide-y divide-[var(--color-border)]">
                        <Row
                          label={t(tc.exposureTime)}
                          value={exifData.exposureTime
                            ? exifData.exposureTime >= 1
                              ? `${exifData.exposureTime}s`
                              : `1/${Math.round(1 / exifData.exposureTime)}s`
                            : undefined}
                        />
                        <Row label={t(tc.aperture)} value={exifData.fNumber ? `f/${exifData.fNumber}` : undefined} />
                        <Row label={t(tc.iso)} value={exifData.iso ? `ISO ${exifData.iso}` : undefined} />
                        <Row label={t(tc.focalLength)} value={exifData.focalLength ? `${exifData.focalLength}mm` : undefined} />
                        <Row label={t(tc.focalLength35mm)} value={exifData.focalLength35mm ? `${exifData.focalLength35mm}mm` : undefined} />
                        <Row label={t(tc.exposureProgramLabel)} value={exifData.exposureProgram !== undefined ? exposurePrograms[exifData.exposureProgram] : undefined} />
                        <Row label={t(tc.meteringModeLabel)} value={exifData.meteringMode !== undefined ? meteringModes[exifData.meteringMode] : undefined} />
                        <Row label={t(tc.flashLabel)} value={exifData.flash !== undefined ? flashModes[exifData.flash] || `${t(tc.flashCode)}: ${exifData.flash}` : undefined} />
                      </div>
                    </div>
                  </>
                )}

                {/* GPS Info */}
                {(activeTab === 'gps' || activeTab === 'all') && (
                  <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                    <div className="px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
                      <h3 className="font-medium text-[var(--color-text)]">{t(tc.locationInfo)}</h3>
                    </div>
                    {exifData.gpsLatitude && exifData.gpsLongitude ? (
                      <div className="p-4 space-y-4">
                        <div className="divide-y divide-[var(--color-border)] -mx-4 -mt-4 border-b border-[var(--color-border)]">
                          <Row label={t(tc.latitude)} value={`${exifData.gpsLatitude.toFixed(6)}°`} />
                          <Row label={t(tc.longitude)} value={`${exifData.gpsLongitude.toFixed(6)}°`} />
                          {exifData.gpsAltitude && <Row label={t(tc.altitude)} value={`${exifData.gpsAltitude.toFixed(1)}m`} />}
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`https://maps.google.com/?q=${exifData.gpsLatitude},${exifData.gpsLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-center text-sm font-medium transition-colors"
                          >
                            {t(tc.viewGoogleMaps)}
                          </a>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${exifData.gpsLatitude}&mlon=${exifData.gpsLongitude}#map=15/${exifData.gpsLatitude}/${exifData.gpsLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-center text-sm font-medium transition-colors"
                          >
                            {t(tc.viewOsm)}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-[var(--color-text-muted)]">
                        <span className="text-4xl mb-2 block">📍</span>
                        <p>{t(tc.noLocation)}</p>
                        <p className="text-sm mt-1">
                          {t(tc.noLocationHint)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Warning */}
          {exifData.gpsLatitude && exifData.gpsLongitude && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">{t(tc.privacyNotice)}</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {t(tc.privacyNoticeText)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-2">{t(tc.tipsTitle)}</h3>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>• {t(tc.tipDevice)}</li>
          <li>• {t(tc.tipCapture)}</li>
          <li>• {t(tc.tipLocation)}</li>
          <li>• {t(tc.tipDate)}</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex justify-between px-4 py-2">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono text-[var(--color-text)] text-right max-w-[60%] truncate">
        {value ?? '-'}
      </span>
    </div>
  );
}
