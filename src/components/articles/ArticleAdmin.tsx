'use client';

import { useState, useEffect } from 'react';
import {
  addArticlePick,
  addCustomSource,
  deleteArticlePick,
  deleteCustomSource,
  loadArticlePicks,
  loadArticleSources,
  randomSourceColor,
  SOURCE_EMOJI_OPTIONS,
  type ArticleCategory,
  type FeedSource,
  type PickedArticle,
} from '@/lib/articles';
import { ensureSession, getSupabase } from '@/lib/supabase';

const LEGACY_STORAGE_KEY = 'lacorte_article_aggregator_data';
const LEGACY_MIGRATED_KEY = 'lacorte_articles_migrated_v1';

const formatDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const groupByDate = (articles: PickedArticle[]): Map<string, PickedArticle[]> => {
  const groups = new Map<string, PickedArticle[]>();
  articles.forEach((article) => {
    const dateKey = formatDateKey(article.addedAt);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, article]);
  });
  return groups;
};

/** One-time migrate old localStorage picks/custom sources into Supabase. */
async function migrateLegacyLocalData(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(LEGACY_MIGRATED_KEY)) return;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
    return;
  }

  try {
    const parsed = JSON.parse(raw) as {
      customSources?: Array<{
        name: string;
        rssUrl?: string;
        category?: ArticleCategory;
        color?: string;
        icon?: string;
        description?: string;
      }>;
      pickedArticles?: Array<{
        title: string;
        link: string;
        description?: string;
        memo?: string;
      }>;
    };

    const supabase = getSupabase();

    for (const source of parsed.customSources ?? []) {
      if (!source.name || !source.rssUrl) continue;
      await addCustomSource(
        supabase,
        {
          name: source.name,
          rssUrl: source.rssUrl,
          category: source.category ?? 'global',
          color: source.color,
          icon: source.icon,
          description: source.description,
        },
        userId,
      );
    }

    for (const pick of parsed.pickedArticles ?? []) {
      if (!pick.link) continue;
      await addArticlePick(
        supabase,
        {
          title: pick.title || pick.link,
          link: pick.link,
          description: pick.description ?? '',
          memo: pick.memo,
        },
        userId,
      );
    }
  } catch (err) {
    console.warn('[articles] legacy migration failed:', err);
  } finally {
    localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
  }
}

export default function ArticleAdmin() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'articles'>('sources');
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [pickedArticles, setPickedArticles] = useState<PickedArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newSource, setNewSource] = useState({
    name: '',
    rssUrl: '',
    category: 'global' as ArticleCategory,
    icon: '📰',
    color: randomSourceColor(),
  });
  const [newPick, setNewPick] = useState({ title: '', link: '', description: '', memo: '' });

  const reload = async (uid: string) => {
    const supabase = getSupabase();
    const [allSources, picks] = await Promise.all([
      loadArticleSources(supabase),
      loadArticlePicks(supabase),
    ]);
    setSources(allSources);
    setPickedArticles(picks);
    setUserId(uid);
  };

  useEffect(() => {
    const init = async () => {
      const uid = await ensureSession();
      if (!uid) {
        setError('Not signed in. Open /login and use the magic link first.');
        setLoading(false);
        return;
      }

      await migrateLegacyLocalData(uid);
      await reload(uid);
      setLoading(false);
    };

    void init();
  }, []);

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.rssUrl || !userId) return;

    const supabase = getSupabase();
    const source = await addCustomSource(
      supabase,
      {
        name: newSource.name,
        rssUrl: newSource.rssUrl,
        category: newSource.category,
        icon: newSource.icon,
        color: newSource.color,
      },
      userId,
    );

    if (!source) {
      setError('Failed to add source.');
      return;
    }

    setSources((prev) => [...prev, source].sort((a, b) => a.name.localeCompare(b.name)));
    setNewSource({
      name: '',
      rssUrl: '',
      category: 'global',
      icon: '📰',
      color: randomSourceColor(),
    });
    setError(null);
  };

  const handleDeleteSource = async (source: FeedSource) => {
    if (source.isDefault) {
      setError('Built-in sources cannot be deleted.');
      return;
    }
    if (!confirm(`Delete source “${source.name}”?`)) return;

    const supabase = getSupabase();
    const ok = await deleteCustomSource(supabase, source.id);
    if (!ok) {
      setError('Failed to delete source.');
      return;
    }

    setSources((prev) => prev.filter((s) => s.id !== source.id));
    setError(null);
  };

  const handleAddPick = async () => {
    if (!newPick.link || !userId) return;

    const supabase = getSupabase();
    const pick = await addArticlePick(
      supabase,
      {
        title: newPick.title || newPick.link,
        link: newPick.link,
        description: newPick.description,
        memo: newPick.memo || undefined,
      },
      userId,
    );

    if (!pick) {
      setError('Failed to save article. Make sure you are signed in as admin.');
      return;
    }

    setPickedArticles((prev) => [pick, ...prev.filter((p) => p.link !== pick.link)]);
    setNewPick({ title: '', link: '', description: '', memo: '' });
    setError(null);
  };

  const handleDeletePick = async (articleUrl: string) => {
    if (!confirm('Delete this article?')) return;

    const supabase = getSupabase();
    const ok = await deleteArticlePick(supabase, articleUrl);
    if (!ok) {
      setError('Failed to delete article.');
      return;
    }

    setPickedArticles((prev) => prev.filter((p) => p.link !== articleUrl));
    setError(null);
  };

  const defaultSources = sources.filter((s) => s.isDefault);
  const customSources = sources.filter((s) => !s.isDefault);
  const groupedPicks = groupByDate(pickedArticles);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="opacity-80 mb-4">
          Manage RSS sources and article picks in Supabase. New sources are fetched by the daily articles cron.
        </p>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <span className="opacity-80">Sources</span>
            <span className="ml-2 font-bold">{sources.length}</span>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <span className="opacity-80">Collected</span>
            <span className="ml-2 font-bold">{pickedArticles.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {[
          { id: 'sources', label: `📡 RSS Sources (${sources.length})` },
          { id: 'articles', label: `⭐ Collected Articles (${pickedArticles.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
            <h3 className="font-semibold mb-4 text-[var(--color-text)]">📡 Add New RSS Source</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Source name *"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              />
              <input
                type="url"
                placeholder="RSS URL *"
                value={newSource.rssUrl}
                onChange={(e) => setNewSource({ ...newSource, rssUrl: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              />
              <select
                value={newSource.category}
                onChange={(e) => setNewSource({ ...newSource, category: e.target.value as ArticleCategory })}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              >
                <option value="global">Global</option>
                <option value="news">News</option>
                <option value="tech-blog">Tech blog</option>
                <option value="social">Social</option>
              </select>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 border border-[var(--color-border)]"
                  style={{ backgroundColor: `${newSource.color}33` }}
                  title="Preview"
                >
                  {newSource.icon}
                </div>
                <button
                  type="button"
                  onClick={() => setNewSource({ ...newSource, color: randomSourceColor() })}
                  className="px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-orange-400"
                >
                  Random color
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Emoji</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SOURCE_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewSource({ ...newSource, icon: emoji })}
                    className={`w-9 h-9 rounded-lg text-lg transition-all ${
                      newSource.icon === emoji
                        ? 'ring-2 ring-orange-500 bg-orange-100 dark:bg-orange-900/40'
                        : 'bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-orange-400'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                maxLength={8}
                placeholder="Or type a custom emoji"
                value={SOURCE_EMOJI_OPTIONS.includes(newSource.icon) ? '' : newSource.icon}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value) setNewSource({ ...newSource, icon: value });
                }}
                className="w-full sm:w-64 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              />
            </div>

            <button
              onClick={() => void handleAddSource()}
              className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Add source
            </button>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[var(--color-text)]">
              Built-in sources ({defaultSources.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {defaultSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${source.color}20` }}
                  >
                    {source.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--color-text)] truncate">{source.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{source.rssUrl}</div>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">built-in</span>
                </div>
              ))}
            </div>

            <h3 className="font-semibold mb-4 text-[var(--color-text)]">
              Custom sources ({customSources.length})
            </h3>
            {customSources.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                <p className="text-4xl mb-4">📡</p>
                <p>No custom sources added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${source.color}20` }}
                    >
                      {source.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--color-text)] truncate">{source.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] truncate">{source.rssUrl}</div>
                    </div>
                    <button
                      onClick={() => void handleDeleteSource(source)}
                      className="text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
            <h3 className="font-semibold mb-4 text-[var(--color-text)]">⭐ Collect New Article</h3>
            <div className="space-y-3">
              <input
                type="url"
                placeholder="Link URL *"
                value={newPick.link}
                onChange={(e) => setNewPick({ ...newPick, link: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              />
              <input
                type="text"
                placeholder="Title (optional - uses link if empty)"
                value={newPick.title}
                onChange={(e) => setNewPick({ ...newPick, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
              />
              <textarea
                placeholder="Memo (optional - why you saved it, notes for later)"
                value={newPick.memo}
                onChange={(e) => setNewPick({ ...newPick, memo: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] resize-none"
              />
              <button
                onClick={() => void handleAddPick()}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Collect
              </button>
            </div>
          </div>

          {pickedArticles.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <p className="text-4xl mb-4">⭐</p>
              <p>No collected articles yet.</p>
              <p className="text-sm mt-2">Collect links here — they save to Supabase immediately.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedPicks.entries()).map(([dateKey, picks]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <h3 className="font-semibold text-[var(--color-text)]">{dateKey}</h3>
                    <span className="text-sm text-[var(--color-text-muted)]">({picks.length})</span>
                  </div>

                  <div className="ml-6 border-l-2 border-orange-200 dark:border-orange-800 pl-4 space-y-3">
                    {picks.map((pick) => (
                      <div
                        key={pick.id}
                        className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <a
                              href={pick.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[var(--color-text)] hover:text-orange-600 transition-colors line-clamp-2"
                            >
                              {pick.title}
                            </a>
                            {pick.memo && (
                              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                💬 {pick.memo}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => void handleDeletePick(pick.link)}
                            className="text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
