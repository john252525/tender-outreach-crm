'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { FoundPurchase, PaginatedResponse, PurchaseAiResult } from '@/types';
import {
  FolderSearch,
  ArrowLeft,
  ExternalLink,
  Star,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import MagicButtonCompact from '@/components/magic-button-compact';
import PipelineStatusBar from '@/components/pipeline-status';

const STAGE_LABELS: Record<number, string> = {
  1: 'Подача заявок',
  2: 'Работа комиссии',
  3: 'Закупка завершена',
  4: 'Закупка отменена',
};

function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) return '—';
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} ${currency || '₽'}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type CardAiResult = NonNullable<NonNullable<FoundPurchase['aiResult']>>;

function AiResultPreview({ aiResult }: { aiResult: CardAiResult }) {
  return (
    <div className="mt-3 rounded-lg border border-violet-100 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
        AI-анализ готов
      </p>
      {aiResult.searchTerm?.term ? (
        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">
          <span className="font-medium">Поиск:</span> {aiResult.searchTerm.term}
        </p>
      ) : null}
      {aiResult.subject ? (
        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">
          <span className="font-medium">Тема:</span> {aiResult.subject}
        </p>
      ) : null}
      {aiResult.body ? (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 break-words line-clamp-3">
          {aiResult.body}
        </p>
      ) : null}
      {!aiResult.searchTerm?.term && !aiResult.subject && !aiResult.body ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Результат сохранён, но сервис не вернул текст для отображения.
        </p>
      ) : null}
    </div>
  );
}

interface Group {
  key: string; // searchQueryId or 'null'
  label: string;
  items: FoundPurchase[];
  date: string;
}

export default function FoundPurchasesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<FoundPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Load up to 500 items so we can group client-side
      const res = await api.get<PaginatedResponse<FoundPurchase>>('/purchases/found?page=1&limit=500');
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyAiResult = useCallback((purchaseId: string, aiResult: PurchaseAiResult) => {
    setData((prev) =>
      prev.map((item) =>
        item.purchaseId === purchaseId
          ? {
              ...item,
              aiResult: {
                id: aiResult.id,
                subject: aiResult.subject,
                body: aiResult.body,
                searchTerm: aiResult.searchTerm,
              },
            }
          : item,
      ),
    );
  }, []);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const item of data) {
      const key = item.searchQueryId ?? 'null';
      const label =
        (item.searchQuery?.queryParams?.objectInfo as string | undefined) ||
        'Без поискового запроса';
      if (!map.has(key)) {
        map.set(key, { key, label, items: [], date: item.createdAt });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [data]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleDeleteGroup = async (key: string) => {
    if (!confirm('Удалить все найденные закупки этого поискового запроса?')) return;
    setDeletingGroup(key);
    try {
      await api.delete(`/purchases/found/by-query/${key}`);
      setData((prev) => prev.filter((item) => (item.searchQueryId ?? 'null') !== key));
    } catch {
      // ignore
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingItemId(id);
    try {
      await api.delete(`/purchases/found/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingItemId(null);
    }
  };

  const handlePrepare = useCallback(async (purchaseId: string) => {
    if (preparingId) return;
    setPreparingId(purchaseId);
    try {
      const result = await api.post<PurchaseAiResult>(`/purchases/${purchaseId}/prepare`, {});
      applyAiResult(purchaseId, result);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка AI-анализа');
    } finally {
      setPreparingId(null);
    }
  }, [preparingId, fetchData, applyAiResult]);

  const toggleFavorite = useCallback(async (purchaseId: string) => {
    try {
      const res = await api.post<{ isFavorite: boolean }>(`/purchases/favorites/${purchaseId}`, {});
      setData((prev) =>
        prev.map((item) =>
          item.purchaseId === purchaseId ? { ...item, isFavorite: res.isFavorite } : item,
        ),
      );
    } catch {
      // ignore
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <Header title="Найденные закупки" user={user} />
      <div className="p-3 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
          <Link
            href="/purchases"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            <ArrowLeft size={16} /> Назад к поиску
          </Link>
          <Link
            href="/purchases/favorites"
            className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors ml-auto"
          >
            <Star size={16} /> Избранное
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-12">
            <FolderSearch size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Найденных закупок пока нет</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Выполните поиск, и найденные закупки появятся здесь
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              return (
                <div key={group.key} className="card p-0 overflow-hidden">
                  {/* Group header */}
                  <div
                    className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 shrink-0">
                      <Search size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                        {group.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {group.items.length} {group.items.length === 1 ? 'закупка' : group.items.length < 5 ? 'закупки' : 'закупок'} · Найдено: {formatDate(group.date)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteGroup(group.key)}
                        disabled={deletingGroup === group.key}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                        title="Очистить группу"
                      >
                        {deletingGroup === group.key ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        Очистить
                      </button>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 shrink-0" />
                    )}
                  </div>

                  {/* Group items */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {group.items.map((item) => (
                        <div key={item.id} className="px-3 sm:px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start gap-2 mb-1.5">
                                <Link
                                  href={`/purchases/${item.purchase.purchaseNumber}`}
                                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium text-sm break-all"
                                >
                                  {item.purchase.purchaseNumber}
                                </Link>
                                {item.purchase.stage !== null && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    item.purchase.stage === 1
                                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : item.purchase.stage === 3
                                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        : item.purchase.stage === 4
                                          ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    {STAGE_LABELS[item.purchase.stage] || `Этап ${item.purchase.stage}`}
                                  </span>
                                )}
                                {item.isFavorite && (
                                  <Star size={12} className="text-amber-500" fill="currentColor" />
                                )}
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed line-clamp-2">
                                {item.purchase.objectInfo || 'Без описания'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                                <span>Найдено: {formatDate(item.createdAt)}</span>
                                {item.purchase.publishedAt && <span>Опубл.: {formatDate(item.purchase.publishedAt)}</span>}
                              </div>
                              <div className="mt-2">
                                <PipelineStatusBar
                                  purchaseId={item.purchase.id}
                                  savedDocsCount={item.savedDocsCount}
                                  totalDocsCount={item.totalDocsCount}
                                  aiResult={item.aiResult}
                                  sitesCount={item.sitesCount}
                                  emailsCount={item.emailsCount}
                                />
                              </div>
                              {item.aiResult && <AiResultPreview aiResult={item.aiResult} />}
                            </div>
                            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto sm:min-w-[150px]">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 text-left sm:text-right break-words">
                                {formatPrice(item.purchase.maxPrice, item.purchase.currencyCode)}
                              </p>
                              <div className="flex flex-wrap items-stretch sm:items-center gap-1 sm:gap-1.5 sm:justify-end w-full sm:w-auto">
                                <MagicButtonCompact purchaseId={item.purchase.id} onComplete={fetchData} />
                                <button
                                  onClick={() => handlePrepare(item.purchase.id)}
                                  disabled={preparingId === item.purchase.id}
                                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50"
                                  title="AI-анализ"
                                >
                                  {preparingId === item.purchase.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  AI
                                </button>
                                <button
                                  onClick={() => toggleFavorite(item.purchaseId)}
                                  className={`p-1 rounded-lg transition-colors ${item.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
                                  title={item.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                                >
                                  <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                <Link
                                  href={`/purchases/${item.purchase.purchaseNumber}`}
                                  className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                  title="Подробнее"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                                <Link
                                  href={`/purchases/${item.purchase.purchaseNumber}`}
                                  className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                  title="В рассылку"
                                >
                                  <Send size={14} />
                                </Link>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  disabled={deletingItemId === item.id}
                                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                  title="Удалить"
                                >
                                  {deletingItemId === item.id
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Trash2 size={14} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
