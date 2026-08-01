'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  READY_SCORE_THRESHOLD,
  type CandidateAction,
  type CandidateStatus,
  type ContentCandidateListItem,
  type CurationQuotaStats,
} from '@/lib/content-curation/types';

const statusLabel: Record<CandidateStatus, string> = {
  ready: 'Ready to publish',
  researching: 'Researching',
  hold: 'On hold',
  published: 'Published',
  rejected: 'Rejected',
};

const actionLabel: Record<CandidateAction, string> = {
  'new-post': 'New post',
  'update-existing': 'Update existing',
  series: 'Series',
  skip: 'Skip',
};

type JobSnapshot = {
  id?: string;
  status?: string;
  error?: string | null;
  progress?: { label?: string } | null;
};

function formatJobError(job: JobSnapshot): string {
  const label = job.progress?.label ? ` (${job.progress.label})` : '';
  return `${job.error ?? 'Curation job failed'}${label}`;
}

export default function ContentCurationDashboard() {
  const [candidates, setCandidates] = useState<ContentCandidateListItem[]>([]);
  const [stats, setStats] = useState<CurationQuotaStats | null>(null);
  const [quotaReason, setQuotaReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobLabel, setJobLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { preserveError?: boolean }) => {
    if (!opts?.preserveError) setError(null);
    try {
      const [quotaRes, candidatesRes] = await Promise.all([
        fetch('/api/admin/content/curate'),
        fetch('/api/admin/content/candidates'),
      ]);
      if (!quotaRes.ok || !candidatesRes.ok) {
        throw new Error('Failed to load admin data');
      }
      const quota = (await quotaRes.json()) as {
        allowed?: boolean;
        reason?: string | null;
        stats?: CurationQuotaStats;
        activeJob?: JobSnapshot | null;
        lastJob?: JobSnapshot | null;
      };
      const { candidates: rows } = await candidatesRes.json();
      setStats(quota.stats ?? null);
      setQuotaReason(quota.allowed ? null : (quota.reason ?? null));
      setCandidates(rows);

      if (quota.activeJob?.id) {
        setJobId(quota.activeJob.id);
        setJobStatus(quota.activeJob.status ?? null);
        setJobLabel(quota.activeJob.progress?.label ?? null);
        setGenerating(true);
      } else if (
        !opts?.preserveError &&
        quota.lastJob?.status === 'failed' &&
        quota.lastJob.error
      ) {
        setError(formatJobError(quota.lastJob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!jobId || !generating) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/content/curate?jobId=${encodeURIComponent(jobId)}`);
        const text = await res.text();
        let data: {
          error?: string;
          job?: JobSnapshot;
        } = {};
        try {
          data = text ? (JSON.parse(text) as typeof data) : {};
        } catch {
          if (!cancelled) {
            setJobLabel('Waiting for worker…');
          }
          return;
        }
        if (cancelled) return;

        if (!res.ok) {
          setJobLabel(data.error ?? `Poll HTTP ${res.status} — retrying…`);
          return;
        }

        const status = data.job?.status;
        setJobStatus(status ?? null);
        setJobLabel(data.job?.progress?.label ?? null);

        if (status === 'succeeded') {
          setGenerating(false);
          setJobId(null);
          setJobStatus(null);
          setJobLabel(null);
          setError(null);
          await load();
          return;
        }

        if (status === 'failed') {
          setGenerating(false);
          setJobId(null);
          setJobStatus(null);
          setJobLabel(null);
          setError(formatJobError(data.job ?? {}));
          await load({ preserveError: true });
        }
      } catch {
        if (!cancelled) {
          setJobLabel('Connection issue — still waiting…');
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, generating, load]);

  const generateNow = async () => {
    setGenerating(true);
    setError(null);
    setJobStatus('pending');
    setJobLabel('Queuing…');
    try {
      const res = await fetch('/api/admin/content/curate', { method: 'POST' });
      const text = await res.text();
      let data: {
        error?: string;
        ok?: boolean;
        skipped?: boolean;
        queued?: boolean;
        resumed?: boolean;
        jobId?: string;
        status?: string;
        reason?: string;
        progress?: { label?: string } | null;
        stats?: CurationQuotaStats;
      } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        throw new Error(
          res.ok
            ? 'Server returned an invalid response'
            : `Generate failed (HTTP ${res.status})`,
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Generate failed (HTTP ${res.status})`);
      if (data.skipped) {
        setQuotaReason(data.reason ?? 'Quota blocked');
        if (data.stats) setStats(data.stats);
        setGenerating(false);
        setJobStatus(null);
        setJobLabel(null);
        return;
      }
      if (data.queued && data.jobId) {
        setJobId(data.jobId);
        setJobStatus(data.status ?? 'pending');
        setJobLabel(
          data.progress?.label ??
            (data.resumed ? 'Resuming previous job…' : 'Starting…'),
        );
        if (data.stats) setStats(data.stats);
        return;
      }
      if (!data.ok) throw new Error(data.reason ?? 'Generate failed');
      setGenerating(false);
      setJobLabel(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed');
      setGenerating(false);
      setJobId(null);
      setJobStatus(null);
      setJobLabel(null);
    }
  };

  const updateCandidate = async (
    id: string,
    patch: { status?: CandidateStatus; action?: CandidateAction },
  ) => {
    const res = await fetch(`/api/admin/content/candidates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const { candidate } = await res.json();
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: candidate.status,
              action: candidate.action,
            }
          : c,
      ),
    );
  };

  const readyCount = candidates.filter((c) => c.score >= READY_SCORE_THRESHOLD).length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-[var(--color-text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">CONTENT CURATION</p>
        <h1 className="text-3xl font-bold tracking-tight">Content operations dashboard</h1>
        <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
          Nemotron 3 Ultra (free) via OpenRouter curates RSS headlines into full Markdown blog posts ready for src/content/blog/.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuotaCard label="Today" used={stats?.dailyUsed ?? 0} limit={stats?.dailyLimit ?? 1000} />
        <QuotaCard label="This hour" used={stats?.hourlyUsed ?? 0} limit={stats?.hourlyLimit ?? 42} />
        <QuotaCard label="This minute" used={stats?.minuteUsed ?? 0} limit={stats?.minuteLimit ?? 20} />
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">Ready (≥{READY_SCORE_THRESHOLD})</p>
          <p className="mt-2 text-3xl font-bold">{readyCount}</p>
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void generateNow()}
          disabled={generating || Boolean(quotaReason)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? 'Generating in background…' : 'Generate now'}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card-hover)]"
        >
          Refresh
        </button>
        {generating && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {jobLabel ?? `Job ${jobStatus ?? 'pending'}`} — polls until done; safe to leave this page.
          </p>
        )}
        {quotaReason && (
          <p className="text-sm text-[var(--color-text-muted)]">{quotaReason}</p>
        )}
        {stats?.nextEligibleAt && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Next slot: {new Date(stats.nextEligibleAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-card)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No candidates yet. Run the cron or click Generate now.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className={`border-t border-[var(--color-border)] ${
                    candidate.score >= READY_SCORE_THRESHOLD ? 'bg-green-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 align-top font-semibold">{candidate.score}</td>
                  <td className="max-w-[20rem] px-4 py-3 align-top">
                    <div className="line-clamp-2 font-medium text-[var(--color-text)]">{candidate.title}</div>
                    <div className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{candidate.topic}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={candidate.status}
                      onChange={(e) =>
                        void updateCandidate(candidate.id, {
                          status: e.target.value as CandidateStatus,
                        })
                      }
                      className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={candidate.action}
                      onChange={(e) =>
                        void updateCandidate(candidate.id, {
                          action: e.target.value as CandidateAction,
                        })
                      }
                      className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                    >
                      {Object.entries(actionLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/content/${encodeURIComponent(candidate.id)}`}
                      className="inline-block rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-card-hover)]"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotaCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">
        {used}
        <span className="text-lg font-normal text-[var(--color-text-muted)]"> / {limit}</span>
      </p>
    </article>
  );
}
