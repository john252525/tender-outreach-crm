'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { ProzorroTender, ProzorroTenderDoc, ProzorroAiResult, ProzorroWebResult } from '@/types';
import { Wand2, Loader2, Check, X } from 'lucide-react';

interface Props {
  tenderId: string;       // internal UUID (tender.id)
  prozorroId: string;     // external prozorro ID for fetching details
  onComplete?: () => void;
}

type StepStatus = 'idle' | 'docs' | 'ai' | 'search' | 'emails' | 'done' | 'error';

const STEP_LABELS: Record<StepStatus, string> = {
  idle: '',
  docs: 'Документы...',
  ai: 'AI-аналіз...',
  search: 'Пошук...',
  emails: 'Email...',
  done: 'Готово!',
  error: 'Помилка',
};

export default function ProzorroMagicButton({ tenderId, prozorroId, onComplete }: Props) {
  const [step, setStep] = useState<StepStatus>('idle');
  const [emailCount, setEmailCount] = useState(0);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setEmailCount(0);

    try {
      // Step 1: Fetch tender details to get docs
      setStep('docs');
      let tender: ProzorroTender;
      try {
        tender = await api.get<ProzorroTender>(`/prozorro/tender/${prozorroId}`);
      } catch {
        // If we can't get tender details, skip straight to AI
        setStep('ai');
        let aiResult: ProzorroAiResult;
        try {
          aiResult = await api.post<ProzorroAiResult>(
            `/prozorro/tender/${tenderId}/prepare`,
            {},
          );
        } catch {
          setStep('error');
          running.current = false;
          return;
        }

        if (aiResult.searchQuery) {
          await doSearchAndEmails(aiResult.searchQuery);
        }

        setStep('done');
        running.current = false;
        onComplete?.();
        return;
      }

      // Parse unparsed docs
      const docs = tender.docs || [];
      const unparsed = docs.filter((d: ProzorroTenderDoc) => !d.parsedText);
      for (const doc of unparsed) {
        try {
          await api.post(`/prozorro/docs/${doc.id}/parse`, {});
        } catch {
          // continue — some docs may fail
        }
      }

      // Step 2: AI analysis
      setStep('ai');
      let aiResult: ProzorroAiResult;
      try {
        aiResult = await api.post<ProzorroAiResult>(
          `/prozorro/tender/${tenderId}/prepare`,
          {},
        );
      } catch {
        setStep('error');
        running.current = false;
        return;
      }

      // Step 3 & 4: Web search + email parsing
      if (aiResult.searchQuery) {
        await doSearchAndEmails(aiResult.searchQuery);
      }

      setStep('done');
      onComplete?.();
    } catch {
      setStep('error');
    } finally {
      running.current = false;
    }
  }, [tenderId, prozorroId, onComplete]);

  async function doSearchAndEmails(searchQuery: string) {
    // Step 3: Web search
    setStep('search');
    let searchResults: ProzorroWebResult[] = [];
    try {
      searchResults = await api.post<ProzorroWebResult[]>(
        `/prozorro/web-search`,
        { searchQuery },
      );
    } catch {
      // continue
    }

    // Step 4: Parse emails from found sites
    if (searchResults.length > 0) {
      setStep('emails');
      const allEmails = new Set<string>();
      for (const site of searchResults) {
        try {
          const updated = await api.post<ProzorroWebResult>(
            `/prozorro/web-results/${site.id}/parse-emails`,
            {},
          );
          for (const e of updated.parsedEmails || []) allEmails.add(e);
        } catch {
          // continue
        }
      }
      setEmailCount(allEmails.size);
    }
  }

  const isRunning = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <button
      onClick={run}
      disabled={isRunning}
      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all disabled:cursor-wait ${
        step === 'done'
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
          : step === 'error'
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
            : isRunning
              ? 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/30'
              : 'text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-sm'
      }`}
      title={isRunning ? STEP_LABELS[step] : 'Повний цикл обробки'}
    >
      {step === 'done' ? (
        <Check size={12} />
      ) : step === 'error' ? (
        <X size={12} />
      ) : isRunning ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Wand2 size={12} />
      )}
      {isRunning
        ? STEP_LABELS[step]
        : step === 'done'
          ? emailCount > 0 ? `${emailCount} email` : 'Готово'
          : step === 'error'
            ? 'Помилка'
            : 'Magic'}
    </button>
  );
}
