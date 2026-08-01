import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { projects } from './projects';

describe('project catalog', () => {
  it('keeps the live catalog empty while pages are archived offline', () => {
    expect(projects).toEqual([]);
  });

  it('renders the temporary empty state on the projects index', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/(site)/projects/page.tsx'), 'utf8');

    expect(source).toContain('No projects right now');
    expect(source).toContain('lacorte.dev');
    expect(source).not.toContain('RoomFit 3D');
    expect(source).not.toContain('Local Price Extractor');
  });

  it('documents the Local Price Extractor install flow in the archived page source', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/archive/projects/local-price-extractor/page.tsx'),
      'utf8',
    );

    expect(source).toContain('Experimental Prototype');
    expect(source).toContain('2 accepted');
    expect(source).toContain('0 rejected');
    expect(source).toContain('chrome://extensions');
    expect(source).toContain('installStepAnalyze');
    expect(source).toContain('On-device extraction for non-English pages is experimental');
    expect(source).toContain('https://github.com/lacorte/local-price-extractor');
    expect(source).toContain("'@type': 'SoftwareApplication'");
    expect(source).not.toContain('Open Live App');
  });

  it('preserves Kids Museum Planner archive copy without venue-specific names', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/archive/projects/kids-museum-planner/page.tsx'),
      'utf8',
    );

    expect(source).toContain('Kids Museum Planner');
    expect(source).not.toContain('Korea');
    expect(source).not.toContain('JobWorld');
  });

  it('preserves RoomFit archive copy without the private repository link', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/archive/projects/roomfit-3d/page.tsx'),
      'utf8',
    );

    expect(source).toContain('RoomFit 3D');
    expect(JSON.stringify(source)).not.toContain('github.com/restato/roomfit-3d');
  });
});
