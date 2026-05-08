'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { BlacklistEntry, PaginatedResponse } from '@/types';
import {
  Ban,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function BlacklistPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BlacklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<BlacklistEntry>>(
        `/purchases/blacklist?page=${page}&limit=${limit}`,
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || adding) return;
    setAdding(true);
    try {
      await api.post('/purchases/blacklist', { email: newEmail.trim() });
      setNewEmail('');
      await fetchData();
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (email: string, id: string) => {
    setRemovingId(id);
    try {
      await api.delete(`/purchases/blacklist/${encodeURIComponent(email)}`);
      await fetchData();
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (!user) return null;

  return (
    <>
      <Header title="Чёрный список" user={user} />
      <div className="p-3 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
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

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            В чёрный список
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-12">
            <Ban size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Чёрный список пуст</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Добавьте email вручную или нажмите &quot;Ban&quot; на странице email-адресов
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data.map((entry) => (
                <div key={entry.id} className="card py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
                      <Ban size={14} className="text-red-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                        {entry.email}
                      </span>
                      <span className="text-xs text-gray-400 sm:shrink-0">
                        {new Date(entry.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(entry.email, entry.id)}
                      disabled={removingId === entry.id}
                      title="Убрать из чёрного списка"
                      className="p-1.5 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                    >
                      {removingId === entry.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 sm:mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Стр. {page} / {totalPages}
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
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
