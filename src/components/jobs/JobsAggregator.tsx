'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { getSupabase } from '@/lib/supabase';

const JOBS_DATA_URL = '/data/jobs.json';

interface SiteInfo {
  id: string;
  name: string;
  color: string;
  url: string;
  status: 'link-only';
  jobCount: number;
}

interface JobsData {
  jobs: [];
  sites: SiteInfo[];
  lastUpdated: string;
}

const defaultSites: SiteInfo[] = [
  { id: 'google', name: 'Google', color: '#4285F4', url: 'https://careers.google.com/jobs/results/', status: 'link-only', jobCount: 0 },
  { id: 'meta', name: 'Meta', color: '#0668E1', url: 'https://www.metacareers.com/jobs', status: 'link-only', jobCount: 0 },
  { id: 'amazon', name: 'Amazon', color: '#FF9900', url: 'https://www.amazon.jobs/en/search?category=software-development', status: 'link-only', jobCount: 0 },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF', url: 'https://jobs.careers.microsoft.com/global/en/search', status: 'link-only', jobCount: 0 },
  { id: 'apple', name: 'Apple', color: '#555555', url: 'https://jobs.apple.com/en-us/search?team=software-and-services-SFTWR', status: 'link-only', jobCount: 0 },
  { id: 'stripe', name: 'Stripe', color: '#635BFF', url: 'https://stripe.com/jobs/search', status: 'link-only', jobCount: 0 },
  { id: 'github', name: 'GitHub', color: '#24292F', url: 'https://www.github.careers/careers-home/jobs', status: 'link-only', jobCount: 0 },
  { id: 'airbnb', name: 'Airbnb', color: '#FF5A5F', url: 'https://careers.airbnb.com/positions/', status: 'link-only', jobCount: 0 },
  { id: 'shopify', name: 'Shopify', color: '#96BF48', url: 'https://www.shopify.com/careers', status: 'link-only', jobCount: 0 },
  { id: 'vercel', name: 'Vercel', color: '#000000', url: 'https://vercel.com/careers', status: 'link-only', jobCount: 0 },
  { id: 'netflix', name: 'Netflix', color: '#E50914', url: 'https://explore.jobs.netflix.net/careers', status: 'link-only', jobCount: 0 },
  { id: 'cloudflare', name: 'Cloudflare', color: '#F48120', url: 'https://www.cloudflare.com/careers/jobs/', status: 'link-only', jobCount: 0 },
];

async function loadSitesFromSupabase(): Promise<SiteInfo[] | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('job_sites')
      .select('id, name, color, url, status, job_count')
      .order('sort_order');

    if (error || !data?.length) return null;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      url: row.url,
      status: 'link-only' as const,
      jobCount: row.job_count ?? 0,
    }));
  } catch {
    return null;
  }
}

export default function JobsAggregator() {
  const { t, translations } = useTranslation();
  const pj = translations.pages.jobs;
  const [sites, setSites] = useState<SiteInfo[]>(defaultSites);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseSites = await loadSitesFromSupabase();
      if (supabaseSites) {
        setSites(supabaseSites);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(JOBS_DATA_URL);
        if (!response.ok) throw new Error('Failed to load data');
        const data: JobsData = await response.json();
        if (data.sites?.length) {
          setSites(data.sites);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t(pj.heading)}</h1>
        <p className="opacity-90">{t(pj.subtitle)}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 text-[var(--color-text)]">{t(pj.heading)}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-border)]"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--color-border)] rounded w-3/4"></div>
                  <div className="h-3 bg-[var(--color-border)] rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sites.map((site) => (
              <a
                key={site.id}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:border-primary-500 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: site.color }}
                >
                  {site.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--color-text)] truncate">{site.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{t(pj.viewJobs)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
