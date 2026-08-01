import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogComments from '@/components/blog/BlogComments';
import BlogPostActions from '@/components/blog/BlogPostActions';
import MarkdownBody from '@/components/MarkdownBody';
import { formatPostDate, parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { commonTranslations } from '@/i18n/translations/common';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import { SITE_NAME } from '@/lib/site';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts('en').map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const post = getPostBySlug(slug, lang);
  if (!post) return {};

  const title = post.data.title;
  const description = post.data.description;
  const urlPath = `/posts/${slug}`;

  // Do not set openGraph.images / twitter.images here — Next.js injects the
  // hashed opengraph-image.* route from the file convention. A plain
  // `/opengraph-image` path 404s in production.
  return {
    title,
    description,
    alternates: localeAlternates(urlPath, lang),
    openGraph: localeOpenGraph(lang, {
      title,
      description,
      urlPath,
      type: 'article',
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const post = getPostBySlug(slug, lang);

  if (!post) {
    notFound();
  }

  const formattedDate = formatPostDate(post.data.date, lang, 'long');

  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const blog = commonTranslations.blog;
  const nav = commonTranslations.nav;

  return (
    <article className="py-16 md:py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
          <Link
            href={localizePath('/', lang)}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {t(nav.home, lang)}
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link
            href={localizePath('/posts', lang)}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {t(blog.title, lang)}
          </Link>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <time
              dateTime={post.data.date.toISOString()}
              className="text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-card)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]"
            >
              {formattedDate}
            </time>
            <span className="text-sm text-[var(--color-text-muted)]">
              {readingTime} {t(blog.minuteRead, lang)}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {post.data.title}
          </h1>

          <p className="text-lg text-[var(--color-text-muted)] mb-6 leading-relaxed">
            {post.data.description}
          </p>

          {post.data.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {post.data.tags.map((tag) => (
                <Link
                  key={tag}
                  href={localizePath(`/posts/tag/${encodeURIComponent(tag)}`, lang)}
                  className="text-sm px-3 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400
                    hover:bg-primary-500/20 transition-colors font-medium"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <BlogPostActions
            slug={slug}
            title={post.data.title}
            description={post.data.description}
          />
        </header>

        {post.data.image && (
          <div className="mb-10 rounded-2xl overflow-hidden border border-[var(--color-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.data.image} alt="" className="w-full h-auto" />
          </div>
        )}

        <MarkdownBody source={post.content} />

        <BlogComments slug={slug} />

        <footer className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t(blog.publishedOn, lang)} {SITE_NAME}
          </p>
        </footer>
      </div>
    </article>
  );
}
