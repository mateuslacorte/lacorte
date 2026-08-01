'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';
import {
  getFavorites,
  toggleFavorite,
  hydrateFavorites,
  type FavoriteKind,
} from '../../lib/userData';

interface FavoriteButtonProps {
  slug: string;
  title: string;
  icon?: string;
  kind?: FavoriteKind;
  lang?: Language;
}

export { getFavorites, toggleFavorite };

export default function FavoriteButton({
  slug,
  title: _title,
  icon: _icon,
  kind = 'tool',
  lang,
}: FavoriteButtonProps) {
  const { t, translations } = useTranslation(lang);
  const tc = translations.tools.common;

  const [isFavorite, setIsFavorite] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setIsFavorite(getFavorites(kind).includes(slug));
    void hydrateFavorites(kind).then((favorites) => setIsFavorite(favorites.includes(slug)));
  }, [slug, kind]);

  const handleClick = () => {
    const newState = toggleFavorite(slug, kind);
    setIsFavorite(newState);

    if (newState) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 300);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg
        border transition-all text-sm font-medium
        ${isFavorite
          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400'
          : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-yellow-500 hover:text-yellow-500'
        }
        ${animate ? 'scale-110' : 'scale-100'}
      `}
      aria-label={isFavorite ? t(tc.removeFromFavorite) : t(tc.addToFavorite)}
      title={isFavorite ? t(tc.removeFromFavorite) : t(tc.addToFavorite)}
    >
      <svg
        className={`w-4 h-4 transition-transform ${animate ? 'scale-125' : ''}`}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      {isFavorite ? t(tc.favorited) : t(tc.favorite)}
    </button>
  );
}
