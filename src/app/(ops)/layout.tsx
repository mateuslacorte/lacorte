import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LocaleProvider } from '@/i18n/LocaleProvider';

/** Unlocalized ops shell (admin / login) — always English. */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale="en">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </LocaleProvider>
  );
}
