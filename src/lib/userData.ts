// Per-user tool data: instant localStorage cache + Supabase sync keyed to the
// visitor's (anonymous) auth session. localStorage keeps the UI snappy and
// works before/without a session; Supabase makes the data durable.
import { getSupabase, ensureSession } from './supabase';

const FAVORITES_KEY = 'lacorte_favorite_tools';
const BLOG_FAVORITES_KEY = 'lacorte_favorite_posts';
const RECENT_KEY = 'lacorte_recent_tools';
const MAX_RECENT = 5;

export type FavoriteKind = 'tool' | 'blog';

export interface RecentTool {
  slug: string;
  title: string;
  icon: string;
  visitedAt: number;
}

function favoritesKey(kind: FavoriteKind): string {
  return kind === 'blog' ? BLOG_FAVORITES_KEY : FAVORITES_KEY;
}

// --- Favorites ---------------------------------------------------------------

export function getFavorites(kind: FavoriteKind = 'tool'): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(favoritesKey(kind));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(slug: string, kind: FavoriteKind = 'tool'): boolean {
  if (typeof window === 'undefined') return false;

  const favorites = getFavorites(kind);
  const index = favorites.indexOf(slug);
  const added = index === -1;

  if (added) favorites.push(slug);
  else favorites.splice(index, 1);

  try {
    localStorage.setItem(favoritesKey(kind), JSON.stringify(favorites));
  } catch {
    /* storage full/blocked: Supabase sync below still applies */
  }

  void syncFavorite(slug, added, kind);
  return added;
}

async function syncFavorite(
  slug: string,
  added: boolean,
  kind: FavoriteKind,
): Promise<void> {
  try {
    const userId = await ensureSession();
    if (!userId) return;
    const supabase = getSupabase();
    if (kind === 'blog') {
      if (added) {
        await supabase.from('user_blog_favorites').upsert({ user_id: userId, post_slug: slug });
      } else {
        await supabase
          .from('user_blog_favorites')
          .delete()
          .match({ user_id: userId, post_slug: slug });
      }
      return;
    }

    if (added) {
      await supabase.from('user_favorites').upsert({ user_id: userId, tool_slug: slug });
    } else {
      await supabase.from('user_favorites').delete().match({ user_id: userId, tool_slug: slug });
    }
  } catch {
    /* offline or unconfigured Supabase: localStorage remains source of truth */
  }
}

/** Pull server favorites into the local cache (call once per page). */
export async function hydrateFavorites(kind: FavoriteKind = 'tool'): Promise<string[]> {
  const local = getFavorites(kind);
  try {
    const userId = await ensureSession();
    if (!userId) return local;

    if (kind === 'blog') {
      const { data } = await getSupabase()
        .from('user_blog_favorites')
        .select('post_slug')
        .eq('user_id', userId);
      if (!data) return local;
      const merged = [...new Set([...local, ...data.map((row) => row.post_slug as string)])];
      localStorage.setItem(favoritesKey(kind), JSON.stringify(merged));
      return merged;
    }

    const { data } = await getSupabase()
      .from('user_favorites')
      .select('tool_slug')
      .eq('user_id', userId);
    if (!data) return local;

    const merged = [...new Set([...local, ...data.map((row) => row.tool_slug as string)])];
    localStorage.setItem(favoritesKey(kind), JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

// --- Recent tools ------------------------------------------------------------

export function getRecentTools(): RecentTool[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function trackToolVisit(slug: string, title: string, icon: string): void {
  if (typeof window === 'undefined') return;

  try {
    let tools = getRecentTools().filter((tool) => tool.slug !== slug);
    tools.unshift({ slug, title, icon, visitedAt: Date.now() });
    tools = tools.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(tools));
  } catch (err) {
    console.error('Failed to track tool visit:', err);
  }

  void syncRecentVisit(slug, title, icon);
}

async function syncRecentVisit(slug: string, title: string, icon: string): Promise<void> {
  try {
    const userId = await ensureSession();
    if (!userId) return;
    await getSupabase()
      .from('user_recent_tools')
      .upsert({
        user_id: userId,
        tool_slug: slug,
        title,
        icon,
        visited_at: new Date().toISOString(),
      });
  } catch {
    /* offline or unconfigured Supabase */
  }
}
