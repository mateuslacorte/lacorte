import type { Metadata } from 'next';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { commonTranslations } from '@/i18n/translations/common';
import { getAllPosts, getAllTags } from '@/lib/blog';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>;
}

export function generateStaticParams() {
  return getAllTags('en').map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  const lang = parseLocale(locale);
  const decoded = decodeURIComponent(tag);
  const title =
    lang === 'pt' ? `Posts com a tag "${decoded}"` : `Posts tagged "${decoded}"`;
  const description =
    lang === 'pt'
      ? `Posts do blog com a tag ${decoded}.`
      : `Blog posts tagged with ${decoded}.`;
  const urlPath = `/posts/tag/${encodeURIComponent(decoded)}`;

  return {
    title,
    description,
    alternates: localeAlternates(urlPath, lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath }),
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, tag } = await params;
  const lang = parseLocale(locale);
  const decodedTag = decodeURIComponent(tag);
  const posts = getAllPosts(lang).filter((post) => post.data.tags.includes(decodedTag));

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
          <Link href={localizePath('/posts', lang)} className="hover:text-primary-500">
            {t(commonTranslations.blog.title, lang)}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text)]">#{decodedTag}</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">
          {lang === 'pt' ? 'Tag' : 'Tag'}: {decodedTag}
        </h1>
        <p className="text-[var(--color-text-muted)] mb-10">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </p>

        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <BlogCard
                key={post.slug}
                title={post.data.title}
                description={post.data.description}
                date={post.data.date}
                slug={post.slug}
                tags={post.data.tags}
                image={post.data.image}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--color-border)]">
            <p className="text-[var(--color-text-muted)]">
              {lang === 'pt'
                ? 'Nenhum post com esta tag ainda.'
                : 'No posts with this tag yet.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
