import type { Metadata } from 'next';
import BlogCard from '@/components/BlogCard';
import {
  HeroSection,
  RecentPostsHeader,
  NoPostsMessage,
  PopularToolsSection,
  GameCenterBanner,
  ProjectsSection,
} from '@/components/HomeContent';
import { parseLocale } from '@/i18n';
import { getAllPosts } from '@/lib/blog';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = SITE_NAME;
  const description =
    lang === 'pt'
      ? 'Diário de desenvolvimento — um espaço para aprender, construir e documentar.'
      : SITE_DESCRIPTION;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: localeAlternates('/', lang),
    openGraph: localeOpenGraph(lang, {
      title,
      description,
      urlPath: '/',
    }),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const lang = parseLocale((await params).locale);
  const posts = getAllPosts(lang).slice(0, 6);

  return (
    <>
      <HeroSection />

      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto">
          <RecentPostsHeader />

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
            <NoPostsMessage />
          )}
        </div>
      </section>

      <PopularToolsSection />
      <GameCenterBanner />
      <ProjectsSection />
    </>
  );
}
