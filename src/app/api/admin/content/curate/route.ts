import { NextResponse, after } from 'next/server';
import { canRunCuration } from '@/lib/content-curation/quota';
import { loadUnusedRecentArticles } from '@/lib/content-curation/articles';
import {
  createCurationJob,
  findActiveCurationJob,
  findLatestCurationJob,
  getCurationJob,
  isResumableFailedJob,
  kickCurationWorker,
  resumeFailedCurationJob,
  shouldResumeCurationJob,
} from '@/lib/content-curation/jobs';
import { AdminAuthError, createSupabaseServerClient, requireAdminUser } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const supabase = await createSupabaseServerClient();
    const origin = new URL(request.url).origin;

    const active = await findActiveCurationJob(supabase);
    if (active) {
      const willResume = shouldResumeCurationJob(active);
      if (willResume) {
        after(async () => {
          try {
            await kickCurationWorker(origin, active.id);
          } catch (err) {
            console.error('[admin/content/curate] resume kick failed', err);
          }
        });
      }

      return NextResponse.json({
        ok: true,
        queued: true,
        jobId: active.id,
        status: active.status,
        progress: active.progress,
        reason: willResume
          ? 'A curation job is already in progress; resumed worker.'
          : 'A curation job is already in progress; worker still holds the lease.',
      });
    }

    const latest = await findLatestCurationJob(supabase);
    if (latest && isResumableFailedJob(latest)) {
      if (!process.env.CRON_SECRET) {
        return NextResponse.json(
          { error: 'Missing CRON_SECRET; cannot start background worker' },
          { status: 500 },
        );
      }

      const job = await resumeFailedCurationJob(supabase, latest);
      after(async () => {
        try {
          await kickCurationWorker(origin, job.id);
        } catch (err) {
          console.error('[admin/content/curate] failed to resume worker', err);
        }
      });

      return NextResponse.json({
        ok: true,
        queued: true,
        resumed: true,
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        reason: 'Resumed previous failed job from saved sections.',
      });
    }

    const quota = await canRunCuration(supabase);
    if (!quota.allowed) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: quota.reason ?? 'Quota blocked',
        stats: quota.stats,
      });
    }

    const articles = await loadUnusedRecentArticles(supabase);
    if (articles.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'No new RSS articles to curate.',
        stats: quota.stats,
      });
    }

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Missing CRON_SECRET; cannot start background worker' },
        { status: 500 },
      );
    }

    const job = await createCurationJob(supabase, 'manual', articles);

    after(async () => {
      try {
        await kickCurationWorker(origin, job.id);
      } catch (err) {
        console.error('[admin/content/curate] failed to start worker', err);
      }
    });

    return NextResponse.json({
      ok: true,
      queued: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      stats: quota.stats,
    });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[admin/content/curate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const supabase = await createSupabaseServerClient();
    const jobId = new URL(request.url).searchParams.get('jobId');
    const origin = new URL(request.url).origin;

    if (jobId) {
      const job = await getCurationJob(supabase, jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      // Poll heartbeat: continue the post without worker→worker self-fetch.
      if (shouldResumeCurationJob(job)) {
        after(async () => {
          try {
            await kickCurationWorker(origin, job.id);
          } catch (err) {
            console.error('[admin/content/curate] poll resume kick failed', err);
          }
        });
      }

      return NextResponse.json({ job });
    }

    const active = await findActiveCurationJob(supabase);
    const latest = active ? null : await findLatestCurationJob(supabase);
    const quota = await canRunCuration(supabase, { ignoreSpacing: Boolean(active) });

    return NextResponse.json({
      ...quota,
      activeJob: active,
      lastJob: latest,
    });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
