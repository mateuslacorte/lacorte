import { NextResponse } from 'next/server';
import {
  executeCurationJobStep,
} from '@/lib/content-curation/jobs';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export const maxDuration = 300;

/** Leave headroom under maxDuration for the response to return. */
const WORKER_DEADLINE_MS = 240_000;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { jobId?: string };
    if (!body.jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const started = Date.now();
    let job;
    let shouldContinue = true;
    let skipped = false;
    let steps = 0;

    // Run as many steps as fit in this invocation. Do NOT self-fetch this route
    // (Vercel treats worker→worker HTTP as an infinite loop). Poll/cron resumes.
    while (shouldContinue && !skipped && Date.now() - started < WORKER_DEADLINE_MS) {
      const result = await executeCurationJobStep(supabase, body.jobId);
      job = result.job;
      shouldContinue = result.continue;
      skipped = Boolean(result.skipped);
      steps += 1;
      if (job.status === 'succeeded' || job.status === 'failed') break;
    }

    return NextResponse.json({
      ok: true,
      job,
      continue: shouldContinue && !skipped,
      skipped: Boolean(skipped),
      steps,
    });
  } catch (err) {
    console.error('[admin/content/curate/worker]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
