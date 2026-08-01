import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLlmWikiExperience } from '../useLlmWikiExperience';

function HookHarness() {
  const experience = useLlmWikiExperience();

  return (
    <div>
      <output data-testid="scenario">{experience.scenarioId}</output>
      <output data-testid="stage">{experience.stage}</output>
      <output data-testid="compiled">{experience.compiledSourceIds.join(',')}</output>
      <output data-testid="question">{experience.selectedQuestionId ?? 'none'}</output>
      <button onClick={() => experience.switchScenario('research')}>Switch to research</button>
      <button onClick={() => experience.addSource(experience.scenario.sources[0].id)}>Add first source</button>
      <button onClick={experience.compileAll}>Compile all</button>
      <button onClick={() => experience.selectQuestion(experience.scenario.questions[0].id)}>Ask first question</button>
      <button onClick={experience.reset}>Reset experience</button>
    </div>
  );
}

describe('useLlmWikiExperience', () => {
  beforeEach(() => window.localStorage.clear());

  it('moves through scenario, compilation, and question states', () => {
    render(<HookHarness />);

    expect(screen.getByTestId('scenario')).toHaveTextContent('repository');
    expect(screen.getByTestId('stage')).toHaveTextContent('idle');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to research' }));
    expect(screen.getByTestId('scenario')).toHaveTextContent('research');

    fireEvent.click(screen.getByRole('button', { name: 'Add first source' }));
    expect(screen.getByTestId('stage')).toHaveTextContent('compiling');

    fireEvent.click(screen.getByRole('button', { name: 'Compile all' }));
    expect(screen.getByTestId('stage')).toHaveTextContent('ready');

    fireEvent.click(screen.getByRole('button', { name: 'Ask first question' }));
    expect(screen.getByTestId('question')).toHaveTextContent('papers-disagree');
  });

  it('resets transient state while retaining a safe default scenario', () => {
    render(<HookHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Compile all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask first question' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset experience' }));

    expect(screen.getByTestId('scenario')).toHaveTextContent('repository');
    expect(screen.getByTestId('stage')).toHaveTextContent('idle');
    expect(screen.getByTestId('compiled')).toBeEmptyDOMElement();
    expect(screen.getByTestId('question')).toHaveTextContent('none');
  });

  it('restores a saved scenario after hydration without changing the server markup', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<HookHarness />);
    document.body.appendChild(container);
    window.localStorage.setItem('lacorte-llm-wiki-v1', JSON.stringify({
      scenarioId: 'research',
      completedScenarios: ['repository'],
    }));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = hydrateRoot(container, <HookHarness />);

    await waitFor(() => expect(container.querySelector('[data-testid="scenario"]')).toHaveTextContent('research'));
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/hydration|did not match/i);

    root.unmount();
    consoleError.mockRestore();
    container.remove();
  });
});
