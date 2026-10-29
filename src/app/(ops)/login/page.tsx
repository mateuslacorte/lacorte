import type { Metadata } from 'next';
import { resetNext } from '@/lib/auth/password-reset';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: 'noindex, follow',
};

export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string;reset?:string}>}) {
  const params=await searchParams;
  const nextPath=resetNext(params.next || null,process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacorte.dev');
  return (
    <section className="mx-auto max-w-md px-6 py-20">
      <h1 className="mb-2 text-3xl font-bold">Sign in</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        Sign in with your email and password.
      </p>
      {params.reset === 'success' && <p className="mb-5 text-sm" role="status">Password updated. Sign in with your new password.</p>}
      <LoginForm nextPath={nextPath} />
    </section>
  );
}
