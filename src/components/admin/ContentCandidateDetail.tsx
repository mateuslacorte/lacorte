'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  READY_SCORE_THRESHOLD,
  type CandidateAction,
  type CandidateStatus,
  type ContentCandidate,
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

interface ContentCandidateDetailProps {
  candidate: ContentCandidate;
  filenameSlug: string;
  preview: ReactNode;
}

export default function ContentCandidateDetail({
  candidate: initial,
  filenameSlug,
  preview,
}: ContentCandidateDetailProps) {
  const [candidate, setCandidate] = useState(initial);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateCandidate = async (patch: {
    status?: CandidateStatus;
    action?: CandidateAction;
  }) => {
    const res = await fetch(`/api/admin/content/candidates/${encodeURIComponent(candidate.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const { candidate: row } = await res.json();
    setCandidate(row);
  };

  const copyPost = async () => {
    if (!candidate.markdownPost) return;
    await navigator.clipboard.writeText(candidate.markdownPost);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const downloadPost = () => {
    if (!candidate.markdownPost) return;
    const blob = new Blob([candidate.markdownPost], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameSlug || 'post'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ready = candidate.score >= READY_SCORE_THRESHOLD;

  return (
    <div className="space-y-8">
      <BackLink />

      <header className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              ready
                ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                : 'bg-[var(--color-card)] text-[var(--color-text-muted)]'
            }`}
          >
            Score {candidate.score}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">{candidate.topic}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{candidate.title}</h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-text-muted)]">
          <div>
            <dt className="inline font-medium text-[var(--color-text)]">Model: </dt>
            <dd className="inline">{candidate.model}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-[var(--color-text)]">Created: </dt>
            <dd className="inline">{new Date(candidate.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <select
            value={candidate.status}
            onChange={(e) =>
              void updateCandidate({ status: e.target.value as CandidateStatus })
            }
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm"
          >
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={candidate.action}
            onChange={(e) =>
              void updateCandidate({ action: e.target.value as CandidateAction })
            }
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm"
          >
            {Object.entries(actionLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Notes
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">{candidate.reason}</p>
      </section>

      {candidate.sourceTitles.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Source headlines
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--color-text)]">
            {candidate.sourceTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Full post</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Complete Markdown with frontmatter — ready for <code className="text-xs">src/content/blog/</code>.
            </p>
          </div>
          {candidate.markdownPost && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSource((v) => !v)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-card-hover)]"
              >
                {showSource ? 'Preview' : 'View source'}
              </button>
              <button
                type="button"
                onClick={() => void copyPost()}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-card-hover)]"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={downloadPost}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Download .md
              </button>
            </div>
          )}
        </div>

        {!candidate.markdownPost ? (
          <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm text-[var(--color-text-muted)]">
            No post stored for this candidate.
          </p>
        ) : showSource ? (
          <pre className="max-h-[40rem] overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-xs whitespace-pre-wrap text-[var(--color-text)]">
            {candidate.markdownPost}
          </pre>
        ) : (
          preview
        )}
      </section>

      <PromptBlock
        title="Input prompt"
        description="OpenRouter request sent for this curation run."
        text={candidate.inputPrompt}
        emptyMessage="Not recorded for this candidate (generated before prompt logging)."
      />
      <PromptBlock
        title="Raw output"
        description="Full assistant response from OpenRouter before JSON parsing."
        text={candidate.rawOutput}
        emptyMessage="Not recorded for this candidate (generated before output logging)."
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/content"
      className="inline-flex text-sm text-blue-600 hover:underline dark:text-blue-400"
    >
      ← Back to content list
    </Link>
  );
}

function PromptBlock({
  title,
  description,
  text,
  emptyMessage,
}: {
  title: string;
  description: string;
  text: string;
  emptyMessage: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>
        {text && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-card-hover)]"
            >
              {expanded ? 'Hide' : 'View'}
            </button>
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-card-hover)]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
      {!text ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      ) : expanded ? (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-[var(--color-bg)] p-4 text-xs whitespace-pre-wrap text-[var(--color-text)]">
          {text}
        </pre>
      ) : (
        <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-muted)]">{text}</p>
      )}
    </section>
  );
}
