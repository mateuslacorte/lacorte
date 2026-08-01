'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface UtmParams {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

const SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
];

const MEDIUMS = [
  { value: 'cpc', label: 'CPC (Cost Per Click)' },
  { value: 'cpm', label: 'CPM (Cost Per Mille)' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'organic', label: 'Organic' },
  { value: 'referral', label: 'Referral' },
  { value: 'display', label: 'Display' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'banner', label: 'Banner' },
];

export default function UtmBuilder({ lang: initialLang }: { lang?: Language } = {}) {
  const { t } = useTranslation(initialLang);

  const [params, setParams] = useState<UtmParams>({
    url: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    if (!params.url) return '';

    try {
      const url = new URL(params.url.startsWith('http') ? params.url : `https://${params.url}`);

      if (params.source) url.searchParams.set('utm_source', params.source);
      if (params.medium) url.searchParams.set('utm_medium', params.medium);
      if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
      if (params.term) url.searchParams.set('utm_term', params.term);
      if (params.content) url.searchParams.set('utm_content', params.content);

      return url.toString();
    } catch {
      return '';
    }
  }, [params]);

  const isValid = params.url && params.source && params.medium && params.campaign;

  const copyToClipboard = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAll = () => {
    setParams({
      url: '',
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: '',
    });
  };

  const loadExample = () => {
    setParams({
      url: 'https://example.com/product',
      source: 'facebook',
      medium: 'cpc',
      campaign: 'spring_sale_2024',
      term: '',
      content: 'banner_v1',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={loadExample}
          className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t({ en: 'Load Example', pt: 'Load Example' })}
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t({ en: 'Clear', pt: 'Clear' })}
        </button>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t({ en: 'Website URL', pt: 'Website URL' })} *
        </label>
        <input
          type="text"
          value={params.url}
          onChange={(e) => setParams({ ...params, url: e.target.value })}
          placeholder="https://example.com/page"
          className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)]
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Required Parameters */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Source */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            utm_source * <span className="text-[var(--color-text-muted)] font-normal">({t({ en: 'Traffic Source', pt: 'Traffic Source' })})</span>
          </label>
          <select
            value={params.source}
            onChange={(e) => setParams({ ...params, source: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t({ en: 'Select', pt: 'Select' })}</option>
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={params.source}
            onChange={(e) => setParams({ ...params, source: e.target.value })}
            placeholder={t({ en: 'Or type custom', pt: 'Or type custom' })}
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Medium */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            utm_medium * <span className="text-[var(--color-text-muted)] font-normal">({t({ en: 'Marketing Medium', pt: 'Marketing Medium' })})</span>
          </label>
          <select
            value={params.medium}
            onChange={(e) => setParams({ ...params, medium: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t({ en: 'Select', pt: 'Select' })}</option>
            {MEDIUMS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={params.medium}
            onChange={(e) => setParams({ ...params, medium: e.target.value })}
            placeholder={t({ en: 'Or type custom', pt: 'Or type custom' })}
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Campaign */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            utm_campaign * <span className="text-[var(--color-text-muted)] font-normal">({t({ en: 'Campaign Name', pt: 'Campaign Name' })})</span>
          </label>
          <input
            type="text"
            value={params.campaign}
            onChange={(e) => setParams({ ...params, campaign: e.target.value })}
            placeholder="spring_sale_2024"
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            {t({ en: 'Use underscores instead of spaces', pt: 'Use underscores instead of spaces' })}
          </p>
        </div>
      </div>

      {/* Optional Parameters */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Term */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            utm_term <span className="text-[var(--color-text-muted)] font-normal">({t({ en: 'Paid Search Keywords', pt: 'Paid Search Keywords' })})</span>
          </label>
          <input
            type="text"
            value={params.term}
            onChange={(e) => setParams({ ...params, term: e.target.value })}
            placeholder="running+shoes"
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            utm_content <span className="text-[var(--color-text-muted)] font-normal">({t({ en: 'Content Identifier', pt: 'Content Identifier' })})</span>
          </label>
          <input
            type="text"
            value={params.content}
            onChange={(e) => setParams({ ...params, content: e.target.value })}
            placeholder="banner_v1"
            className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Generated URL */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t({ en: 'Generated URL', pt: 'Generated URL' })}
          </label>
          <button
            onClick={copyToClipboard}
            disabled={!generatedUrl}
            className="px-3 py-1 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded
              transition-colors disabled:opacity-50"
          >
            {copied ? t({ en: 'Copied!', pt: 'Copied!' }) : t({ en: 'Copy', pt: 'Copy' })}
          </button>
        </div>
        <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] min-h-[60px]">
          {generatedUrl ? (
            <code className="text-sm font-mono text-[var(--color-text)] break-all">
              {generatedUrl}
            </code>
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">
              {t({ en: 'Enter URL and required parameters', pt: 'Enter URL and required parameters' })}
            </span>
          )}
        </div>
        {!isValid && params.url && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            {t({ en: 'Please fill in all required (*) fields', pt: 'Please fill in all required (*) fields' })}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t({ en: 'What are UTM Parameters?', pt: 'What are UTM Parameters?' })}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t({ en: 'UTM (Urchin Tracking Module) parameters are used to track marketing campaign traffic sources. They help measure campaign performance in analytics tools like Google Analytics.', pt: 'UTM (Urchin Tracking Module) parameters are used to track marketing campaign traffic sources. They help measure campaign performance in analytics tools like Google Analytics.' })}
        </p>
      </div>
    </div>
  );
}
