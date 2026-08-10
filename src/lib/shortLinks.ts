import { SITE_URL } from '@/lib/site';

const CODE_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 7;
const MAX_URL_LENGTH = 2048;

export type ShortLinkRecord = {
  code: string;
  targetUrl: string;
  clickCount: number;
  createdAt: string;
};

export function generateShortCode(length = CODE_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeTargetUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Block javascript:, data:, etc. already by protocol check.
  const host = parsed.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost')) {
    return null;
  }

  // Avoid shortening our own short links (redirect loops).
  if (
    (host === 'lacorte.dev' || host.endsWith('.lacorte.dev')) &&
    parsed.pathname.startsWith('/s/')
  ) {
    return null;
  }

  return parsed.toString();
}

export function shortLinkPath(code: string): string {
  return `/s/${encodeURIComponent(code)}`;
}

export function absoluteShortUrl(code: string): string {
  return `${SITE_URL}${shortLinkPath(code)}`;
}

export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{4,32}$/.test(code);
}
