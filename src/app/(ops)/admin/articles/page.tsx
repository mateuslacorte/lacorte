import type { Metadata } from 'next';
import ArticleAdmin from '@/components/articles/ArticleAdmin';

export const metadata: Metadata = {
  title: 'Admin | Articles',
  robots: { index: false, follow: false },
};

export default function AdminArticlesPage() {
  return (
    <div className="max-w-4xl">
      <ArticleAdmin />
    </div>
  );
}
