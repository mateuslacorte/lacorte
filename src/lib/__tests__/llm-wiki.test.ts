import { describe, expect, it } from 'vitest';
import { llmWikiScenarios } from '@/data/llm-wiki/scenarios';
import { addCompiledSource, getCompilationStage } from '@/lib/llm-wiki';

describe('LLM Wiki scenario model', () => {
  it('provides complete, internally linked fixtures for all three audiences', () => {
    expect(Object.keys(llmWikiScenarios)).toEqual(['repository', 'research', 'company']);

    Object.values(llmWikiScenarios).forEach((scenario) => {
      expect(scenario.sources.length).toBeGreaterThanOrEqual(4);
      expect(scenario.wikiDocuments.length).toBeGreaterThanOrEqual(3);
      expect(scenario.questions.length).toBeGreaterThanOrEqual(2);
      expect(scenario.okf.files.some((file) => file.path === 'index.md')).toBe(true);
      expect(scenario.okf.files.some((file) => file.path === 'log.md')).toBe(true);

      const nodeIds = new Set(scenario.graph.nodes.map((node) => node.id));
      scenario.graph.edges.forEach((edge) => {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      });

      const documentIds = new Set(scenario.wikiDocuments.map((document) => document.id));
      scenario.questions.forEach((question) => {
        expect(question.evidence.length).toBeGreaterThan(0);
        question.evidence.forEach((id) => expect(documentIds.has(id)).toBe(true));
      });
    });
  });

  it('adds a compiled source once while preserving order', () => {
    expect(addCompiledSource([], 'route')).toEqual(['route']);
    expect(addCompiledSource(['route'], 'middleware')).toEqual(['route', 'middleware']);
    expect(addCompiledSource(['route'], 'route')).toEqual(['route']);
  });

  it('derives a stable compilation stage from progress', () => {
    expect(getCompilationStage(0, 5)).toBe('idle');
    expect(getCompilationStage(2, 5)).toBe('compiling');
    expect(getCompilationStage(5, 5)).toBe('ready');
    expect(getCompilationStage(9, 5)).toBe('ready');
  });
});
