import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const pagePath = join(process.cwd(), 'src/archive/projects/roomfit-3d/page.tsx');
const headerPath = join(process.cwd(), 'src/components/Header.tsx');

describe('RoomFit project detail page', () => {
  it('contains the approved public product contract', () => {
    expect(existsSync(pagePath)).toBe(true);
    const source = readFileSync(pagePath, 'utf8');

    expect(source).toContain('https://roomfit-3d.vercel.app');
    expect(source).toContain('Open Live App');

    for (const feature of [
      'Accurate Measurements',
      'Magnetic Placement',
      'Fit Checks',
      'Local-First Storage',
    ]) {
      expect(source).toContain(feature);
    }

    for (const technology of [
      'React',
      'TypeScript',
      'Three.js',
      'React Three Fiber',
      'Zustand',
      'Vite',
      'Vitest',
      'Playwright',
    ]) {
      expect(source).toContain(technology);
    }

    expect(source).toContain('SoftwareApplication');
    expect(source).toContain('ProjectBreadcrumb');
    expect(source).toContain("priceCurrency: 'USD'");
    expect(source).not.toContain('github.com/restato/roomfit-3d');
    expect(source).not.toContain('View on GitHub');
  });

  it('uses the shared English header without a language switcher', () => {
    const source = readFileSync(headerPath, 'utf8');

    expect(source).toContain('SITE_NAME');
    expect(source).toContain('defaultLang');
    expect(source).not.toContain('languages.ko');
  });
});
