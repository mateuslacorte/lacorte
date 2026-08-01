'use client';

import { useMemo, useState } from 'react';
import type { Scenario } from '@/types/llm-wiki';
import { Icon } from './icons';

interface Props {
  scenario: Scenario;
}

type ViewMode = 'plain' | 'raw';
type Consumer = 'code agent' | 'research agent' | 'analytics agent';

export function OkfExplorer({ scenario }: Props) {
  const [view, setView] = useState<ViewMode>('plain');
  const [selectedPath, setSelectedPath] = useState(scenario.okf.files[0].path);
  const [consumer, setConsumer] = useState<Consumer>('code agent');
  const selectedFile = scenario.okf.files.find((file) => file.path === selectedPath) ?? scenario.okf.files[0];
  const rawFile = useMemo(
    () => scenario.okf.files.find((file) => !['index.md', 'log.md'].includes(file.path)) ?? selectedFile,
    [scenario.okf.files, selectedFile],
  );
  const displayedFile = view === 'raw' ? rawFile : selectedFile;

  return (
    <div className="llmw-okf-explorer">
      <div className="llmw-okf-bundle">
        <div className="llmw-bundle-label">
          <Icon name="archive" />
          <span><strong>{scenario.okf.name}</strong><small>OKF v{scenario.okf.version} · portable bundle</small></span>
        </div>
        <div className="llmw-portability-track" aria-label="Choose a knowledge consumer">
          {(['code agent', 'research agent', 'analytics agent'] as Consumer[]).map((name) => (
            <button key={name} type="button" data-active={consumer === name} onClick={() => setConsumer(name)} aria-label={`Send bundle to ${name}`}>
              <Icon name={name === 'code agent' ? 'code' : name === 'research agent' ? 'research' : 'building'} />
              {name}
            </button>
          ))}
        </div>
        <p role="status" aria-label="Portability status"><strong>{consumer}</strong> can read the same bundle—without a proprietary SDK.</p>
      </div>

      <div className="llmw-okf-browser">
        <aside>
          <span className="llmw-kicker">Bundle files</span>
          {scenario.okf.files.map((file) => (
            <button key={file.path} type="button" data-active={file.path === displayedFile.path} onClick={() => { setSelectedPath(file.path); setView('plain'); }}>
              <Icon name="document" />
              {file.path}
            </button>
          ))}
        </aside>
        <article>
          <div className="llmw-view-tabs" role="tablist" aria-label="OKF document view">
            <button type="button" role="tab" aria-selected={view === 'plain'} onClick={() => setView('plain')}>Plain language</button>
            <button type="button" role="tab" aria-selected={view === 'raw'} onClick={() => setView('raw')}>Raw YAML</button>
          </div>
          {view === 'plain' ? (
            <div className="llmw-okf-plain"><span>What this file does</span><h3>{displayedFile.title}</h3><p>{displayedFile.summary}</p></div>
          ) : (
            <pre><code>{displayedFile.content}</code></pre>
          )}
        </article>
      </div>
    </div>
  );
}
