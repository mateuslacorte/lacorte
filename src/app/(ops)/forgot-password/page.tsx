import type { Metadata } from 'next';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resetNext } from '@/lib/auth/password-reset';
export const metadata: Metadata = { title: 'Reset password', robots: 'noindex, nofollow' };
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}) {
 const params=await searchParams;
 const nextPath=resetNext(params.next || null,process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacorte.dev');
 const client=await createSupabaseServerClient();
 const {data}=await client.auth.getUser();
 return <section className="mx-auto max-w-md px-6 py-20"><h1 className="mb-2 text-3xl font-bold">Reset your password</h1><p className="mb-8 text-[var(--color-text-muted)]">We’ll email a recovery link to your account. Your password is shared with Lacorte Members.</p><PasswordResetForm mode="request" nextPath={nextPath} initialError={!!params.error} sessionReady={!!data.user && !data.user.is_anonymous}/></section>;
}
