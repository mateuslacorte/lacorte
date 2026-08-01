'use client';

import type { Scenario } from '@/types/llm-wiki';
import { Icon } from './icons';

interface Props {
  scenario: Scenario;
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
}

export function RagComparison({ scenario, selectedQuestionId, onSelectQuestion }: Props) {
  const question = scenario.questions.find((item) => item.id === selectedQuestionId) ?? null;
  const evidence = question
    ? question.evidence.map((id) => scenario.wikiDocuments.find((document) => document.id === id)).filter(Boolean)
    : [];

  return (
    <div className="llmw-comparison">
      <div className="llmw-question-picker" aria-label="Choose a question to replay">
        {scenario.questions.map((item) => (
          <button key={item.id} type="button" data-active={item.id === question?.id} onClick={() => onSelectQuestion(item.id)}>
            <span>Ask</span>
            {item.prompt}
            <Icon name="arrow" />
          </button>
        ))}
      </div>

      {!question ? (
        <div className="llmw-comparison-empty">
          <Icon name="spark" />
          <p>Choose a question. Watch two knowledge systems take different paths to an answer.</p>
        </div>
      ) : (
        <div className="llmw-answer-grid">
          <article className="llmw-answer-card" data-mode="rag">
            <header><span>RAG · answer again</span><strong>Ephemeral retrieval</strong></header>
            <ol>{question.ragSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
            <blockquote>{question.ragAnswer}</blockquote>
            <footer>Useful now. Nothing new is preserved.</footer>
          </article>

          <article className="llmw-answer-card" data-mode="wiki">
            <header><span>LLM Wiki · build once</span><strong>Compiled knowledge</strong></header>
            <ol>{question.wikiSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
            <blockquote>{question.wikiAnswer}</blockquote>
            <footer>
              <span>Evidence used</span>
              {evidence.map((document) => <span className="llmw-evidence-tag" key={document!.id}>{document!.title}</span>)}
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
