'use client';

import { KnowledgeGraph } from './KnowledgeGraph';
import { OkfExplorer } from './OkfExplorer';
import { OpenWikiTerminal } from './OpenWikiTerminal';
import { PresentationControls } from './PresentationControls';
import { RagComparison } from './RagComparison';
import { ScenarioSwitcher } from './ScenarioSwitcher';
import { SourceWorkbench } from './SourceWorkbench';
import { Icon } from './icons';
import { useLlmWikiExperience } from './useLlmWikiExperience';

export function LlmWikiExperience() {
  const experience = useLlmWikiExperience();
  const { scenario } = experience;

  return (
    <div className="llmw-experience" style={{ '--scenario-accent': scenario.accent } as React.CSSProperties}>
      <PresentationControls onReset={experience.reset} />

      <section className="llmw-section llmw-lab-section" id="lab">
        <div className="llmw-section-heading">
          <span className="llmw-index">02 / The lab</span>
          <div>
            <p className="llmw-kicker">Direct manipulation, not another explainer</p>
            <h2>The knowledge workbench</h2>
            <p>Choose a world. Move its scattered context into a persistent artifact. Then inspect what changed.</p>
          </div>
        </div>

        <ScenarioSwitcher currentId={experience.scenarioId} onChange={experience.switchScenario} />

        <div className="llmw-mission-brief" key={scenario.id}>
          <div><span>{scenario.eyebrow}</span><h3>{scenario.title}</h3></div>
          <p>{scenario.problem}</p>
          <div className="llmw-mission-question"><span>The expensive question</span><strong>“{scenario.question}”</strong></div>
        </div>

        <div role="status" aria-label="Compilation status" className="llmw-compilation-status" data-ready={experience.stage === 'ready'}>
          <span aria-hidden="true" />
          {experience.stage === 'ready' ? 'Wiki ready · knowledge now persists' : experience.stage === 'compiling' ? 'Compiling relationships…' : 'Waiting for sources'}
        </div>

        <SourceWorkbench
          scenario={scenario}
          compiledSourceIds={experience.compiledSourceIds}
          stage={experience.stage}
          onAddSource={experience.addSource}
          onCompileAll={experience.compileAll}
          selectedDocument={experience.selectedDocument}
          onSelectDocument={experience.selectDocument}
        />
      </section>

      <section className="llmw-section llmw-graph-section" id="graph">
        <div className="llmw-section-heading">
          <span className="llmw-index">03 / Relationships</span>
          <div><p className="llmw-kicker">A folder becomes a model</p><h2>Knowledge is more than files.</h2><p>Each edge makes a claim visible: what implements, governs, qualifies, or supports the answer.</p></div>
        </div>
        <KnowledgeGraph key={`${scenario.id}-${experience.resetEpoch}`} graph={scenario.graph} selectedNodeId={experience.selectedNodeId} onSelectNode={experience.selectNode} />
      </section>

      <section className="llmw-section llmw-compare-section" id="compare">
        <div className="llmw-section-heading">
          <span className="llmw-index">04 / The difference</span>
          <div><p className="llmw-kicker">Retrieval versus accumulation</p><h2>Ask once. Keep the work.</h2><p>RAG retrieves fragments for this answer. An LLM Wiki leaves behind a maintained artifact for the next answer.</p></div>
        </div>
        <RagComparison scenario={scenario} selectedQuestionId={experience.selectedQuestionId} onSelectQuestion={experience.selectQuestion} />
      </section>

      <section className="llmw-section llmw-openwiki-section" id="openwiki">
        <div className="llmw-section-heading">
          <span className="llmw-index">05 / Operationalize it</span>
          <div><p className="llmw-kicker">From pattern to workflow</p><h2>OpenWiki does the maintenance work.</h2><p>It scans a repository or configured sources, synthesizes local wiki pages, connects coding agents, and records what changed.</p></div>
        </div>
        <div className="llmw-openwiki-grid">
          <OpenWikiTerminal key={`${scenario.id}-${experience.resetEpoch}`} scenario={scenario} />
          <aside className="llmw-openwiki-notes">
            <span className="llmw-kicker">What became operational</span>
            <ol>
              <li><span>01</span><div><strong>Scan</strong><p>Choose relevant sources instead of dumping every token into context.</p></div></li>
              <li><span>02</span><div><strong>Synthesize</strong><p>Write architecture, concept, guide, and question pages.</p></div></li>
              <li><span>03</span><div><strong>Maintain</strong><p>Update changed knowledge and leave a readable log.</p></div></li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="llmw-section llmw-okf-section" id="okf">
        <div className="llmw-section-heading">
          <span className="llmw-index">06 / Make it portable</span>
          <div><p className="llmw-kicker">Format, not platform</p><h2>OKF gives knowledge a shared shape.</h2><p>Markdown stays readable. YAML makes concepts queryable. Reserved index and log files make the bundle navigable and auditable.</p></div>
        </div>
        <OkfExplorer key={`${scenario.id}-${experience.resetEpoch}`} scenario={scenario} />
      </section>

      <section className="llmw-section llmw-recap-section" aria-labelledby="recap-title">
        <div className="llmw-section-heading">
          <span className="llmw-index">07 / The whole system</span>
          <div><p className="llmw-kicker">Three layers, one durable loop</p><h2 id="recap-title">Remember this relationship.</h2></div>
        </div>
        <div className="llmw-recap-grid">
          <article><span>01</span><Icon name="spark" /><h3>Idea</h3><strong>LLM Wiki</strong><p>Compile source material into a living, interlinked knowledge artifact.</p></article>
          <Icon name="arrow" className="llmw-recap-arrow" />
          <article><span>02</span><Icon name="terminal" /><h3>Tool</h3><strong>OpenWiki</strong><p>Generate, connect, and maintain agent-oriented wiki pages.</p></article>
          <Icon name="arrow" className="llmw-recap-arrow" />
          <article><span>03</span><Icon name="archive" /><h3>Format</h3><strong>OKF</strong><p>Exchange the resulting knowledge as portable Markdown and metadata.</p></article>
        </div>
      </section>

      <section className="llmw-section llmw-start-section" id="start">
        <div className="llmw-adoption-card">
          <div>
            <span className="llmw-kicker">Your next working session</span>
            <h2>{scenario.adoption.title}</h2>
            <p>{scenario.adoption.payoff}</p>
          </div>
          <ol>{scenario.adoption.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
          <div className="llmw-adoption-actions">
            <a href="https://github.com/langchain-ai/openwiki" target="_blank" rel="noreferrer">Explore OpenWiki <Icon name="arrow" /></a>
            <a href="https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md" target="_blank" rel="noreferrer">Read the OKF spec</a>
          </div>
        </div>
      </section>
    </div>
  );
}
