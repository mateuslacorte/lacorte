'use client';

import { useEffect, useState } from 'react';
import type { Scenario } from '@/types/llm-wiki';
import { Icon } from './icons';

interface Props {
  scenario: Scenario;
}

type TerminalState = 'idle' | 'running' | 'complete';

export function OpenWikiTerminal({ scenario }: Props) {
  const [state, setState] = useState<TerminalState>('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const visibleDocumentCount = scenario.terminalLines
    .slice(0, visibleLines)
    .filter((line) => /(synthesized|linked|wrote|preserved|attached)/i.test(line))
    .slice(0, scenario.wikiDocuments.length)
    .length;
  const visibleDocuments = scenario.wikiDocuments.slice(0, visibleDocumentCount);
  const selectedDocument = scenario.wikiDocuments.find((document) => document.id === selectedDocumentId) ?? null;

  useEffect(() => {
    if (state !== 'running') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisibleLines(scenario.terminalLines.length);
      setState('complete');
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleLines((current) => {
        const next = current + 1;
        if (next >= scenario.terminalLines.length) {
          window.clearInterval(timer);
          setState('complete');
        }
        return next;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [scenario.terminalLines, state]);

  function run() {
    setVisibleLines(1);
    setSelectedDocumentId(null);
    setState('running');
  }

  function skip() {
    setVisibleLines(scenario.terminalLines.length);
    setState('complete');
  }

  return (
    <div className="llmw-terminal-shell">
      <div className="llmw-terminal-bar">
        <span className="llmw-window-controls" aria-hidden="true"><i /><i /><i /></span>
        <span><Icon name="terminal" /> openwiki — {scenario.id}</span>
        <span className="llmw-terminal-state">{state}</span>
      </div>

      <div className="llmw-terminal-body" aria-label="OpenWiki command simulation">
        {state === 'idle' ? (
          <div className="llmw-terminal-intro">
            <Icon name="play" />
            <p>Run a deterministic OpenWiki simulation. No repository or API key is used.</p>
          </div>
        ) : (
          <div className="llmw-terminal-workspace">
            <pre aria-live="off">{scenario.terminalLines.slice(0, visibleLines).map((line, index) => (
              <code key={`${scenario.id}-${index}`} data-command={line.startsWith('$')}>{line}</code>
            ))}</pre>
            <aside className="llmw-generated-tree" aria-label="Generated OpenWiki files">
              <span>openwiki/</span>
              {visibleDocuments.map((document) => (
                <button key={document.id} type="button" onClick={() => setSelectedDocumentId(document.id)} data-active={selectedDocument?.id === document.id}>
                  <Icon name="document" /> {document.path}
                </button>
              ))}
              {selectedDocument && <p>{selectedDocument.content}</p>}
            </aside>
          </div>
        )}
      </div>

      <div className="llmw-terminal-actions">
        {state === 'idle' && <button type="button" onClick={run}><Icon name="play" /> Run simulation</button>}
        {state === 'running' && <button type="button" onClick={skip}>Skip animation</button>}
        {state === 'complete' && <button type="button" onClick={run}><Icon name="play" /> Replay simulation</button>}
        <span>Guided simulation · precomputed output</span>
      </div>
    </div>
  );
}
