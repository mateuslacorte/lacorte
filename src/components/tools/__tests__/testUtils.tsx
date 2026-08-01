// Test utilities for tool components
import { render, RenderResult } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { toolTranslations } from '../../../i18n/translations/tools';
import { commonTranslations } from '../../../i18n/translations/common';
import { pageTranslations } from '../../../i18n/translations/pages';
import { gameTranslations } from '../../../i18n/translations/games';
import { chatTranslations } from '../../../i18n/translations/chat';

const { translationMock } = vi.hoisted(() => ({
  translationMock: {
    useTranslation: () => ({
      lang: 'en' as const,
      t: (obj: Record<string, string>) => obj.en || Object.values(obj)[0],
      changeLanguage: vi.fn(),
      translations: {
        tools: toolTranslations,
        common: commonTranslations,
        pages: pageTranslations,
        games: gameTranslations,
        chat: chatTranslations,
      },
    }),
  },
}));

vi.mock('../../../i18n/useTranslation', () => translationMock);
vi.mock('@/i18n/useTranslation', () => translationMock);
vi.mock('../../i18n/useTranslation', () => translationMock);

// Custom render function
export function renderTool(component: ReactElement): RenderResult {
  return render(component);
}

// Reset mocks before each test
export function setupTestEnvironment() {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
}
