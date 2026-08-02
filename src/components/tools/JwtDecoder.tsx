'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface JwtParts {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

function decodeJwt(token: string): JwtParts {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValid: false,
      error: 'Invalid JWT format (should have 3 parts)',
    };
  }

  try {
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const signature = parts[2];

    return {
      header,
      payload,
      signature,
      isValid: true,
    };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValid: false,
      error: 'Failed to decode JWT',
    };
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function isExpired(exp: number): boolean {
  return Date.now() > exp * 1000;
}

export default function JwtDecoder({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.jwt;
  const common = translations.tools.common;

  const [token, setToken] = useState('');
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    return decodeJwt(token.trim());
  }, [token]);

  const copyToClipboard = async (text: string, part: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPart(part);
      setTimeout(() => setCopiedPart(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadExample = () => {
    // Example JWT (expired, for demo purposes)
    const exampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsInJvbGVzIjpbImFkbWluIiwidXNlciJdLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    setToken(exampleToken);
  };

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    // Special handling for timestamps
    if ((key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number') {
      const expired = key === 'exp' && isExpired(value);
      return (
        <span className={expired ? 'text-red-500' : ''}>
          {value} ({formatTimestamp(value)})
          {expired && <span className="ml-2 text-red-500 font-medium">EXPIRED</span>}
        </span>
      );
    }

    if (typeof value === 'object') {
      return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
    }

    return String(value);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tc.tokenLabel)}
          </label>
          <button
            onClick={loadExample}
            className="px-3 py-1 text-xs bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded transition-colors"
          >
            {t(common.loadExample)}
          </button>
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-y
            focus:outline-none focus:ring-2 focus:ring-primary-500 break-all"
        />
      </div>

      {/* Error */}
      {decoded && !decoded.isValid && (
        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">{decoded.error}</p>
        </div>
      )}

      {/* Decoded Parts */}
      {decoded && decoded.isValid && (
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-red-100 dark:bg-red-900/30">
              <span className="font-medium text-red-700 dark:text-red-300">
                {t(tc.header)} (ALGORITHM & TOKEN TYPE)
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'header')}
                className="px-2 py-1 text-xs bg-white/50 dark:bg-black/20 rounded"
              >
                {copiedPart === 'header' ? t(common.copied) : t(common.copy)}
              </button>
            </div>
            <div className="p-4 bg-[var(--color-card)]">
              <table className="w-full text-sm">
                <tbody>
                  {decoded.header && Object.entries(decoded.header).map(([key, value]) => (
                    <tr key={key} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2 pr-4 font-mono text-[var(--color-text-muted)]">{key}</td>
                      <td className="py-2 font-mono text-[var(--color-text)]">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload */}
          <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30">
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {t(tc.payload)} (DATA)
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'payload')}
                className="px-2 py-1 text-xs bg-white/50 dark:bg-black/20 rounded"
              >
                {copiedPart === 'payload' ? t(common.copied) : t(common.copy)}
              </button>
            </div>
            <div className="p-4 bg-[var(--color-card)]">
              <table className="w-full text-sm">
                <tbody>
                  {decoded.payload && Object.entries(decoded.payload).map(([key, value]) => (
                    <tr key={key} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2 pr-4 font-mono text-[var(--color-text-muted)] align-top">{key}</td>
                      <td className="py-2 font-mono text-[var(--color-text)]">{renderValue(key, value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature */}
          <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30">
              <span className="font-medium text-cyan-700 dark:text-cyan-300">
                {t(tc.signature)} (VERIFY SIGNATURE)
              </span>
              <button
                onClick={() => copyToClipboard(decoded.signature, 'signature')}
                className="px-2 py-1 text-xs bg-white/50 dark:bg-black/20 rounded"
              >
                {copiedPart === 'signature' ? t(common.copied) : t(common.copy)}
              </button>
            </div>
            <div className="p-4 bg-[var(--color-card)]">
              <code className="text-sm font-mono text-[var(--color-text)] break-all">
                {decoded.signature}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t(tc.warningNote)}
        </p>
      </div>

      {/* Common Claims Reference */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t(tc.commonClaims)}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
          <span><code>iss</code> - Issuer</span>
          <span><code>sub</code> - Subject</span>
          <span><code>aud</code> - Audience</span>
          <span><code>exp</code> - Expiration</span>
          <span><code>nbf</code> - Not Before</span>
          <span><code>iat</code> - Issued At</span>
        </div>
      </div>
    </div>
  );
}
