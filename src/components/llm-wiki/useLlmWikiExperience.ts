import { useEffect, useMemo, useState } from 'react';
import { llmWikiScenarios } from '@/data/llm-wiki/scenarios';
import { addCompiledSource, getCompilationStage } from '@/lib/llm-wiki';
import type { ScenarioId } from '@/types/llm-wiki';

const STORAGE_KEY = 'lacorte-llm-wiki-v1';

interface PersistedState {
  scenarioId: ScenarioId;
  completedScenarios: ScenarioId[];
}

const defaultPersistedState: PersistedState = {
  scenarioId: 'repository',
  completedScenarios: [],
};

function readPersistedState(): PersistedState {
  if (typeof window === 'undefined') return defaultPersistedState;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return defaultPersistedState;
    const parsed = JSON.parse(value) as Partial<PersistedState>;
    const scenarioId = parsed.scenarioId && parsed.scenarioId in llmWikiScenarios
      ? parsed.scenarioId
      : 'repository';
    return {
      scenarioId,
      completedScenarios: (parsed.completedScenarios ?? []).filter((id): id is ScenarioId => id in llmWikiScenarios),
    };
  } catch {
    return defaultPersistedState;
  }
}

export function useLlmWikiExperience() {
  const [persisted, setPersisted] = useState<PersistedState>(defaultPersistedState);
  const [persistenceRestored, setPersistenceRestored] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  const [compiledSourceIds, setCompiledSourceIds] = useState<string[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const scenario = llmWikiScenarios[persisted.scenarioId];
  const stage = getCompilationStage(compiledSourceIds.length, scenario.sources.length);

  useEffect(() => {
    setPersisted(readPersistedState());
    setPersistenceRestored(true);
  }, []);

  useEffect(() => {
    if (!persistenceRestored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Persistence is a progressive enhancement; the simulation still works in memory.
    }
  }, [persisted, persistenceRestored]);

  const selectedQuestion = useMemo(
    () => scenario.questions.find((question) => question.id === selectedQuestionId) ?? null,
    [scenario, selectedQuestionId],
  );

  const selectedDocument = useMemo(
    () => scenario.wikiDocuments.find((document) => document.id === selectedDocumentId) ?? scenario.wikiDocuments[0],
    [scenario, selectedDocumentId],
  );

  function clearTransientState() {
    setCompiledSourceIds([]);
    setSelectedQuestionId(null);
    setSelectedDocumentId(null);
    setSelectedNodeId(null);
  }

  function switchScenario(scenarioId: ScenarioId) {
    clearTransientState();
    setResetEpoch((current) => current + 1);
    setPersisted((current) => ({ ...current, scenarioId }));
  }

  function addSource(sourceId: string) {
    setCompiledSourceIds((current) => addCompiledSource(current, sourceId));
  }

  function compileAll() {
    setCompiledSourceIds(scenario.sources.map((source) => source.id));
    setSelectedDocumentId(scenario.wikiDocuments[0].id);
    setPersisted((current) => ({
      ...current,
      completedScenarios: current.completedScenarios.includes(current.scenarioId)
        ? current.completedScenarios
        : [...current.completedScenarios, current.scenarioId],
    }));
  }

  function reset() {
    clearTransientState();
    setResetEpoch((current) => current + 1);
    setPersisted(defaultPersistedState);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }

  return {
    scenarioId: persisted.scenarioId,
    scenario,
    completedScenarios: persisted.completedScenarios,
    compiledSourceIds,
    stage,
    selectedQuestionId,
    selectedQuestion,
    selectedDocument,
    selectedNodeId,
    resetEpoch,
    switchScenario,
    addSource,
    compileAll,
    selectQuestion: setSelectedQuestionId,
    selectDocument: setSelectedDocumentId,
    selectNode: setSelectedNodeId,
    reset,
  };
}
