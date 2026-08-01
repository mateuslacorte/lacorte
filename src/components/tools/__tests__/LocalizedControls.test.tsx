import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FavoriteButton from '../FavoriteButton';
import ShareButton from '../ShareButton';
import BookmarkPrompt from '../BookmarkPrompt';

describe('localized shared tool controls', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders favorite controls from the explicit English route language', () => {
    render(<FavoriteButton slug="json" title="JSON Formatter" icon="{}" lang="en" />);

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toHaveTextContent('Favorite');
  });

  it('renders share controls from the explicit English route language', () => {
    render(<ShareButton title="JSON Formatter" description="Format JSON" lang="en" />);

    expect(screen.getByRole('button', { name: 'Share' })).toHaveTextContent('Share');
  });

  it('renders the delayed bookmark prompt in English', () => {
    vi.useFakeTimers();
    render(<BookmarkPrompt lang="en" />);

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByText('Bookmark this useful tool')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
