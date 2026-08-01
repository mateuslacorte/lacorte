'use client';

import type { CompilationStage, Scenario, WikiDocument } from '@/types/llm-wiki';
import { Icon } from './icons';

interface Props {
  scenario: Scenario;
  compiledSourceIds: string[];
  stage: CompilationStage;
  onAddSource: (sourceId: string) => void;
  onCompileAll: () => void;
  selectedDocument: WikiDocument;
  onSelectDocument: (documentId: string) => void;
}

export function SourceWorkbench({
  scenario,
  compiledSourceIds,
  stage,
  onAddSource,
  onCompileAll,
  selectedDocument,
  onSelectDocument,
}: Props) {
  const progress = `${compiledSourceIds.length} of ${scenario.sources.length} sources compiled`;

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (scenario.sources.some((source) => source.id === sourceId)) onAddSource(sourceId);
  }

  return (
    <div className="llmw-workbench" id="knowledge-workbench-panel" role="tabpanel">
      <section className="llmw-source-panel" aria-labelledby="source-panel-title">
        <div className="llmw-panel-heading">
          <div>
            <span className="llmw-kicker">Uncompiled sources</span>
            <h3 id="source-panel-title">Scattered context</h3>
          </div>
          <span className="llmw-count">{scenario.sources.length} files</span>
        </div>

        <div className="llmw-source-list">
          {scenario.sources.map((source) => {
            const compiled = compiledSourceIds.includes(source.id);
            return (
              <article key={source.id} className="llmw-source-card" data-compiled={compiled} draggable={!compiled} onDragStart={(event) => event.dataTransfer.setData('text/plain', source.id)}>
                <span className="llmw-file-icon"><Icon name={source.kind === 'code' ? 'code' : 'document'} /></span>
                <span className="llmw-file-copy">
                  <strong>{source.name}</strong>
                  <small>{source.path}</small>
                  <code>{source.excerpt}</code>
                </span>
                <button type="button" disabled={compiled} onClick={() => onAddSource(source.id)} aria-label={`${compiled ? 'Added' : 'Add'} ${source.name} to the wiki`}>
                  {compiled ? <Icon name="check" /> : <Icon name="arrow" />}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <div className="llmw-compiler-column">
        <div className="llmw-compiler-orb" data-stage={stage}>
          <Icon name="spark" />
          <span>Compile</span>
        </div>
        <span className="llmw-flow-line" aria-hidden="true" />
        <button type="button" className="llmw-compile-button" onClick={onCompileAll}>
          <Icon name="layers" />
          Compile all sample sources
        </button>
        <p role="status" aria-live="polite">{progress}</p>
      </div>

      <section className="llmw-wiki-panel" aria-labelledby="wiki-panel-title" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <div className="llmw-panel-heading">
          <div>
            <span className="llmw-kicker">Persistent artifact</span>
            <h3 id="wiki-panel-title">Living wiki</h3>
          </div>
          <span className="llmw-live-dot">{stage === 'ready' ? 'Ready' : 'Waiting'}</span>
        </div>

        {compiledSourceIds.length === 0 ? (
          <div className="llmw-empty-drop">
            <Icon name="archive" />
            <strong>Move knowledge here</strong>
            <span>Drag a sample file or use its arrow button.</span>
          </div>
        ) : stage !== 'ready' ? (
          <div className="llmw-empty-drop" data-state="indexing">
            <Icon name="layers" />
            <strong>{compiledSourceIds.length} {compiledSourceIds.length === 1 ? 'source' : 'sources'} indexed</strong>
            <span>Compile the remaining sources to synthesize accurate, linked wiki pages.</span>
          </div>
        ) : (
          <div className="llmw-wiki-browser">
            <nav aria-label="Generated wiki documents">
              {scenario.wikiDocuments.map((document) => (
                <button key={document.id} type="button" data-active={selectedDocument.id === document.id} onClick={() => onSelectDocument(document.id)}>
                  <Icon name="document" />
                  <span>{document.title}<small>{document.path}</small></span>
                </button>
              ))}
            </nav>
            <article className="llmw-document-preview">
              <div className="llmw-frontmatter">
                <span>type: {selectedDocument.type}</span>
                <span>tags: [{selectedDocument.tags.join(', ')}]</span>
              </div>
              <h4>{selectedDocument.title}</h4>
              <p>{selectedDocument.content}</p>
              <footer>{selectedDocument.freshness} · {selectedDocument.sourceIds.length} sources</footer>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
