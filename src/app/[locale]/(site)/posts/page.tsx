import type { Metadata } from 'next';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { commonTranslations } from '@/i18n/translations/common';
import { getAllPosts, getAllTags } from '@/lib/blog';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import { SITE_NAME } from '@/lib/site';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(commonTranslations.blog.title, lang);
  const description =
    lang === 'pt'
      ? 'Logs de desenvolvimento, aprendizados e reflexões.'
      : 'Development logs, learnings, and thoughts.';

  return {
    title,
    description,
    alternates: localeAlternates('/posts', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/posts' }),
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const lang = parseLocale((await params).locale);
  const posts = getAllPosts(lang);
  const allTags = getAllTags(lang);
  const blog = commonTranslations.blog;

  const intro =
    lang === 'pt'
      ? `Logs de desenvolvimento, aprendizados, reflexões e aventuras de código do ${SITE_NAME}.`
      : `Development logs, learnings, thoughts, and coding adventures from ${SITE_NAME}.`;

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
            {t(blog.title, lang)}
          </p>
          <h1 className="text-4xl font-bold mb-4">{t(blog.title, lang)}</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-xl">{intro}</p>
        </div>

        {allTags.length > 0 && (
          <div className="mb-10 pb-6 border-b border-[var(--color-border)]">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-[var(--color-text-muted)] mr-1">
                {t(blog.tags, lang)}
              </span>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={localizePath(`/posts/tag/${encodeURIComponent(tag)}`, lang)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]
                    hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400
                    transition-colors font-medium"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 ? (
          <>
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
            <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
          </>
        ) : (
          <div className="text-center py-20 px-6 rounded-2xl border border-dashed border-[var(--color-border)]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">{t(blog.noPosts, lang)}</h2>
            <p className="text-[var(--color-text-muted)]">
              {lang === 'pt' ? 'O primeiro post chega em breve!' : 'The first post will be up soon!'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
