import type { CompilationStage } from '@/types/llm-wiki';

export function addCompiledSource(current: string[], sourceId: string): string[] {
  return current.includes(sourceId) ? current : [...current, sourceId];
}

export function getCompilationStage(count: number, total: number): CompilationStage {
  if (count === 0 || total <= 0) return 'idle';
  if (count < total) return 'compiling';
  return 'ready';
}

