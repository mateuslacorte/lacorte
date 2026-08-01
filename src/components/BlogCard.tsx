'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPostDate } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';

interface Props {
  title: string;
  description: string;
  date: Date;
  slug: string;
  tags?: string[];
  image?: string;
}

export default function BlogCard({ title, description, date, slug, tags = [], image }: Props) {
  const { lang } = useTranslation();
  const formattedDate = formatPostDate(date, lang, 'short');

  return (
    <article className="group">
      <Link href={localizePath(`/posts/${slug}`, lang)} className="block card hover:border-primary-500/30">
        {image && (
          <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <time
              dateTime={date.toISOString()}
              className="text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-card-hover)] px-2.5 py-1 rounded-full"
            >
              {formattedDate}
            </time>
          </div>

          <h3 className="text-lg font-bold leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
            {description}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs px-2 py-0.5 text-[var(--color-text-muted)]">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
