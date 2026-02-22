'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { ParsedEmailEntry, PaginatedResponse } from '@/types';
import {
  AtSign,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Globe,
  Search,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function EmailsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ParsedEmailEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<ParsedEmailEntry>>(
        `/purchases/emails?page=${page}&limit=${limit}`,
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  if (!user) return null;

  return (
    <>
      <Header title="Email-адреса" user={user} />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/purchases"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Назад к поиску
          </Link>
          <span className="text-sm text-gray-400 ml-auto">
            Всего: {total}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-12">
            <AtSign size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Email-адресов пока нет</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Нажмите &quot;Email&quot; на результатах поиска, чтобы спарсить email-адреса с сайтов
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data.map((entry) => (
                <div key={entry.emailId} className="card py-3">
                  <div className="flex items-start gap-3">
                    <AtSign size={16} className="text-teal-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
                      >
                        {entry.email}
                      </a>

                      {/* Sites */}
                      {entry.sites.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Globe size={12} className="text-gray-400 shrink-0" />
                          {entry.sites.map((site) => (
                            <a
                              key={site.id}
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors truncate max-w-[200px]"
                              title={site.url}
                            >
                              {site.title || new URL(site.url).hostname}
                              <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Search terms */}
                      {entry.searchTerms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Search size={12} className="text-violet-400 shrink-0" />
                          {entry.searchTerms.map((st) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                            >
                              {st.term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Стр. {page} / {totalPages}
                </p>
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
