'use client';

import Script from 'next/script';

type RecaptchaApi = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => PromiseLike<string>;
};
declare global { interface Window { grecaptcha?: RecaptchaApi } }

export async function getRecaptchaToken(action: 'login' | 'password_reset' = 'login'): Promise<string> {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const api = window.grecaptcha;
  if (!key || !api) throw new Error('reCAPTCHA is unavailable. Please reload and try again.');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('reCAPTCHA timed out. Please try again.')), 10000);
    const fail = (error: unknown) => { clearTimeout(timeout); reject(error); };
    try {
      api.ready(() => {
        try {
          Promise.resolve(api.execute(key, { action })).then((token) => {
            clearTimeout(timeout);
            resolve(token);
          }, fail);
        } catch (error) { fail(error); }
      });
    } catch (error) { fail(error); }
  });
}

export function Recaptcha({ onReady }: { onReady: (ready: boolean) => void }) {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key) return <p role="alert">Sign-in is unavailable until reCAPTCHA is configured.</p>;
  return <Script src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`}
    onReady={() => window.grecaptcha?.ready(() => onReady(true))}
    onError={() => onReady(false)} />;
}
