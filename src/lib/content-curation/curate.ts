import type { SupabaseClient } from '@supabase/supabase-js';
import { loadUnusedRecentArticles, markArticlesConsumed } from '@/lib/content-curation/articles';
import { generateCurationIdea } from '@/lib/content-curation/openrouter';
import { canRunCuration, logCurationCall } from '@/lib/content-curation/quota';
import {
  CURATION_MODEL,
  type ContentCandidate,
  type ContentCandidateListItem,
  type CurationTrigger,
} from '@/lib/content-curation/types';

export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function candidateId(title: string, now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `${slugifyTitle(title)}-${date}`;
}

type CandidateRow = {
  id: string;
  title: string;
  topic: string;
  score: number;
  status: string;
  action: string;
  reason: string;
  markdown_post: string;
  input_prompt?: string;
  raw_output?: string;
  source_titles: unknown;
  model: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CandidateRow): ContentCandidate {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    score: row.score,
    status: row.status as ContentCandidate['status'],
    action: row.action as ContentCandidate['action'],
    reason: row.reason,
    markdownPost: row.markdown_post,
    inputPrompt: row.input_prompt ?? '',
    rawOutput: row.raw_output ?? '',
    sourceTitles: Array.isArray(row.source_titles)
      ? row.source_titles.filter((t): t is string => typeof t === 'string')
      : [],
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapListRow(row: {
  id: string;
  title: string;
  topic: string;
  score: number;
  status: string;
  action: string;
  created_at: string;
}): ContentCandidateListItem {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    score: row.score,
    status: row.status as ContentCandidateListItem['status'],
    action: row.action as ContentCandidateListItem['action'],
    createdAt: row.created_at,
  };
}

export async function loadContentCandidates(
  supabase: SupabaseClient,
): Promise<ContentCandidateListItem[]> {
  const { data, error } = await supabase
    .from('content_candidates')
    .select('id, title, topic, score, status, action, created_at')
    .order('score', { ascending: false });

  if (error || !data) {
    console.error('[curation] load candidates failed:', error?.message);
    return [];
  }

  return data.map(mapListRow);
}

export async function loadContentCandidateById(
  supabase: SupabaseClient,
  id: string,
): Promise<ContentCandidate | null> {
  const { data, error } = await supabase
    .from('content_candidates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[curation] load candidate failed:', error.message);
    return null;
  }

  return data ? mapRow(data) : null;
}

export async function updateContentCandidate(
  supabase: SupabaseClient,
  id: string,
  patch: { status?: ContentCandidate['status']; action?: ContentCandidate['action'] },
): Promise<ContentCandidate | null> {
  const { data, error } = await supabase
    .from('content_candidates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    console.error('[curation] update candidate failed:', error?.message);
    return null;
  }

  return mapRow(data);
}

export interface CurationRunResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  candidate?: ContentCandidate;
  stats?: Awaited<ReturnType<typeof canRunCuration>>['stats'];
}

export async function runContentCuration(
  supabase: SupabaseClient,
  trigger: CurationTrigger,
): Promise<CurationRunResult> {
  const quota = await canRunCuration(supabase);
  if (!quota.allowed) {
    return { ok: true, skipped: true, reason: quota.reason ?? 'Quota blocked', stats: quota.stats };
  }

  const articles = await loadUnusedRecentArticles(supabase);
  if (articles.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: 'No new RSS articles to curate.',
      stats: quota.stats,
    };
  }

  try {
    const { idea, inputPrompt, rawOutput } = await generateCurationIdea(articles);
    const now = new Date();
    const id = candidateId(idea.title, now);

    const row = {
      id,
      title: idea.title,
      topic: idea.topic,
      score: idea.score,
      status: idea.status,
      action: idea.action,
      reason: idea.reason,
      markdown_post: idea.markdownPost,
      input_prompt: inputPrompt,
      raw_output: rawOutput,
      source_titles: articles.map((a) => a.title),
      model: CURATION_MODEL,
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('content_candidates')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    await markArticlesConsumed(
      supabase,
      articles.map((a) => a.url),
    );
    await logCurationCall(supabase, { trigger, success: true });

    const refreshed = await canRunCuration(supabase);
    return {
      ok: true,
      candidate: mapRow(data),
      stats: refreshed.stats,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Curation failed';
    await logCurationCall(supabase, { trigger, success: false, error: message });
    return { ok: false, reason: message, stats: quota.stats };
  }
}
