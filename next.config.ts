import type { NextConfig } from 'next';

/**
 * Permanent redirects from the legacy blog (Documents/Projects/blog)
 * plus host/canonical helpers for the current app.
 *
 * Live post URLs are /posts (and /pt/posts). Legacy /blog aliases redirect here.
 * More specific sources must appear before catch-alls.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Force apex → www (canonical host for Search Console)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'lacorte.dev' }],
        destination: 'https://www.lacorte.dev/:path*',
        permanent: true,
      },

      // --- Legacy page routes (old blog App Router) ---
      { source: '/portfolio', destination: '/posts/tag/portfolio', permanent: true },
      { source: '/skills', destination: '/about', permanent: true },
      { source: '/lore', destination: '/about', permanent: true },
      { source: '/feed.xml', destination: '/rss.xml', permanent: true },
      { source: '/icon', destination: '/favicon.svg', permanent: true },
      { source: '/admin/edit/:slug', destination: '/admin/content', permanent: true },

      // Old pagination (/posts/page/2); page index is now a single /posts list
      { source: '/posts/page/:page', destination: '/posts', permanent: true },
      { source: '/pt/posts/page/:page', destination: '/pt/posts', permanent: true },

      // Former /blog URLs (interim rename) → canonical /posts
      { source: '/blog', destination: '/posts', permanent: true },
      { source: '/blog/tag/:tag', destination: '/posts/tag/:tag', permanent: true },
      {
        source: '/blog/:slug/opengraph-image',
        destination: '/posts/:slug/opengraph-image',
        permanent: true,
      },
      { source: '/blog/:slug', destination: '/posts/:slug', permanent: true },
      { source: '/pt/blog', destination: '/pt/posts', permanent: true },
      { source: '/pt/blog/tag/:tag', destination: '/pt/posts/tag/:tag', permanent: true },
      {
        source: '/pt/blog/:slug/opengraph-image',
        destination: '/pt/posts/:slug/opengraph-image',
        permanent: true,
      },
      { source: '/pt/blog/:slug', destination: '/pt/posts/:slug', permanent: true },

      // --- Legacy APIs (gone) → HTML equivalents; do not catch /api/admin/content/* ---
      { source: '/api/posts', destination: '/posts', permanent: true },
      { source: '/api/posts/:slug', destination: '/posts/:slug', permanent: true },
      { source: '/api/comments', destination: '/posts', permanent: true },
      { source: '/api/contact', destination: '/contact', permanent: true },
      { source: '/api/newsletter', destination: '/contact', permanent: true },
      { source: '/api/admin/auth', destination: '/admin', permanent: true },
      { source: '/api/admin/posts', destination: '/admin', permanent: true },
      { source: '/api/admin/posts/:slug', destination: '/admin', permanent: true },
      { source: '/api/admin/upload', destination: '/admin', permanent: true },

      // --- Legacy static assets not shipped here ---
      { source: '/assets/:path*', destination: '/', permanent: true },
      { source: '/fonts/:path*', destination: '/', permanent: true },

      // Collapse trailing slashes to a single canonical URL shape
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
