/**
 * Resolve the visitor's public IP from request headers.
 * Prefers Cloudflare's CF-Connecting-IP so we never report the CDN edge IP.
 */

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/;

/** Loose IPv6 check (covers compressed forms). */
function looksLikeIpv6(value: string): boolean {
  if (!value.includes(':')) return false;
  // Strip optional zone id / brackets
  const cleaned = value.replace(/^\[|\]$/g, '').split('%')[0];
  if (cleaned.split(':').length < 2) return false;
  return /^[0-9a-fA-F:.]+$/.test(cleaned);
}

export function isValidIp(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (IPV4_RE.test(v)) return true;
  return looksLikeIpv6(v);
}

export function ipVersion(ip: string): 'ipv4' | 'ipv6' | null {
  if (IPV4_RE.test(ip)) return 'ipv4';
  if (looksLikeIpv6(ip)) return 'ipv6';
  return null;
}

function firstValidIp(candidates: string[]): string | null {
  for (const raw of candidates) {
    const ip = raw.trim().replace(/^\[|\]$/g, '');
    if (isValidIp(ip)) return ip;
  }
  return null;
}

function headerList(headers: Headers, name: string): string[] {
  const value = headers.get(name);
  if (!value) return [];
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

/**
 * Extract client IP. Order matters behind Cloudflare → Vercel:
 * CF-Connecting-IP is the visitor; x-real-ip is often the Cloudflare edge.
 */
export function getClientIp(headers: Headers): string | null {
  const cfConnecting = headers.get('cf-connecting-ip')?.trim();
  if (cfConnecting && isValidIp(cfConnecting)) return cfConnecting;

  const trueClient = headers.get('true-client-ip')?.trim();
  if (trueClient && isValidIp(trueClient)) return trueClient;

  // Leftmost XFF hop is the original client when proxies append.
  const fromXff = firstValidIp(headerList(headers, 'x-forwarded-for'));
  if (fromXff) return fromXff;

  const vercelForwarded = firstValidIp(headerList(headers, 'x-vercel-forwarded-for'));
  if (vercelForwarded) return vercelForwarded;

  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && isValidIp(realIp)) return realIp;

  return null;
}

export function getCfCountry(headers: Headers): string | null {
  const code = headers.get('cf-ipcountry')?.trim().toUpperCase();
  if (!code || code === 'XX' || code === 'T1') return null;
  return /^[A-Z]{2}$/.test(code) ? code : null;
}
