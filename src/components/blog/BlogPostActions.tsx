'use client';

import FavoriteButton from '@/components/tools/FavoriteButton';
import ShareButton from '@/components/tools/ShareButton';

interface BlogPostActionsProps {
  slug: string;
  title: string;
  description: string;
}

export default function BlogPostActions({ slug, title, description }: BlogPostActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FavoriteButton slug={slug} title={title} kind="blog" />
      <ShareButton title={title} description={description} />
    </div>
  );
}
