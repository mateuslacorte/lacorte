'use client';

import { useState, useCallback } from 'react';
import bcrypt from 'bcryptjs';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type Mode = 'hash' | 'verify';

export default function BcryptTool({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.bcrypt;
  const tc = translations.tools.common;

  const [mode, setMode] = useState<Mode>('hash');
  const [password, setPassword] = useState('');
  const [cost, setCost] = useState(10);
  const [hash, setHash] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const runHash = useCallback(async () => {
    if (!password) {
      setError(t(tt.passwordRequired));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const salt = await bcrypt.genSalt(cost);
      const result = await bcrypt.hash(password, salt);
      setHash(result);
    } catch {
      setError(t(tt.hashFailed));
      setHash('');
    } finally {
      setBusy(false);
    }
  }, [password, cost, t, tt]);

  const runVerify = useCallback(async () => {
    if (!verifyPassword) {
      setError(t(tt.passwordRequired));
      setMatch(null);
      return;
    }
    if (!verifyHash.trim()) {
      setError(t(tt.hashRequired));
      setMatch(null);
      return;
    }
    setBusy(true);
    setError(null);
    setMatch(null);
    try {
      const ok = await bcrypt.compare(verifyPassword, verifyHash.trim());
      setMatch(ok);
    } catch {
      setError(t(tt.verifyFailed));
      setMatch(null);
    } finally {
      setBusy(false);
    }
  }, [verifyPassword, verifyHash, t, tt]);

  const copyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            setMode('hash');
            setError(null);
            setMatch(null);
          }}
          className={`flex-1 py-3 font-medium transition-colors ${
            mode === 'hash'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
          }`}
        >
          {t(tt.hashTab)}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('verify');
            setError(null);
          }}
          className={`flex-1 py-3 font-medium transition-colors ${
            mode === 'verify'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
          }`}
        >
          {t(tt.verifyTab)}
        </button>
      </div>

      {mode === 'hash' ? (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tt.password)}
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(tt.passwordPlaceholder)}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)] font-mono
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-[var(--color-text)]">{t(tt.costFactor)}</label>
              <span className="font-mono text-[var(--color-text-muted)]">{cost}</span>
            </div>
            <input
              type="range"
              min={4}
              max={15}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <p className="text-xs text-[var(--color-text-muted)]">{t(tt.costHint)}</p>
          </div>

          <button
            type="button"
            onClick={runHash}
            disabled={busy}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              font-medium transition-colors disabled:opacity-50"
          >
            {busy ? t(tt.hashing) : t(tt.hashButton)}
          </button>

          {hash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--color-text)]">{t(tt.hashOutput)}</label>
                <button
                  type="button"
                  onClick={copyHash}
                  className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                    border border-[var(--color-border)] rounded transition-colors"
                >
                  {copied ? t(tc.copied) : t(tc.copy)}
                </button>
              </div>
              <code
                className="block w-full p-4 rounded-lg border border-[var(--color-border)]
                  bg-[var(--color-bg)] text-[var(--color-text)] font-mono text-sm break-all"
              >
                {hash}
              </code>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tt.password)}
            </label>
            <input
              type="text"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder={t(tt.passwordPlaceholder)}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)] font-mono
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tt.bcryptHash)}
            </label>
            <textarea
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder={t(tt.hashPlaceholder)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
          </div>

          <button
            type="button"
            onClick={runVerify}
            disabled={busy}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              font-medium transition-colors disabled:opacity-50"
          >
            {busy ? t(tt.verifying) : t(tt.verifyButton)}
          </button>

          {match !== null && (
            <div
              className={`p-4 rounded-lg border text-center font-medium ${
                match
                  ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}
            >
              {match ? t(tt.match) : t(tt.noMatch)}
            </div>
          )}
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
        <p className="text-sm text-[var(--color-text-muted)]">{t(tt.aboutNote)}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{t(tt.privacyNote)}</p>
      </div>
    </div>
  );
}
