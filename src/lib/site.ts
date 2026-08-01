// Central site branding and URL configuration

export const SITE_NAME = 'lacorte.dev';
export const SITE_DESCRIPTION = 'Dev journal — a space to learn, build, and document';
export const SITE_AUTHOR = 'Lacorte';

/**
 * Absolute site origin used for canonical URLs and Open Graph images.
 * Prefer NEXT_PUBLIC_SITE_URL; otherwise use the Vercel production / deployment host
 * so crawlers don't fetch OG images from a domain that isn't this app yet.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    return `https://${productionHost.replace(/^https?:\/\//, '')}`;
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, '')}`;
  }

  return 'https://www.lacorte.dev';
}

export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
