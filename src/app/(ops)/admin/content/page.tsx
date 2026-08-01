import type { Metadata } from 'next';
import ContentCurationDashboard from '@/components/admin/ContentCurationDashboard';

export const metadata: Metadata = {
  title: 'Admin | Content',
  robots: { index: false, follow: false },
};

export default function AdminContentPage() {
  return <ContentCurationDashboard />;
}
