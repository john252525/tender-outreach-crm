'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { AiSearchTerm, PaginatedResponse, WebSearchResult } from '@/types';
import {
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Globe,
  ShoppingCart,
  AtSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

export default function SearchTermsPage() {
  const { user } = useAuth();
  const [terms, setTerms] = useState<AiSearchTerm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchingId, setSearchingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [parsingEmailId, setParsingEmailId] = useState<string | null>(null);
  const limit = 20;

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<AiSearchTerm>>(
        `/purchases/ai-search-terms?page=${page}&limit=${limit}`,
      );
      setTerms(res.data);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleSearch = useCallback(async (term: AiSearchTerm) => {
    setSearchingId(term.id);
    try {
      const results = await api.post<WebSearchResult[]>(`/purchases/web-search/${term.id}`, {});
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, sites: results } : t)),
      );
      setExpandedId(term.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка поиска');
    } finally {
      setSearchingId(null);
    }
  }, []);

  const toggleExpand = useCallback((termId: string) => {
    setExpandedId((prev) => (prev === termId ? null : termId));
  }, []);

  const handleParseEmails = useCallback(async (resultId: string, termId: string) => {
    setParsingEmailId(resultId);
    try {
      const res = await api.post<{ emails: string[] }>(`/purchases/web-search-results/${resultId}/parse-emails`, {});
      // Update the term's sites with new emails
      setTerms((prev) =>
        prev.map((t) => {
          if (t.id !== termId || !t.sites) return t;
          return {
            ...t,
            sites: t.sites.map((s) =>
              s.id === resultId ? { ...s, emails: res.emails } : s,
            ),
          };
        }),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка парсинга email');
    } finally {
      setParsingEmailId(null);
    }
  }, []);

  const totalPages = Math.ceil(total / limit);

  if (!user) return null;

  return (
    <>
      <Header title="Поисковые запросы AI" user={user} />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/purchases"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Назад к поиску
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : terms.length === 0 ? (
          <div className="card text-center py-12">
            <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Поисковых запросов пока нет</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Запустите AI-анализ (Prepare) для закупки, чтобы получить поисковые запросы
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {terms.map((term) => (
                <div key={term.id} className="card">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleExpand(term.id)}
                    >
                      <Search size={18} className="text-violet-500 shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {term.term}
                      </p>
                      {term.sites && term.sites.length > 0 && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {term.sites.length} сайт.
                        </span>
                      )}
                      {expandedId === term.id ? (
                        <ChevronUp size={16} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400 shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={() => handleSearch(term)}
                      disabled={searchingId === term.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors shrink-0 disabled:opacity-50"
                    >
                      {searchingId === term.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Globe size={14} />
                      )}
                      {searchingId === term.id ? 'Поиск...' : 'Искать'}
                    </button>
                  </div>

                  {/* Linked purchases */}
                  {term.purchases && term.purchases.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <ShoppingCart size={14} className="text-gray-400 shrink-0" />
                      {term.purchases.map((p) => (
                        <Link
                          key={p.id}
                          href={`/purchases/${p.purchaseNumber}`}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                        >
                          {p.purchaseNumber}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Web search results with emails */}
                  {expandedId === term.id && term.sites && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                      {term.sites.length === 0 ? (
                        <p className="text-sm text-gray-400">Результатов нет</p>
                      ) : (
                        term.sites.map((result) => (
                          <div
                            key={result.id}
                            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                                >
                                  {result.title || result.url}
                                  <ExternalLink size={12} />
                                </a>
                                {result.snippet && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {result.snippet}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1 truncate">{result.url}</p>
                              </div>
                              <button
                                onClick={() => handleParseEmails(result.id, term.id)}
                                disabled={parsingEmailId === result.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shrink-0 disabled:opacity-50"
                                title="Спарсить email-адреса с сайта"
                              >
                                {parsingEmailId === result.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <AtSign size={12} />
                                )}
                                Email
                              </button>
                            </div>

                            {/* Parsed emails */}
                            {result.emails && result.emails.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <AtSign size={12} className="text-teal-500 shrink-0" />
                                {result.emails.map((email) => (
                                  <a
                                    key={email}
                                    href={`mailto:${email}`}
                                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                                  >
                                    {email}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Всего: {total}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary !py-1.5 !px-3 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary !py-1.5 !px-3 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
