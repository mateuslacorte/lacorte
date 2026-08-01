import { z } from 'zod';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import {
  CURATION_MODEL,
  candidateActionSchema,
  candidateStatusSchema,
  type RecentArticleInput,
} from '@/lib/content-curation/types';

const sectionSchema = z.object({
  heading: z.string().min(1),
  brief: z.string().min(1),
});

export const curationPlanSchema = z.object({
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
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1).max(8),
  date: z.string().min(1),
  intro: z.string().min(1),
  sections: z.array(sectionSchema).min(4).max(8),
});

export type CurationPlan = z.infer<typeof curationPlanSchema>;

const sectionBodySchema = z.object({
  markdown: z.string().min(1),
});

const MAX_LLM_ATTEMPTS = 3;

function editorialRules(): string {
  return `Editorial focus:
- Practical tutorials and workflows a working developer should know so tooling and AI trends do not outrun them.
- Down-to-earth: CLI, config, Docker, networking, backends, debugging, local-first habits.
- Use headlines only as a signal for what practitioners should learn right now.

Hard bans:
- No investors, funding rounds, market narratives, or big-tech strategy talk.
- No "agentic" hype or buzzword-first framing.
- Never write about a specific external GitHub repo, public codebase, or "clone this project" walkthrough — those will not exist for the reader. If you need an example, put a self-contained snippet or config IN the post itself.

## Tone Notes
- Technical blog with sassy humour — English only. Dry wit, light roast of bad defaults, smug satisfaction when the fix is one flag.
- Still grounded: every claim backed by a config snippet or CLI command. Humour is seasoning, not the meal.
- First-person practitioner voice is fine ("I ran this on my Hetzner box…"), but do not write as a soft personal diary. Punchier than a journal entry — more "here's the gotcha nobody warned you about."
- Assume reader knows Python, containers, Git. Explain only the non-obvious glue.

## Constraints
- No external dependencies beyond standard tooling.
- All code blocks runnable as-is (no placeholders like \`YOUR_API_KEY\`).
- Tags: reuse existing blog tags when they fit, or invent new short lowercase tags (3–6 tags). Existing tags you may reuse include: portfolio, nestjs, backend, typescript, docker, observability, api, firefox, extension, routeros, networking, bash, javascript, nodejs, nextjs, vercel, python, security, sdk, mikrotik, betterstack, logs, graphql, reference, gmail, introduction, about, meta, retro, college, npm. You are free to create new ones.
- No images — ASCII diagrams or Mermaid only if critical.
- Final assembled post target length: ~2500 words (full long-form tutorial, not a short note). Standalone complete workflow (no series).`;
}

function formatHeadlines(articles: RecentArticleInput[]): string {
  return articles
    .map((a, i) => {
      const snippet = a.summary ? ` — ${a.summary.slice(0, 120)}` : '';
      return `${i + 1}. [${a.sourceId}] ${a.title}${snippet}`;
    })
    .join('\n');
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Prefer the largest fenced JSON block when multiple fences exist.
    const fenceMatches = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
    for (let i = fenceMatches.length - 1; i >= 0; i -= 1) {
      const body = fenceMatches[i]?.[1]?.trim();
      if (!body) continue;
      try {
        return JSON.parse(body);
      } catch {
        // try next
      }
    }

    // Balanced-brace scan from first `{` (handles trailing prose after JSON).
    const start = trimmed.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = start; i < trimmed.length; i += 1) {
        const ch = trimmed[i];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === '\\') {
            escaped = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === '{') depth += 1;
        if (ch === '}') {
          depth -= 1;
          if (depth === 0) {
            try {
              return JSON.parse(trimmed.slice(start, i + 1));
            } catch {
              break;
            }
          }
        }
      }
    }

    throw new Error('LLM returned invalid JSON');
  }
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

async function chatCompletion(
  prompt: string,
  maxTokens: number,
  temperature = 0.7,
): Promise<{ raw: string; prompt: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  // Use raw fetch — @openrouter/sdk response zod is too strict for free-model payloads
  // and throws opaque "Response validation failed" before we can read the text.
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model: CURATION_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  const bodyText = await res.text();
  let payload: unknown;
  try {
    payload = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    throw new Error(
      `OpenRouter returned non-JSON (HTTP ${res.status}): ${bodyText.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const errObj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const errMsg =
      (errObj?.error && typeof errObj.error === 'object' && errObj.error !== null
        ? String((errObj.error as { message?: string }).message ?? '')
        : '') || bodyText.slice(0, 200);
    throw new Error(`OpenRouter HTTP ${res.status}: ${errMsg || 'request failed'}`);
  }

  const raw = messageText(
    (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]
      ?.message?.content,
  );
  if (!raw) {
    throw new Error('Empty response from OpenRouter');
  }

  return { raw, prompt };
}

/** @deprecated alias kept for clarity in call sites */
async function chatJson(
  prompt: string,
  maxTokens: number,
  temperature = 0.7,
): Promise<{ raw: string; prompt: string }> {
  return chatCompletion(prompt, maxTokens, temperature);
}

function parseWithSchema<T>(raw: string, schema: z.ZodType<T>): T {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error('LLM returned invalid JSON');
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new Error(`LLM response failed validation (${detail})`);
  }

  return result.data;
}

function parseSectionMarkdown(raw: string, expectedHeading: string): string {
  let trimmed = raw.trim();

  // Prefer structured JSON when present.
  try {
    const body = parseWithSchema(trimmed, sectionBodySchema);
    return body.markdown.trim();
  } catch {
    // Fallback: model returned markdown directly.
  }

  // Strip a single outer markdown fence if the model wrapped the whole section.
  const outerFence = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)```$/i);
  if (outerFence?.[1]) {
    trimmed = outerFence[1].trim();
  }

  const headingNeedle = `## ${expectedHeading}`;
  if (trimmed.startsWith('## ')) {
    return trimmed;
  }

  const headingIdx = trimmed.indexOf(headingNeedle);
  if (headingIdx !== -1) {
    return trimmed.slice(headingIdx).trim();
  }

  const anyHeading = trimmed.match(/^##\s+.+/m);
  if (anyHeading?.index != null) {
    return trimmed.slice(anyHeading.index).trim();
  }

  // Last resort: wrap body under the expected heading.
  if (trimmed.length > 80) {
    return `${headingNeedle}\n\n${trimmed}`;
  }

  throw new Error('LLM returned invalid section markdown');
}

async function withRetries<T>(
  run: (attempt: number, temperature: number) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt += 1) {
    const temperature = attempt === 1 ? 0.7 : Math.max(0.2, 0.7 - attempt * 0.2);
    try {
      return await run(attempt, temperature);
    } catch (err) {
      lastError = err;
      const message = (err instanceof Error ? err.message : '').toLowerCase();
      const retryable =
        message.includes('invalid json') ||
        message.includes('validation') ||
        message.includes('empty response') ||
        message.includes('openrouter http 429') ||
        message.includes('openrouter http 5');
      if (!retryable || attempt === MAX_LLM_ATTEMPTS) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('LLM request failed');
}

export async function generateCurationPlan(articles: RecentArticleInput[]): Promise<{
  plan: CurationPlan;
  inputPrompt: string;
  rawOutput: string;
}> {
  if (articles.length === 0) {
    throw new Error('No recent articles available for curation');
  }

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are the writer for lacorte.dev — a technical blog with sassy humour and full long-form tutorials.

Recent RSS headlines (inspiration only — do NOT summarize news articles):
${formatHeadlines(articles)}

Task: Plan ONE original Markdown blog post for lacorte.dev. Do NOT write the full post yet.

${editorialRules()}

Return JSON only with these fields:
- title: post title
- topic: short topic label
- score: 0-100 quality/fit score (use 85+ only when truly ready to publish)
- status: one of ready, researching, hold, rejected
- action: one of new-post, update-existing, series, skip
- reason: 1-3 sentences on why this post helps a working developer
- description: 1-2 sentence meta description for frontmatter
- tags: array of 3-6 short lowercase tags
- date: ISO date string YYYY-MM-DD (use ${today} unless a better date is needed)
- intro: 150-250 word opening in the blog voice (no heading) — hook with attitude, then state what the reader will walk away able to do
- sections: array of 5-6 objects { heading, brief } where heading is an H2 title and brief is 1-2 sentences describing what that section must cover. Together the sections + intro must yield a ~2500 word post.

Do not wrap JSON in markdown fences.`;

  return withRetries(async (_attempt, temperature) => {
    const { raw, prompt: inputPrompt } = await chatJson(prompt, 4096, temperature);
    return {
      plan: parseWithSchema(raw, curationPlanSchema),
      inputPrompt,
      rawOutput: raw,
    };
  });
}

function summarizePreviousSections(sections: string[]): string {
  if (sections.length === 0) {
    return '(none yet — this is the first section after the intro)';
  }
  return sections
    .map((body, i) => {
      const heading = body.match(/^##\s+(.+)$/m)?.[1]?.trim() ?? `Section ${i + 1}`;
      const plain = body.replace(/^##\s+.+$/m, '').trim().replace(/\s+/g, ' ');
      const excerpt = plain.slice(0, 280);
      return `${i + 1}. ${heading} — ${excerpt}${plain.length > 280 ? '…' : ''}`;
    })
    .join('\n');
}

export async function generateCurationSection(input: {
  plan: CurationPlan;
  sectionIndex: number;
  previousMarkdown: string[];
}): Promise<{ markdown: string; inputPrompt: string; rawOutput: string }> {
  const section = input.plan.sections[input.sectionIndex];
  if (!section) {
    throw new Error(`Missing section at index ${input.sectionIndex}`);
  }

  const previous = summarizePreviousSections(input.previousMarkdown);

  const remaining = input.plan.sections.length - input.sectionIndex;
  const perSection = Math.round(2300 / input.plan.sections.length);
  const targetWords =
    remaining <= 1
      ? `${perSection + 50}-${perSection + 150}`
      : `${perSection - 50}-${perSection + 50}`;

  const prompt = `You are continuing a lacorte.dev blog post already outlined.

Post title: ${input.plan.title}
Post description: ${input.plan.description}

${editorialRules()}

Intro already written:
${input.plan.intro}

Sections already written (summaries — do not repeat):
${previous}

Write ONLY section ${input.sectionIndex + 1} of ${input.plan.sections.length}:
- Heading: ${section.heading}
- Brief: ${section.brief}

Write ONLY section ${input.sectionIndex + 1} of ${input.plan.sections.length}:
- Heading: ${section.heading}
- Brief: ${section.brief}

Return the section as Markdown ONLY (no JSON wrapper). It must start with "## ${section.heading}" and contain ${targetWords} words of body content under that heading (full depth — do not write a short summary section). Include runnable commands/config where useful. Keep the sassy technical tone. Do not repeat the intro or other sections. Do not wrap the whole section in a code fence.`;

  return withRetries(async (_attempt, temperature) => {
    const { raw, prompt: inputPrompt } = await chatCompletion(prompt, 4096, temperature);
    const markdown = parseSectionMarkdown(raw, section.heading);
    if (!markdown.startsWith('## ')) {
      throw new Error('LLM response failed validation (markdown: missing heading)');
    }
    return { markdown, inputPrompt, rawOutput: raw };
  });
}

export function assembleMarkdownPost(plan: CurationPlan, sectionBodies: string[]): string {
  const tags = plan.tags.map((tag) => `  - ${tag}`).join('\n');
  const description = plan.description.includes('\n')
    ? plan.description
    : plan.description;

  return `---
title: '${plan.title.replace(/'/g, "''")}'
date: '${plan.date}'
tags:
${tags}
description: >-
  ${description}
---

${plan.intro.trim()}

${sectionBodies.map((body) => body.trim()).join('\n\n')}
`;
}

/** @deprecated Prefer generateCurationPlan + generateCurationSection for background jobs. */
export async function generateCurationIdea(articles: RecentArticleInput[]) {
  const { plan, inputPrompt, rawOutput } = await generateCurationPlan(articles);
  const sectionBodies: string[] = [];
  const prompts = [inputPrompt];
  const raws = [rawOutput];

  for (let i = 0; i < plan.sections.length; i += 1) {
    const section = await generateCurationSection({
      plan,
      sectionIndex: i,
      previousMarkdown: sectionBodies,
    });
    sectionBodies.push(section.markdown);
    prompts.push(section.inputPrompt);
    raws.push(section.rawOutput);
  }

  return {
    idea: {
      title: plan.title,
      topic: plan.topic,
      score: plan.score,
      status: plan.status,
      action: plan.action,
      reason: plan.reason,
      markdownPost: assembleMarkdownPost(plan, sectionBodies),
    },
    inputPrompt: prompts.join('\n\n---\n\n'),
    rawOutput: raws.join('\n\n---\n\n'),
  };
}
