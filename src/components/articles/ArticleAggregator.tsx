'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadArticlePicks,
  loadArticleSources,
  loadFeedArticles,
  type ArticleCategory,
  type FeedArticle,
  type FeedSource,
  type PickedArticle,
} from '@/lib/articles';
import { dateLocale, type Language } from '@/i18n';
import { useTranslation } from '@/i18n/useTranslation';
import { ensureSession, getSupabase } from '@/lib/supabase';

function formatRelativeDate(
  dateStr: string,
  lang: Language,
  labels: { justNow: string; hoursAgo: string; daysAgo: string },
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffMs)) return '';
  if (diffHours < 1) return labels.justNow;
  if (diffHours < 24) return `${diffHours}${labels.hoursAgo}`;
  if (diffDays < 7) return `${diffDays}${labels.daysAgo}`;
  return date.toLocaleDateString(dateLocale(lang));
}

function formatDateKey(dateStr: string, lang: Language): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(dateLocale(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupByDate(articles: PickedArticle[], lang: Language): Map<string, PickedArticle[]> {
  const groups = new Map<string, PickedArticle[]>();
  articles.forEach((article) => {
    const dateKey = formatDateKey(article.addedAt, lang);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, article]);
  });
  return groups;
}

export default function ArticleAggregator() {
  const { lang, t, translations } = useTranslation();
  const copy = translations.pages.articles;

  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'picks'>('feed');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [feedSources, setFeedSources] = useState<FeedSource[]>([]);
  const [pickedArticles, setPickedArticles] = useState<PickedArticle[]>([]);
  const [selectedSourceFilters, setSelectedSourceFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortedSources = [...feedSources].sort((a, b) =>
    a.name.localeCompare(b.name, dateLocale(lang)),
  );
  const sourcesByCategory = {
    global: sortedSources.filter((s) => s.category === 'global'),
    news: sortedSources.filter((s) => s.category === 'news'),
    'tech-blog': sortedSources.filter((s) => s.category === 'tech-blog'),
    social: sortedSources.filter((s) => s.category === 'social'),
  };

  const toggleSourceFilter = (sourceId: string) => {
    setSelectedSourceFilters((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId],
    );
  };

  const toggleCategoryAll = (category: ArticleCategory) => {
    const categorySourceIds = sourcesByCategory[category].map((s) => s.id);
    const allSelected = categorySourceIds.every((id) => selectedSourceFilters.includes(id));
    if (allSelected) {
      setSelectedSourceFilters((prev) => prev.filter((id) => !categorySourceIds.includes(id)));
    } else {
      setSelectedSourceFilters((prev) => [...new Set([...prev, ...categorySourceIds])]);
    }
  };

  const clearAllFilters = () => setSelectedSourceFilters([]);

  const loadFeed = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await ensureSession();
      const supabase = getSupabase();
      const [sources, feed, picks] = await Promise.all([
        loadArticleSources(supabase),
        loadFeedArticles(supabase),
        loadArticlePicks(supabase),
      ]);
      setFeedSources(sources);
      setArticles(feed);
      setPickedArticles(picks);
    } catch (err) {
      setError(t(copy.loadError));
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [copy.loadError, t]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const filteredArticles =
    selectedSourceFilters.length === 0
      ? articles
      : articles.filter((a) => selectedSourceFilters.includes(a.sourceId));

  const groupedPicks = groupByDate(pickedArticles, lang);

  const categoryLabels: Record<ArticleCategory, string> = {
    news: `📰 ${t(copy.catNews)}`,
    global: `🌍 ${t(copy.catGlobal)}`,
    'tech-blog': `🏢 ${t(copy.catTechBlog)}`,
    social: `💬 ${t(copy.catSocial)}`,
  };

  const relativeLabels = {
    justNow: t(copy.justNow),
    hoursAgo: t(copy.hoursAgo),
    daysAgo: t(copy.daysAgo),
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{t(copy.heading)}</h1>
        </div>
        <p className="opacity-90 mb-4">{t(copy.subtitle)}</p>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <span className="opacity-80">RSS</span>
            <span className="ml-2 font-bold">{feedSources.length}</span>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <span className="opacity-80">{t(copy.articlesLabel)}</span>
            <span className="ml-2 font-bold">{filteredArticles.length}</span>
          </div>
          {pickedArticles.length > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <span className="opacity-80">{t(copy.savedLabel)}</span>
              <span className="ml-2 font-bold">{pickedArticles.length}</span>
            </div>
          )}
          <button
            onClick={() => void loadFeed()}
            disabled={refreshing}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
          >
            {refreshing ? t(copy.loading) : `🔄 ${t(copy.refresh)}`}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)] overflow-x-auto">
        {[
          { id: 'feed' as const, label: `📰 ${t(copy.tabFeed)}` },
          {
            id: 'picks' as const,
            label: `⭐ ${t(copy.tabSaved)}${pickedArticles.length > 0 ? ` (${pickedArticles.length})` : ''}`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'feed' && (
        <div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="w-full flex items-center justify-between p-3 mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-orange-400 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="font-medium">{t(copy.sourceFilter)}</span>
              {selectedSourceFilters.length > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full">
                  {selectedSourceFilters.length} {t(copy.selected)}
                </span>
              )}
            </div>
            <span className="text-[var(--color-text-muted)]">▼</span>
          </button>

          {isFilterOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsFilterOpen(false)} />
              <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-bg)] rounded-t-2xl max-h-[80vh] overflow-hidden animate-slide-up">
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
                </div>
                <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold text-lg">{t(copy.sourceFilter)}</h3>
                  <div className="flex items-center gap-2">
                    {selectedSourceFilters.length > 0 && (
                      <button onClick={clearAllFilters} className="text-sm text-orange-600 hover:text-orange-700">
                        {t(copy.reset)}
                      </button>
                    )}
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="p-2 hover:bg-[var(--color-card)] rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
                  <div className="text-sm text-[var(--color-text-muted)] mb-4">
                    {selectedSourceFilters.length > 0
                      ? `${selectedSourceFilters.length} ${t(copy.sourcesSelected)}`
                      : t(copy.showingAllSources)}
                  </div>

                  {(['news', 'global', 'tech-blog', 'social'] as ArticleCategory[]).map((category) => {
                    if (sourcesByCategory[category].length === 0) return null;
                    return (
                      <div key={category} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => toggleCategoryAll(category)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              sourcesByCategory[category].every((s) => selectedSourceFilters.includes(s.id))
                                ? 'bg-orange-600 text-white'
                                : 'bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                            }`}
                          >
                            {categoryLabels[category]} ({sourcesByCategory[category].length})
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-3 border-l-2 border-[var(--color-border)]">
                          {sourcesByCategory[category].map((source) => (
                            <button
                              key={source.id}
                              onClick={() => toggleSourceFilter(source.id)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                selectedSourceFilters.includes(source.id)
                                  ? 'text-white'
                                  : 'bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-orange-400'
                              }`}
                              style={
                                selectedSourceFilters.includes(source.id)
                                  ? { backgroundColor: source.color }
                                  : undefined
                              }
                            >
                              {source.icon} {source.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors"
                  >
                    {selectedSourceFilters.length > 0
                      ? `${t(copy.applyFilter)} ${selectedSourceFilters.length} ${t(copy.sources)}`
                      : t(copy.showAllSources)}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
                >
                  <div className="h-4 bg-[var(--color-border)] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[var(--color-border)] rounded w-full mb-2" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <p className="text-4xl mb-4">📭</p>
              <p>{t(copy.emptyFeed)}</p>
              <p className="text-sm mt-2">{t(copy.emptyFeedHint)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-orange-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: article.sourceColor }}
                        >
                          {article.source}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatRelativeDate(article.pubDate, lang, relativeLabels)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[var(--color-text)] group-hover:text-orange-600 transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[var(--color-text-muted)] group-hover:text-orange-600 shrink-0">↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'picks' && (
        <div className="space-y-6">
          {pickedArticles.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <p className="text-4xl mb-4">⭐</p>
              <p>{t(copy.emptySaved)}</p>
              <p className="text-sm mt-2">{t(copy.emptySavedHint)}</p>
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
                          <a
                            href={pick.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-text-muted)] hover:text-orange-600 transition-colors shrink-0"
                          >
                            ↗
                          </a>
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
