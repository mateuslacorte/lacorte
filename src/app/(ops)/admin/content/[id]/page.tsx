import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import ContentCandidateDetail from '@/components/admin/ContentCandidateDetail';
import ContentPostPreview from '@/components/admin/ContentPostPreview';
import { loadContentCandidateById, slugifyTitle } from '@/lib/content-curation/curate';
import { parseMarkdownPost } from '@/lib/content-curation/parse-post';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Admin | Content curation',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminContentCandidatePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const candidate = await loadContentCandidateById(supabase, id);

  if (!candidate) {
    notFound();
  }

  const parsed = parseMarkdownPost(candidate.markdownPost);
  const filenameSlug = slugifyTitle(candidate.title) || 'post';

  let preview: ReactNode;
  if (!candidate.markdownPost) {
    preview = null;
  } else if (!parsed || !parsed.content) {
    preview = (
      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <p className="text-sm text-[var(--color-text-muted)]">
          Could not parse frontmatter for a rendered preview. Use View source or Download .md.
        </p>
        <pre className="max-h-64 overflow-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs whitespace-pre-wrap">
          {candidate.markdownPost.slice(0, 2000)}
          {candidate.markdownPost.length > 2000 ? '…' : ''}
        </pre>
      </div>
    );
  } else {
    preview = <ContentPostPreview post={parsed} fallbackTitle={candidate.title} />;
  }

  return (
    <ContentCandidateDetail
      candidate={candidate}
      filenameSlug={filenameSlug}
      preview={preview}
    />
  );
}
