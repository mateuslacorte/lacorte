export type ScenarioId = 'repository' | 'research' | 'company';
export type CompilationStage = 'idle' | 'compiling' | 'ready';
export type SourceKind = 'code' | 'document' | 'note' | 'data' | 'conversation';
export type NodeKind = 'source' | 'concept' | 'answer';

export interface SourceFile {
  id: string;
  name: string;
  path: string;
  kind: SourceKind;
  language: string;
  excerpt: string;
  insight: string;
}

export interface WikiDocument {
  id: string;
  title: string;
  path: string;
  type: string;
  description: string;
  tags: string[];
  content: string;
  sourceIds: string[];
  freshness: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  detail: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface GuidedQuestion {
  id: string;
  prompt: string;
  ragAnswer: string;
  wikiAnswer: string;
  evidence: string[];
  ragSteps: string[];
  wikiSteps: string[];
}

export interface OkfFile {
  path: string;
  title: string;
  summary: string;
  content: string;
}

export interface OkfBundle {
  name: string;
  version: string;
  files: OkfFile[];
}

export interface Scenario {
  id: ScenarioId;
  eyebrow: string;
  title: string;
  shortTitle: string;
  audience: string;
  problem: string;
  outcome: string;
  question: string;
  accent: string;
  sources: SourceFile[];
  wikiDocuments: WikiDocument[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  questions: GuidedQuestion[];
  terminalLines: string[];
  okf: OkfBundle;
  adoption: {
    title: string;
    steps: string[];
    payoff: string;
  };
}

