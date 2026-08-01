export interface ImagePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const IMAGE_CROP_PRESETS: ImagePreset[] = [
  { id: 'slack-avatar', label: 'Slack Profile (512×512)', width: 512, height: 512 },
  { id: 'slack-emoji', label: 'Slack Custom Emoji (128×128)', width: 128, height: 128 },
  { id: 'iphone-6-9', label: 'iPhone 6.9" App Store (1290×2796)', width: 1290, height: 2796 },
  { id: 'iphone-6-5', label: 'iPhone 6.5" App Store (1284×2778)', width: 1284, height: 2778 },
  { id: 'iphone-6-3', label: 'iPhone 6.3" App Store (1179×2556)', width: 1179, height: 2556 },
  { id: 'youtube-thumbnail', label: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720 },
  { id: 'instagram-post', label: 'Instagram Square Post (1080×1080)', width: 1080, height: 1080 },
  { id: 'instagram-story', label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
  { id: 'x-header', label: 'X Header (1500×500)', width: 1500, height: 500 },
  { id: 'og-image', label: 'Open Graph Thumbnail (1200×630)', width: 1200, height: 630 },
];

export function getCropRectFromPercent(
  sourceWidth: number,
  sourceHeight: number,
  cropXPercent: number,
  cropYPercent: number,
  cropWidthPercent: number,
  cropHeightPercent: number
): CropRect {
  const clampedWidthPercent = Math.min(Math.max(cropWidthPercent, 1), 100);
  const clampedHeightPercent = Math.min(Math.max(cropHeightPercent, 1), 100);

  const width = sourceWidth * (clampedWidthPercent / 100);
  const height = sourceHeight * (clampedHeightPercent / 100);

  const maxX = sourceWidth - width;
  const maxY = sourceHeight - height;

  const clampedXPercent = Math.min(Math.max(cropXPercent, 0), 100);
  const clampedYPercent = Math.min(Math.max(cropYPercent, 0), 100);

  let x = (clampedXPercent / 100) * sourceWidth;
  let y = (clampedYPercent / 100) * sourceHeight;

  x = Math.min(Math.max(x, 0), maxX);
  y = Math.min(Math.max(y, 0), maxY);
  return { x, y, width, height };
}

export function getCoverCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focusXPercent: number,
  focusYPercent: number
): CropRect {
  const srcAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (srcAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect;
  } else if (srcAspect < targetAspect) {
    cropHeight = sourceWidth / targetAspect;
  }

  const maxX = sourceWidth - cropWidth;
  const maxY = sourceHeight - cropHeight;

  const x = maxX * (Math.min(Math.max(focusXPercent, 0), 100) / 100);
  const y = maxY * (Math.min(Math.max(focusYPercent, 0), 100) / 100);

  return { x, y, width: cropWidth, height: cropHeight };
}
