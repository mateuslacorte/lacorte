'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Recaptcha, getRecaptchaToken } from '@/lib/auth/recaptcha';

export function PasswordResetForm({ mode, nextPath, initialError = false, sessionReady = true , locale = 'en' }: { mode: 'request' | 'update'; nextPath: string; initialError?: boolean; sessionReady?: boolean ; locale?: 'en' | 'pt' }) {
 
 const tr = (en: string, pt: string) => locale === 'pt' ? pt : en;
 const prefix = '';
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmation, setConfirmation] = useState('');
 const [captchaReady, setCaptchaReady] = useState(false);
 const [busy, setBusy] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState(initialError ? tr('This link expired or was already used. Request a new one and open it in the same browser.', 'Este link expirou ou já foi usado. Peça outro e abra no mesmo navegador.') : '');
 const requestUrl = prefix + '/forgot-password?next=' + encodeURIComponent(nextPath);
 if (mode === 'update' && !sessionReady) return <div><p role="alert" className="text-sm text-red-500 mt-4">{tr('Open the recovery link from your email to choose a new password. If it expired, request another.', 'Abra o link de recuperação do e-mail para escolher uma nova senha. Se expirou, solicite outro.')}</p><Link href={requestUrl}>{tr('Request a new link', 'Solicitar novo link')} ↗</Link></div>;
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); setError('');
  if (mode === 'update' && password !== confirmation) { setError(tr('Passwords do not match.', 'As senhas não coincidem.')); return; }
  setBusy(true);
  try {
   const body = mode === 'request' ? { email, locale, next: nextPath, captchaToken: await getRecaptchaToken('password_reset') } : { password, confirmation };
   const response = await fetch('/api/auth/' + (mode === 'request' ? 'forgot-password' : 'reset-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
   if (!response.ok) {
    setError(response.status === 429 ? tr('Too many requests. Please wait and try again.', 'Muitas solicitações. Aguarde e tente novamente.') : response.status === 401 ? tr('Your recovery session expired. Request a new link.', 'Sua sessão de recuperação expirou. Solicite outro link.') : mode === 'request' ? tr('Could not request recovery. Please try again.', 'Não foi possível solicitar a recuperação. Tente novamente.') : tr('Could not update the password. Try a different password or request a new link.', 'Não foi possível atualizar a senha. Tente outra senha ou solicite outro link.'));
    return;
   }
   setPassword(''); setConfirmation('');
   if (mode === 'request') setSent(true);
   else window.location.assign(prefix + '/login?reset=success&next=' + encodeURIComponent(nextPath));
  } catch { setError(tr('Something went wrong. Please try again.', 'Algo deu errado. Tente novamente.')); }
  finally { setBusy(false); }
 }
 return <>
  {sent ? <div><p role="status" className="rounded-xl border border-[var(--color-border)] p-4 leading-relaxed">{tr('If an account uses this email, you’ll receive a password-reset link. Check your inbox and spam folder. Open the link in this same browser.', 'Se este e-mail tiver uma conta, você receberá um link para redefinir a senha. Confira a caixa de entrada e o spam. Abra o link neste mesmo navegador.')}</p><button type="button" onClick={() => setSent(false)} className="mt-4 underline">{tr('Try again or use another email', 'Tentar novamente ou usar outro e-mail')}</button></div> : <form onSubmit={submit} className="space-y-4">
   {mode === 'request' ? <label className="block space-y-2 text-sm font-medium">{tr('Email address', 'E-mail')}<input className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/></label> : <>
    <label className="block space-y-2 text-sm font-medium">{tr('New password', 'Nova senha')}<input className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500" type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={1024} value={password} onChange={event => setPassword(event.target.value)}/><small>{tr('At least 12 characters.', 'Pelo menos 12 caracteres.')}</small></label>
    <label className="block space-y-2 text-sm font-medium">{tr('Confirm new password', 'Confirme a nova senha')}<input className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500" type="password" name="confirmation" autoComplete="new-password" required minLength={12} maxLength={1024} value={confirmation} onChange={event => setConfirmation(event.target.value)}/></label>
   </>}
   {mode === 'request' && <Recaptcha onReady={setCaptchaReady}/>}
   <button className="w-full rounded-xl bg-primary-600 px-4 py-3 font-medium text-primary-950 disabled:opacity-60" type="submit" disabled={busy || (mode === 'request' && !captchaReady)}>{busy ? tr('Please wait…', 'Aguarde…') : mode === 'request' ? tr('Send reset link', 'Enviar link de recuperação') : tr('Save new password', 'Salvar nova senha')} ↗</button>
  </form>}
  {error && <p className="text-sm text-red-500 mt-4" role="alert">{error}</p>}
  {mode === 'update' && <p className="mt-5 text-sm underline"><Link href={requestUrl}>{tr('Request a new recovery link', 'Solicitar novo link de recuperação')}</Link></p>}
  <p className="mt-5 text-sm underline"><Link href={prefix + '/login?next=' + encodeURIComponent(nextPath)}>{tr('Back to sign in', 'Voltar para entrar')} ↗</Link></p>
 </>;
}
