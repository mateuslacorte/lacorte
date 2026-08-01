import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { llmWikiScenarios } from '@/data/llm-wiki/scenarios';
import { KnowledgeGraph } from '../KnowledgeGraph';
import { ScenarioSwitcher } from '../ScenarioSwitcher';
import { SourceWorkbench } from '../SourceWorkbench';

describe('Knowledge Workbench', () => {
  it('offers accessible scenario tabs', () => {
    const onChange = vi.fn();
    render(<ScenarioSwitcher currentId="repository" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: /open-source repository/i })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /personal research notes/i }));
    expect(onChange).toHaveBeenCalledWith('research');

    const repositoryTab = screen.getByRole('tab', { name: /open-source repository/i });
    repositoryTab.focus();
    fireEvent.keyDown(repositoryTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('research');
    expect(screen.getByRole('tab', { name: /personal research notes/i })).toHaveFocus();
  });

  it('compiles sources with buttons and announces progress', () => {
    const scenario = llmWikiScenarios.repository;
    const addSource = vi.fn();
    const compileAll = vi.fn();

    render(
      <SourceWorkbench
        scenario={scenario}
        compiledSourceIds={[]}
        stage="idle"
        onAddSource={addSource}
        onCompileAll={compileAll}
        selectedDocument={scenario.wikiDocuments[0]}
        onSelectDocument={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add auth\.ts to the wiki/i }));
    expect(addSource).toHaveBeenCalledWith('auth-route');
    expect(screen.getByRole('status')).toHaveTextContent('0 of 5 sources compiled');

    fireEvent.click(screen.getByRole('button', { name: /compile all sample sources/i }));
    expect(compileAll).toHaveBeenCalled();
  });

  it('does not claim finished synthesis while only one source is compiled', () => {
    const scenario = llmWikiScenarios.repository;
    render(
      <SourceWorkbench
        scenario={scenario}
        compiledSourceIds={[scenario.sources[0].id]}
        stage="compiling"
        onAddSource={vi.fn()}
        onCompileAll={vi.fn()}
        selectedDocument={scenario.wikiDocuments[0]}
        onSelectDocument={vi.fn()}
      />,
    );

    expect(screen.getByText(/1 source indexed/i)).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /generated wiki documents/i })).not.toBeInTheDocument();
  });

  it('provides selectable graph nodes and a semantic relationship list', () => {
    const onSelect = vi.fn();
    render(<KnowledgeGraph graph={llmWikiScenarios.repository.graph} selectedNodeId={null} onSelectNode={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /authentication: the compiled request-to-session model/i }));
    expect(onSelect).toHaveBeenCalledWith('concept-auth');
    expect(screen.getByRole('list', { name: /knowledge relationships/i })).toHaveTextContent('Routes + middleware implements Authentication');

    const canvas = screen.getByLabelText(/interactive knowledge graph/i);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(canvas).toHaveAttribute('data-zoom', '1.15');
    fireEvent.click(screen.getByRole('button', { name: /reset graph view/i }));
    expect(canvas).toHaveAttribute('data-zoom', '1.00');
  });
});
