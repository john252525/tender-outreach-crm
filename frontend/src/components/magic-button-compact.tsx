'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Purchase, PurchaseFile, PurchaseAiResult, WebSearchResult } from '@/types';
import { Wand2, Loader2, Check, X, Send } from 'lucide-react';
import { getPipeline, setPipeline, usePipeline, PipelineStep } from '@/lib/pipeline-store';

interface Props {
  purchaseId: string;
  purchase?: Purchase;
  onComplete?: () => void;
  onApprove?: (data: { emails: string[]; subject: string; body: string }) => void;
}

const STEP_LABELS: Record<PipelineStep, string> = {
  idle: '',
  docs: 'Документы...',
  ai: 'AI-анализ...',
  search: 'Поиск...',
  emails: 'Email...',
  done: 'Готово!',
  error: 'Ошибка',
};

export default function MagicButtonCompact({ purchaseId, purchase: purchaseProp, onComplete, onApprove }: Props) {
  // Initialize from global store so state survives navigation
  const entry = usePipeline(purchaseId);
  const running = useRef(getPipeline(purchaseId).running);

  const syncStep = (step: PipelineStep) => {
    setPipeline(purchaseId, { step, running: step !== 'idle' && step !== 'done' && step !== 'error' });
  };

  const syncResult = (emails: string[], subject: string, body: string) => {
    setPipeline(purchaseId, { emailCount: emails.length, result: { emails, subject, body } });
  };

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setPipeline(purchaseId, { step: 'docs', emailCount: 0, result: null, running: true });

    try {
      // Resolve purchase with files
      let purchase: Purchase | null = null;
      if (purchaseProp?.purchaseNumber) {
        // Fetch full purchase (with files) by purchaseNumber — search results don't include files
        try {
          purchase = await api.get<Purchase>(`/purchases/${purchaseProp.purchaseNumber}`);
        } catch {
          // fall through to found-list lookup
        }
      }
      if (!purchase) {
        try {
          const found = await api.get<{ data: any[] }>(`/purchases/found?page=1&limit=200`);
          const item = found.data.find((f: any) => f.purchaseId === purchaseId);
          if (item?.purchase) purchase = item.purchase;
        } catch {
          // continue without purchase — doc parsing will be skipped
        }
      }

      // Parse unsaved docs (only if we have the purchase with file list)
      const unsaved = ((purchase?.files) || []).filter((f) => !f.parsedText);
      for (const file of unsaved) {
        try {
          await api.post<PurchaseFile>(`/purchases/files/${file.id}/parse`, {});
        } catch {
          // continue
        }
      }

      // AI Prepare
      syncStep('ai');
      let aiResult: PurchaseAiResult | null = null;
      try {
        aiResult = await api.post<PurchaseAiResult>(`/purchases/${purchaseId}/prepare`, {});
      } catch {
        syncStep('error');
        running.current = false;
        return;
      }

      // Web search
      let searchResults: WebSearchResult[] = [];
      if (aiResult?.searchTerm) {
        syncStep('search');
        try {
          searchResults = await api.post<WebSearchResult[]>(
            `/purchases/web-search/${aiResult.searchTerm.id}`,
            {},
          );
        } catch {
          // continue
        }
      }

      // Parse emails
      if (searchResults.length > 0) {
        syncStep('emails');
        const allEmails = new Set<string>();
        for (const site of searchResults) {
          try {
            const res = await api.post<{ emails: string[] }>(
              `/purchases/web-search-results/${site.id}/parse-emails`,
              {},
            );
            for (const e of res.emails) allEmails.add(e);
          } catch {
            // continue
          }
        }
        const emailList = Array.from(allEmails);
        if (emailList.length > 0) {
          syncResult(emailList, aiResult?.subject || '', aiResult?.body || '');
        }
      }

      syncStep('done');
      onComplete?.();
    } catch {
      syncStep('error');
    } finally {
      running.current = false;
      setPipeline(purchaseId, { running: false });
    }
  }, [purchaseId, onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const { step, result } = entry;
  const isRunning = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <div className="flex max-w-full flex-col items-stretch sm:items-end gap-1">
      <button
        onClick={run}
        disabled={isRunning || step === 'done'}
        className={`inline-flex max-w-full items-center justify-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all disabled:cursor-default text-center break-words ${
          step === 'done'
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
            : step === 'error'
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              : isRunning
                ? 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/30'
                : 'text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-sm'
        }`}
        title={isRunning ? STEP_LABELS[step] : 'Полный цикл обработки'}
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
            ? entry.emailCount > 0 ? `${entry.emailCount} email` : 'Готово'
            : step === 'error'
              ? 'Ошибка'
              : 'Magic'}
      </button>

      {result && onApprove && (
        <button
          onClick={() => onApprove(result)}
          className="inline-flex max-w-full items-center justify-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors text-center break-words"
          title="Отправить в Email Outreach"
        >
          <Send size={11} />
          В рассылку
        </button>
      )}
    </div>
  );
}
