import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: 'noindex, follow',
};

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-6 py-20">
      <h1 className="mb-2 text-3xl font-bold">Sign in</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        Use a magic link to access the admin dashboard at /admin.
      </p>
      <LoginForm />
    </section>
  );
}
