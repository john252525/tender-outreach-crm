import { useEffect, useReducer } from 'react';

export type PipelineStep = 'idle' | 'docs' | 'ai' | 'search' | 'emails' | 'done' | 'error';

export interface PipelineEntry {
  step: PipelineStep;
  emailCount: number;
  result: { emails: string[]; subject: string; body: string } | null;
  running: boolean;
}

const DEFAULT: PipelineEntry = { step: 'idle', emailCount: 0, result: null, running: false };

// Module-level store — survives client-side navigation
const _store = new Map<string, PipelineEntry>();
const _listeners = new Set<() => void>();

export function getPipeline(id: string): PipelineEntry {
  return _store.get(id) ?? { ...DEFAULT };
}

export function setPipeline(id: string, patch: Partial<PipelineEntry>) {
  _store.set(id, { ...getPipeline(id), ...patch });
  _listeners.forEach((fn) => fn());
}

export function usePipeline(id: string): PipelineEntry {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    _listeners.add(tick);
    return () => {
      _listeners.delete(tick);
    };
  }, []);
  return getPipeline(id);
}
