'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ensureSession } from '@/lib/supabase';

export interface BlogComment {
  id: string;
  postSlug: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface BlogCommentsProps {
  slug: string;
}

export default function BlogComments({ slug }: BlogCommentsProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`);
      const data = (await res.json()) as { comments?: BlogComment[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load comments');
      setComments(data.comments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lacorte_comment_name');
      if (saved) setAuthorName(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await ensureSession();
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorName, body }),
      });
      const data = (await res.json()) as { comment?: BlogComment; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to post comment');
      if (data.comment) {
        setComments((prev) => [...prev, data.comment!]);
      }
      try {
        localStorage.setItem('lacorte_comment_name', authorName.trim());
      } catch {
        /* ignore */
      }
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-[var(--color-border)] pt-10">
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Comments</h2>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        Keep it useful — questions, corrections, and war stories welcome.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mb-10 space-y-4">
        <div>
          <label htmlFor="comment-name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="comment-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-primary-500"
            placeholder="How should we credit you?"
          />
        </div>
        <div>
          <label htmlFor="comment-body" className="mb-1.5 block text-sm font-medium">
            Comment
          </label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            required
            rows={4}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-primary-500"
            placeholder="Add your take…"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !authorName.trim() || !body.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No comments yet. Start the thread.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-semibold">{comment.authorName}</span>
                <time
                  dateTime={comment.createdAt}
                  className="text-xs text-[var(--color-text-muted)]"
                >
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
