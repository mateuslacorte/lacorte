import type { SupabaseClient } from '@supabase/supabase-js';
import { markArticlesConsumed } from '@/lib/content-curation/articles';
import {
  assembleMarkdownPost,
  generateCurationPlan,
  generateCurationSection,
  type CurationPlan,
} from '@/lib/content-curation/openrouter';
import { canRunCuration, logCurationCall } from '@/lib/content-curation/quota';
import {
  CURATION_MODEL,
  type CurationTrigger,
  type RecentArticleInput,
} from '@/lib/content-curation/types';

/** Lease covers a full worker burst (under maxDuration 300s). */
const LEASE_MS = 280 * 1000;
/** Only resume-kick if the lease has been free at least this long (avoids pile-up). */
const RESUME_COOLDOWN_MS = 5_000;

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export type CurationJobStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export type CurationJobPhase = 'plan' | 'write_section' | 'persist';

export interface CurationJobProgress {
  phase: CurationJobPhase;
  articles: RecentArticleInput[];
  plan?: CurationPlan;
  sectionBodies?: string[];
  nextSectionIndex?: number;
  inputPrompts?: string[];
  rawOutputs?: string[];
  label?: string;
}

export interface CurationJob {
  id: string;
  status: CurationJobStatus;
  trigger: CurationTrigger;
  error: string | null;
  candidateId: string | null;
  progress: CurationJobProgress | null;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface CurationStepResult {
  job: CurationJob;
  /** When true, the caller should invoke the worker again (via poll resume / cron). */
  continue: boolean;
  /** True when another worker already holds the lease — do not call OpenRouter again. */
  skipped?: boolean;
}

function mapProgress(value: unknown): CurationJobProgress | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<CurationJobProgress>;
  if (raw.phase !== 'plan' && raw.phase !== 'write_section' && raw.phase !== 'persist') {
    return null;
  }
  if (!Array.isArray(raw.articles)) return null;
  return {
    phase: raw.phase,
    articles: raw.articles as RecentArticleInput[],
    plan: raw.plan,
    sectionBodies: Array.isArray(raw.sectionBodies) ? raw.sectionBodies : [],
    nextSectionIndex: typeof raw.nextSectionIndex === 'number' ? raw.nextSectionIndex : 0,
    inputPrompts: Array.isArray(raw.inputPrompts) ? raw.inputPrompts : [],
    rawOutputs: Array.isArray(raw.rawOutputs) ? raw.rawOutputs : [],
    label: typeof raw.label === 'string' ? raw.label : undefined,
  };
}

function mapJob(row: {
  id: string;
  status: string;
  trigger: string;
  error: string | null;
  candidate_id: string | null;
  progress?: unknown;
  locked_until?: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}): CurationJob {
  return {
    id: row.id,
    status: row.status as CurationJobStatus,
    trigger: row.trigger as CurationTrigger,
    error: row.error,
    candidateId: row.candidate_id,
    progress: mapProgress(row.progress),
    lockedUntil: row.locked_until ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at,
  };
}

export async function findActiveCurationJob(
  supabase: SupabaseClient,
): Promise<CurationJob | null> {
  const { data, error } = await supabase
    .from('content_curation_jobs')
    .select('*')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[curation/jobs] find active failed:', error.message);
    return null;
  }

  return data ? mapJob(data) : null;
}

export async function findLatestCurationJob(
  supabase: SupabaseClient,
): Promise<CurationJob | null> {
  const { data, error } = await supabase
    .from('content_curation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[curation/jobs] find latest failed:', error.message);
    return null;
  }

  return data ? mapJob(data) : null;
}

/** Failed job that still has a plan and can continue writing sections / persist. */
export function isResumableFailedJob(job: CurationJob): boolean {
  if (job.status !== 'failed') return false;
  const progress = job.progress;
  if (!progress?.plan || !Array.isArray(progress.articles) || progress.articles.length === 0) {
    return false;
  }
  if (progress.phase === 'plan') return false;
  return progress.phase === 'write_section' || progress.phase === 'persist';
}

/** True when it is safe to kick the worker (no live lease). */
export function shouldResumeCurationJob(job: CurationJob, now = Date.now()): boolean {
  if (job.status !== 'pending' && job.status !== 'running') return false;
  if (!job.lockedUntil) return true;
  const lockedUntil = Date.parse(job.lockedUntil);
  if (Number.isNaN(lockedUntil)) return true;
  if (lockedUntil > now) return false;
  return now - lockedUntil >= RESUME_COOLDOWN_MS;
}

export async function createCurationJob(
  supabase: SupabaseClient,
  trigger: CurationTrigger,
  articles: RecentArticleInput[],
): Promise<CurationJob> {
  const progress: CurationJobProgress = {
    phase: 'plan',
    articles,
    sectionBodies: [],
    nextSectionIndex: 0,
    inputPrompts: [],
    rawOutputs: [],
    label: 'Planning post outline…',
  };

  const { data, error } = await supabase
    .from('content_curation_jobs')
    .insert({ status: 'pending', trigger, progress, locked_until: null })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create curation job');
  }

  return mapJob(data);
}

export async function resumeFailedCurationJob(
  supabase: SupabaseClient,
  job: CurationJob,
): Promise<CurationJob> {
  if (!isResumableFailedJob(job) || !job.progress) {
    throw new Error('Job is not resumable');
  }

  const plan = job.progress.plan!;
  const nextIndex = job.progress.nextSectionIndex ?? (job.progress.sectionBodies?.length ?? 0);
  const progress: CurationJobProgress = {
    ...job.progress,
    phase: nextIndex >= plan.sections.length ? 'persist' : 'write_section',
    nextSectionIndex: nextIndex,
    label:
      nextIndex >= plan.sections.length
        ? 'Saving candidate…'
        : `Writing section ${nextIndex + 1}/${plan.sections.length}…`,
  };

  await updateJob(supabase, job.id, {
    status: 'running',
    error: null,
    finished_at: null,
    locked_until: null,
    progress,
  });

  const refreshed = await getCurationJob(supabase, job.id);
  if (!refreshed) throw new Error('Failed to resume curation job');
  return refreshed;
}

export async function getCurationJob(
  supabase: SupabaseClient,
  id: string,
): Promise<CurationJob | null> {
  const { data, error } = await supabase
    .from('content_curation_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[curation/jobs] get failed:', error.message);
    return null;
  }

  return data ? mapJob(data) : null;
}

async function updateJob(
  supabase: SupabaseClient,
  id: string,
  patch: {
    status?: CurationJobStatus;
    error?: string | null;
    candidate_id?: string | null;
    progress?: CurationJobProgress;
    locked_until?: string | null;
    finished_at?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('content_curation_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[curation/jobs] update failed:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Atomically claim exclusive work on a job. Returns null if another worker holds the lease.
 */
async function claimJobLease(
  supabase: SupabaseClient,
  jobId: string,
): Promise<CurationJob | null> {
  const { data, error } = await supabase.rpc('claim_curation_job', {
    p_job_id: jobId,
    p_lease_seconds: Math.round(LEASE_MS / 1000),
  });

  if (error) {
    console.error('[curation/jobs] claim lease failed:', error.message);
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? mapJob(row) : null;
}

async function releaseJobLease(
  supabase: SupabaseClient,
  jobId: string,
  patch: {
    status?: CurationJobStatus;
    error?: string | null;
    candidate_id?: string | null;
    progress?: CurationJobProgress;
    finished_at?: string | null;
  },
): Promise<void> {
  await updateJob(supabase, jobId, { ...patch, locked_until: null });
}

function candidateId(title: string, now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `${slugifyTitle(title)}-${date}`;
}

async function persistCandidate(
  supabase: SupabaseClient,
  progress: CurationJobProgress,
): Promise<string> {
  const plan = progress.plan;
  if (!plan) throw new Error('Missing plan for persist');
  const sectionBodies = progress.sectionBodies ?? [];
  if (sectionBodies.length !== plan.sections.length) {
    throw new Error('Not all sections written before persist');
  }

  const markdownPost = assembleMarkdownPost(plan, sectionBodies);
  const inputPrompt = (progress.inputPrompts ?? []).join('\n\n---\n\n');
  const rawOutput = (progress.rawOutputs ?? []).join('\n\n---\n\n');
  const now = new Date();
  const id = candidateId(plan.title, now);

  const row = {
    id,
    title: plan.title,
    topic: plan.topic,
    score: plan.score,
    status: plan.status,
    action: plan.action,
    reason: plan.reason,
    markdown_post: markdownPost,
    input_prompt: inputPrompt,
    raw_output: rawOutput,
    source_titles: progress.articles.map((a) => a.title),
    model: CURATION_MODEL,
    updated_at: now.toISOString(),
  };

  const { error } = await supabase.from('content_candidates').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);

  await markArticlesConsumed(
    supabase,
    progress.articles.map((a) => a.url),
  );

  return id;
}

export async function kickCurationWorker(origin: string, jobId: string): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('Missing CRON_SECRET; cannot start background worker');
  }

  const res = await fetch(`${origin}/api/admin/content/curate/worker`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ jobId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Worker kick failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
}

/**
 * Runs a single curation step (plan, one section, or persist).
 * Safe to call repeatedly; resumes from stored progress.
 * Concurrent invocations are serialized via locked_until lease — extras skip OpenRouter.
 */
export async function executeCurationJobStep(
  supabase: SupabaseClient,
  jobId: string,
): Promise<CurationStepResult> {
  const existing = await getCurationJob(supabase, jobId);
  if (!existing) {
    throw new Error('Curation job not found');
  }
  if (existing.status === 'succeeded' || existing.status === 'failed') {
    return { job: existing, continue: false };
  }

  const job = await claimJobLease(supabase, jobId);
  if (!job) {
    const latest = (await getCurationJob(supabase, jobId)) ?? existing;
    return { job: latest, continue: false, skipped: true };
  }

  let progress = job.progress;
  if (!progress || !Array.isArray(progress.articles) || progress.articles.length === 0) {
    await releaseJobLease(supabase, jobId, {
      status: 'failed',
      error: 'Job has no article progress to resume',
      finished_at: new Date().toISOString(),
    });
    const refreshed = await getCurationJob(supabase, jobId);
    return { job: refreshed!, continue: false };
  }

  try {
    if (progress.phase === 'plan') {
      const quota = await canRunCuration(supabase, { ignoreSpacing: true });
      if (!quota.allowed) {
        await releaseJobLease(supabase, jobId, {
          status: 'running',
          progress: { ...progress, label: `Paused: ${quota.reason}` },
        });
        const refreshed = await getCurationJob(supabase, jobId);
        return { job: refreshed!, continue: false };
      }

      const { plan, inputPrompt, rawOutput } = await generateCurationPlan(progress.articles);
      await logCurationCall(supabase, { trigger: job.trigger, success: true });
      progress = {
        ...progress,
        phase: 'write_section',
        plan,
        sectionBodies: [],
        nextSectionIndex: 0,
        inputPrompts: [inputPrompt],
        rawOutputs: [rawOutput],
        label: `Writing section 1/${plan.sections.length}…`,
      };
      await releaseJobLease(supabase, jobId, { progress, status: 'running' });
      const refreshed = await getCurationJob(supabase, jobId);
      return { job: refreshed!, continue: true };
    }

    if (progress.phase === 'write_section') {
      const plan = progress.plan;
      if (!plan) throw new Error('Missing plan for write_section');

      const index = progress.nextSectionIndex ?? 0;
      if (index >= plan.sections.length) {
        progress = {
          ...progress,
          phase: 'persist',
          label: 'Saving candidate…',
        };
        await releaseJobLease(supabase, jobId, { progress, status: 'running' });
        const refreshed = await getCurationJob(supabase, jobId);
        return { job: refreshed!, continue: true };
      }

      const quota = await canRunCuration(supabase, { ignoreSpacing: true });
      if (!quota.allowed) {
        await releaseJobLease(supabase, jobId, {
          status: 'running',
          progress: {
            ...progress,
            label: `Paused: ${quota.reason}`,
          },
        });
        const refreshed = await getCurationJob(supabase, jobId);
        return { job: refreshed!, continue: false };
      }

      const section = await generateCurationSection({
        plan,
        sectionIndex: index,
        previousMarkdown: progress.sectionBodies ?? [],
      });
      await logCurationCall(supabase, { trigger: job.trigger, success: true });

      const sectionBodies = [...(progress.sectionBodies ?? []), section.markdown];
      const nextIndex = index + 1;
      const doneWriting = nextIndex >= plan.sections.length;

      progress = {
        ...progress,
        phase: doneWriting ? 'persist' : 'write_section',
        sectionBodies,
        nextSectionIndex: nextIndex,
        inputPrompts: [...(progress.inputPrompts ?? []), section.inputPrompt],
        rawOutputs: [...(progress.rawOutputs ?? []), section.rawOutput],
        label: doneWriting
          ? 'Saving candidate…'
          : `Writing section ${nextIndex + 1}/${plan.sections.length}…`,
      };
      await releaseJobLease(supabase, jobId, { progress, status: 'running' });
      const refreshed = await getCurationJob(supabase, jobId);
      return { job: refreshed!, continue: true };
    }

    const candidateIdValue = await persistCandidate(supabase, progress);
    await releaseJobLease(supabase, jobId, {
      status: 'succeeded',
      candidate_id: candidateIdValue,
      error: null,
      progress: { ...progress, label: 'Done' },
      finished_at: new Date().toISOString(),
    });
    const refreshed = await getCurationJob(supabase, jobId);
    return { job: refreshed!, continue: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Curation step failed';
    await logCurationCall(supabase, {
      trigger: job.trigger,
      success: false,
      error: message,
    });
    // Keep prior sectionBodies; only mark failed after OpenRouter retries exhausted upstream.
    await releaseJobLease(supabase, jobId, {
      status: 'failed',
      error: message,
      finished_at: new Date().toISOString(),
    });
    const refreshed = await getCurationJob(supabase, jobId);
    return { job: refreshed!, continue: false };
  }
}
