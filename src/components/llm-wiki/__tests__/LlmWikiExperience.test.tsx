import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LlmWikiExperience } from '../LlmWikiExperience';

describe('LlmWikiExperience', () => {
  beforeEach(() => window.localStorage.clear());

  it('completes the repository learning journey and exposes the core relationship', () => {
    render(<LlmWikiExperience />);

    expect(screen.getByRole('heading', { name: /the knowledge workbench/i })).toBeVisible();
    expect(screen.getByRole('progressbar', { name: /learning journey progress/i })).toHaveAttribute('aria-valuenow', '20');
    fireEvent.click(screen.getByRole('button', { name: /compile all sample sources/i }));
    expect(screen.getByRole('status', { name: /compilation status/i })).toHaveTextContent('Wiki ready');

    expect(screen.getByRole('heading', { name: /idea/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /tool/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /format/i })).toBeVisible();
    expect(screen.getByText(/give every contributor the map/i)).toBeVisible();
  });

  it('switches audience journeys and resets the simulation', () => {
    render(<LlmWikiExperience />);

    fireEvent.click(screen.getByRole('tab', { name: /personal research notes/i }));
    expect(screen.getByText(/turn reading into accumulated understanding/i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /compile all sample sources/i }));
    fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip animation/i }));
    fireEvent.click(screen.getByRole('tab', { name: /raw yaml/i }));
    fireEvent.click(screen.getByRole('button', { name: /send bundle to research agent/i }));
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(screen.getByLabelText(/interactive knowledge graph/i)).toHaveAttribute('data-zoom', '1.15');
    fireEvent.click(screen.getByRole('button', { name: /reset lab/i }));

    expect(screen.getByRole('tab', { name: /open-source repository/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status', { name: /compilation status/i })).toHaveTextContent('Waiting for sources');
    expect(screen.getByRole('button', { name: /run simulation/i })).toBeVisible();
    expect(screen.getByRole('tab', { name: /plain language/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status', { name: /portability status/i })).toHaveTextContent(/code agent.*can read the same bundle/i);
    expect(screen.getByLabelText(/interactive knowledge graph/i)).toHaveAttribute('data-zoom', '1.00');
  });
});
