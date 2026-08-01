import MarkdownBody from '@/components/MarkdownBody';
import type { ParsedMarkdownPost } from '@/lib/content-curation/parse-post';

interface ContentPostPreviewProps {
  post: ParsedMarkdownPost;
  fallbackTitle: string;
}

export default function ContentPostPreview({ post, fallbackTitle }: ContentPostPreviewProps) {
  const title = post.title || fallbackTitle;
  const formattedDate = post.date
    ? post.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8">
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {formattedDate && (
            <time
              dateTime={post.date!.toISOString()}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)]"
            >
              {formattedDate}
            </time>
          )}
          <span className="text-sm text-[var(--color-text-muted)]">{readingTime} min read</span>
        </div>
        <h2 className="mb-3 text-2xl font-bold leading-tight md:text-3xl">{title}</h2>
        {post.description && (
          <p className="mb-4 text-base leading-relaxed text-[var(--color-text-muted)]">
            {post.description}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <MarkdownBody source={post.content} />
    </article>
  );
}
