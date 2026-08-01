'use client';

import { useRef } from 'react';
import { scenarioOrder, llmWikiScenarios } from '@/data/llm-wiki/scenarios';
import type { ScenarioId } from '@/types/llm-wiki';
import { Icon, type IconName } from './icons';

interface Props {
  currentId: ScenarioId;
  onChange: (id: ScenarioId) => void;
}

const icons: Record<ScenarioId, IconName> = {
  repository: 'code',
  research: 'research',
  company: 'building',
};

export function ScenarioSwitcher({ currentId, onChange }: Props) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(index: number, key: string) {
    const last = scenarioOrder.length - 1;
    const nextIndex = key === 'Home'
      ? 0
      : key === 'End'
        ? last
        : key === 'ArrowRight' || key === 'ArrowDown'
          ? (index + 1) % scenarioOrder.length
          : key === 'ArrowLeft' || key === 'ArrowUp'
            ? (index - 1 + scenarioOrder.length) % scenarioOrder.length
            : null;
    if (nextIndex === null) return;
    onChange(scenarioOrder[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="llmw-scenario-switcher" role="tablist" aria-label="Choose a knowledge scenario">
      {scenarioOrder.map((id, index) => {
        const scenario = llmWikiScenarios[id];
        const selected = id === currentId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="knowledge-workbench-panel"
            tabIndex={selected ? 0 : -1}
            className="llmw-scenario-tab"
            data-active={selected}
            onClick={() => onChange(id)}
            onKeyDown={(event) => {
              if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                moveFocus(index, event.key);
              }
            }}
            ref={(node) => { tabRefs.current[index] = node; }}
          >
            <span className="llmw-scenario-number">0{index + 1}</span>
            <Icon name={icons[id]} className="llmw-icon" />
            <span>
              <strong>{scenario.shortTitle}</strong>
              <small>{scenario.audience}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
