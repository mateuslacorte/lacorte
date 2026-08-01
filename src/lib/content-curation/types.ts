import { z } from 'zod';

export const CURATION_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free' as const;
export const MAX_RPM = 20;
export const MAX_RPD = 1000;
export const HOUR_BUDGET = Math.ceil(MAX_RPD / 24);
export const MIN_INTERVAL_MS = (24 * 60 * 60 * 1000) / MAX_RPD;
export const READY_SCORE_THRESHOLD = 85;

export const candidateStatusSchema = z.enum([
  'ready',
  'researching',
  'hold',
  'published',
  'rejected',
]);

export const candidateActionSchema = z.enum([
  'new-post',
  'update-existing',
  'series',
  'skip',
]);

export const curationResponseSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  score: z.coerce.number().int().min(0).max(100),
  status: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'on-hold') return 'hold';
    if (normalized === 'ready-to-publish') return 'ready';
    return normalized;
  }, candidateStatusSchema),
  action: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase().replace(/\s+/g, '-');
  }, candidateActionSchema),
  reason: z.string().min(1),
  markdownPost: z.string().min(1),
});

export type CurationResponse = z.infer<typeof curationResponseSchema>;

export interface CurationGenerationResult {
  idea: CurationResponse;
  inputPrompt: string;
  rawOutput: string;
}

export type CandidateStatus = z.infer<typeof candidateStatusSchema>;
export type CandidateAction = z.infer<typeof candidateActionSchema>;

export interface ContentCandidateListItem {
  id: string;
  title: string;
  topic: string;
  score: number;
  status: CandidateStatus;
  action: CandidateAction;
  createdAt: string;
}

export interface ContentCandidate {
  id: string;
  title: string;
  topic: string;
  score: number;
  status: CandidateStatus;
  action: CandidateAction;
  reason: string;
  markdownPost: string;
  inputPrompt: string;
  rawOutput: string;
  sourceTitles: string[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurationQuotaStats {
  dailyUsed: number;
  dailyLimit: number;
  hourlyUsed: number;
  hourlyLimit: number;
  minuteUsed: number;
  minuteLimit: number;
  nextEligibleAt: string | null;
}

export interface CurationQuotaResult {
  allowed: boolean;
  reason: string | null;
  stats: CurationQuotaStats;
}

export type CurationTrigger = 'cron' | 'manual';

export interface RecentArticleInput {
  url: string;
  title: string;
  sourceId: string;
  summary: string | null;
  publishedAt: string | null;
}
