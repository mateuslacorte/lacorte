import type { Language } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { absoluteUrl, SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export function personSchema() {
  return {
    '@type': 'Person' as const,
    name: SITE_AUTHOR,
    url: SITE_URL,
  };
}

export function organizationSchema() {
  return {
    '@type': 'Organization' as const,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject' as const,
      url: absoluteUrl('/icon-512.png'),
    },
  };
}

/** Sitewide WebSite graph (no SearchAction — site has no Google sitelinks search target). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_AUTHOR,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: ['en', 'pt-BR'],
    author: personSchema(),
    publisher: organizationSchema(),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  lang: Language,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizePath(item.path, lang)),
    })),
  };
}

export function blogPostingJsonLd(input: {
  lang: Language;
  slug: string;
  title: string;
  description: string;
  datePublished: Date;
  dateModified?: Date;
  tags: string[];
  image?: string;
}) {
  const path = localizePath(`/posts/${input.slug}`, input.lang);
  const url = absoluteUrl(path);
  const imageUrl = input.image
    ? absoluteUrl(input.image.startsWith('/') ? input.image : `/${input.image}`)
    : absoluteUrl(`${path}/opengraph-image`);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    datePublished: input.datePublished.toISOString(),
    dateModified: (input.dateModified ?? input.datePublished).toISOString(),
    author: personSchema(),
    publisher: organizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: [imageUrl],
    url,
    keywords: input.tags.join(', '),
    inLanguage: input.lang === 'pt' ? 'pt-BR' : 'en',
    isPartOf: {
      '@type': 'Blog',
      name: SITE_NAME,
      url: absoluteUrl(localizePath('/posts', input.lang)),
    },
  };
}

export function webApplicationJsonLd(input: {
  lang: Language;
  path: string;
  name: string;
  description: string;
  applicationCategory: string;
}) {
  const url = absoluteUrl(localizePath(input.path, input.lang));
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: input.name,
    description: input.description,
    url,
    applicationCategory: input.applicationCategory,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: personSchema(),
    publisher: organizationSchema(),
    inLanguage: input.lang === 'pt' ? 'pt-BR' : 'en',
  };
}
