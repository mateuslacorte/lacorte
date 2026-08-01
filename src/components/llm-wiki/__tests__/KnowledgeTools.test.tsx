import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { llmWikiScenarios } from '@/data/llm-wiki/scenarios';
import { OkfExplorer } from '../OkfExplorer';
import { OpenWikiTerminal } from '../OpenWikiTerminal';
import { RagComparison } from '../RagComparison';
import { PresentationControls } from '../PresentationControls';

function ComparisonHarness() {
  const scenario = llmWikiScenarios.repository;
  const [questionId, setQuestionId] = useState<string | null>(null);
  return <RagComparison scenario={scenario} selectedQuestionId={questionId} onSelectQuestion={setQuestionId} />;
}

describe('guided knowledge tools', () => {
  it('compares disposable retrieval with a maintained answer and evidence', () => {
    render(<ComparisonHarness />);

    fireEvent.click(screen.getByRole('button', { name: /where is authentication handled/i }));
    expect(screen.getByText(/evidence used/i)).toBeVisible();
    expect(screen.getByText(/authentication starts at POST \/session/i)).toBeVisible();
    expect(screen.getByText(/compose a fresh answer/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: /authentication architecture/i })).not.toBeInTheDocument();
  });

  it('can complete and replay the OpenWiki terminal sequence', () => {
    render(<OpenWikiTerminal scenario={llmWikiScenarios.repository} />);

    fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
    expect(screen.queryByRole('button', { name: /openwiki\/architecture\/authentication\.md/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip animation/i }));
    expect(screen.getByText(/wiki ready in openwiki\//i)).toBeVisible();
    expect(screen.getByRole('button', { name: /replay simulation/i })).toBeVisible();
    const generatedFile = screen.getByRole('button', { name: /openwiki\/architecture\/authentication\.md/i });
    fireEvent.click(generatedFile);
    expect(screen.getByText(/POST \/session validates credentials/i)).toBeVisible();
  });

  it('switches between plain language and raw OKF while changing consumers', () => {
    render(<OkfExplorer scenario={llmWikiScenarios.repository} />);

    fireEvent.click(screen.getByRole('tab', { name: /raw yaml/i }));
    expect(screen.getByText(/type: architecture/i)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /send bundle to research agent/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/research agent can read the same bundle/i);
  });

  it('tracks the browser fullscreen state, including Escape', async () => {
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn(async () => {
        fullscreenElement = document.documentElement;
        document.dispatchEvent(new Event('fullscreenchange'));
      }),
    });

    render(<PresentationControls onReset={vi.fn()} />);
    const present = screen.getByRole('button', { name: /present/i });
    fireEvent.click(present);
    await screen.findByRole('button', { name: /present/i, pressed: true });

    await act(async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    await waitFor(() => expect(present).toHaveAttribute('aria-pressed', 'false'));
  });
});
