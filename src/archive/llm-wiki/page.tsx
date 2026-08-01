/** Archived — not routed. Page sources live here for design reference; UI in src/components/llm-wiki/. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LlmWikiExperience } from '@/components/llm-wiki/LlmWikiExperience';
import { absoluteUrl } from '@/lib/site';

const title = 'LLM Wiki, OpenWiki & OKF — The Interactive Field Guide';
const description = 'Understand LLM Wiki, LangChain OpenWiki, and the Open Knowledge Format by compiling three realistic knowledge systems yourself.';

const faqItems = [
  {
    question: 'Is LLM Wiki a product?',
    answer: 'No. LLM Wiki is a pattern proposed by Andrej Karpathy: an LLM compiles sources into a persistent, interlinked wiki that can improve as it is used.',
  },
  {
    question: 'How is an LLM Wiki different from RAG?',
    answer: 'RAG usually retrieves source fragments again for each question. An LLM Wiki leaves behind maintained synthesis pages, links, questions, and logs so useful reasoning becomes reusable knowledge.',
  },
  {
    question: 'What does OpenWiki do?',
    answer: 'OpenWiki is LangChain\'s open-source CLI for writing and maintaining local agent wikis from codebases or configured personal knowledge sources.',
  },
  {
    question: 'What is OKF?',
    answer: 'The Open Knowledge Format is a vendor-neutral specification for portable knowledge bundles made of Markdown files, YAML frontmatter, and simple index and log conventions.',
  },
  {
    question: 'Does this page upload my files or call an LLM?',
    answer: 'No. This is a deterministic guided simulation using precomputed sample sources and outputs. Nothing is uploaded and no model API is called.',
  },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl('/llm-wiki') },
};

export default function LlmWikiPage() {
  return (
    <main className="llmw-page" id="llm-wiki-top">
      <header className="llmw-topbar">
        <Link href="/" className="llmw-brand" aria-label="lacorte.dev home">
          <span aria-hidden="true">L</span>
          <span>LACORTE.DEV <small>FIELD GUIDE / 001</small></span>
        </Link>
        <div className="llmw-topbar-meta">
          <span><i /> Source-verified</span>
          <span>July 2026</span>
          <a href="#sources">Sources</a>
        </div>
      </header>

      <section className="llmw-hero" aria-labelledby="hero-title">
        <div className="llmw-hero-grid" aria-hidden="true" />
        <div className="llmw-hero-copy">
          <p className="llmw-kicker"><span>Interactive field guide</span> Agent-native knowledge</p>
          <h1 id="hero-title">
            Your AI shouldn&apos;t
            <em>rediscover</em>
            what you already know.
          </h1>
          <p className="llmw-hero-lede">
            Files can be retrieved. Knowledge should accumulate. Build a living wiki, watch OpenWiki maintain it, then move it anywhere with OKF.
          </p>
          <div className="llmw-hero-actions">
            <a href="#lab" className="llmw-primary-link">Enter the knowledge lab <span aria-hidden="true">↘</span></a>
            <a href="#mental-model" className="llmw-text-link">Start with the 90-second model</a>
          </div>
        </div>
      </section>

      <section className="llmw-mental-model" id="mental-model" aria-labelledby="mental-title">
        <div className="llmw-section-heading">
          <span className="llmw-index">01 / The shift</span>
          <div>
            <p className="llmw-kicker">From retrieval to accumulation</p>
            <h2 id="mental-title">The answer is not the asset.<br />The wiki is.</h2>
          </div>
        </div>
      </section>

      <div id="lab">
        <LlmWikiExperience />
      </div>

      <section className="llmw-static-section llmw-faq" aria-labelledby="faq-title">
        <div className="llmw-section-heading">
          <span className="llmw-index">09 / Questions</span>
          <div><p className="llmw-kicker">Before you try it</p><h2 id="faq-title">Clear answers, no mystique.</h2></div>
        </div>
        <div className="llmw-faq-list">
          {faqItems.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary><span>0{index + 1}</span>{item.question}<i aria-hidden="true">+</i></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="llmw-static-section llmw-sources" id="sources" aria-labelledby="sources-title">
        <div className="llmw-section-heading">
          <span className="llmw-index">10 / Primary sources</span>
          <div><p className="llmw-kicker">Read the originals</p><h2 id="sources-title">Source-verified, not trend-summarized.</h2></div>
        </div>
        <div className="llmw-source-links">
          <a href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f" target="_blank" rel="noreferrer"><span>01 · Idea</span><strong>Andrej Karpathy — LLM Wiki</strong></a>
          <a href="https://github.com/langchain-ai/openwiki" target="_blank" rel="noreferrer"><span>02 · Tool</span><strong>LangChain — OpenWiki</strong></a>
        </div>
      </section>

      <footer className="llmw-footer">
        <div><span className="llmw-footer-mark">LW</span><p><strong>Make knowledge compound.</strong><br />An interactive field guide by lacorte.dev.</p></div>
        <a href="#llm-wiki-top">Back to the beginning ↑</a>
      </footer>
    </main>
  );
}
