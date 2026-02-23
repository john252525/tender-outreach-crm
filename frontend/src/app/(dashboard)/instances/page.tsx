'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { TouchApiInfo, TouchApiClient } from '@/types';
import {
  Smartphone,
  Plus,
  Power,
  PowerOff,
  Loader2,
  RefreshCw,
  QrCode,
  X,
  AlertCircle,
} from 'lucide-react';

export default function InstancesPage() {
  const { user } = useAuth();
  const [info, setInfo] = useState<TouchApiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [togglingLogin, setTogglingLogin] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<{
    login: string;
    url: string | null;
    loading: boolean;
  } | null>(null);

  const hasToken = !!user?.settings?.touchApiToken;

  const fetchInfo = useCallback(async () => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.get<TouchApiInfo>('/touch-api/info');
      if (data.status !== 'ok') {
        throw new Error('Ошибка получения данных от TouchAPI');
      }
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleAdd = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const login = crypto.randomUUID();
      const res = await api.post<{ status: string }>('/touch-api/add-account', { login });
      if (res.status === 'ok') {
        await fetchInfo();
      } else {
        alert('Ошибка создания инстанса');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания инстанса');
    } finally {
      setAdding(false);
    }
  }, [adding, fetchInfo]);

  const handleToggleState = useCallback(
    async (client: TouchApiClient) => {
      if (togglingLogin) return;
      const newState = !client.state;
      setTogglingLogin(client.login);
      try {
        await api.post('/touch-api/set-state', { login: client.login, state: newState });

        if (newState) {
          // After starting, wait a bit then fetch screenshot
          await new Promise((r) => setTimeout(r, 3000));
          setScreenshotModal({ login: client.login, url: null, loading: true });
          try {
            const data = await api.get<{ url: string }>(
              `/touch-api/screenshot?login=${encodeURIComponent(client.login)}`,
            );
            setScreenshotModal({ login: client.login, url: data.url, loading: false });
          } catch {
            setScreenshotModal({ login: client.login, url: null, loading: false });
          }
        }

        await fetchInfo();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Ошибка');
      } finally {
        setTogglingLogin(null);
      }
    },
    [togglingLogin, fetchInfo],
  );

  const handleShowScreenshot = useCallback(async (login: string) => {
    setScreenshotModal({ login, url: null, loading: true });
    try {
      const data = await api.get<{ url: string }>(
        `/touch-api/screenshot?login=${encodeURIComponent(login)}`,
      );
      setScreenshotModal({ login, url: data.url, loading: false });
    } catch {
      setScreenshotModal({ login, url: null, loading: false });
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <Header title="Instances (WhatsApp)" user={user} />
      <div className="p-6">
        {!hasToken ? (
          <div className="card text-center py-12">
            <AlertCircle size={48} className="mx-auto text-amber-400 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              TouchAPI Token не настроен
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Перейдите в <a href="/profile" className="text-primary-600 dark:text-primary-400 hover:underline">Профиль</a> и добавьте TouchAPI Token
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchInfo}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <RefreshCw size={14} />
              Повторить
            </button>
          </div>
        ) : (
          <>
            {/* Summary + Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {info && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Всего: <span className="font-medium text-gray-900 dark:text-gray-100">{info.summary.count}</span>
                    </span>
                    <span>
                      Активных: <span className="font-medium text-emerald-600 dark:text-emerald-400">{info.summary.active}</span>
                    </span>
                    <span>
                      Баланс: <span className="font-medium text-gray-900 dark:text-gray-100">{info.summary.payment.balance}</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInfo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw size={14} />
                  Обновить
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Instance
                </button>
              </div>
            </div>

            {/* Instances list */}
            {!info || info.clients.length === 0 ? (
              <div className="card text-center py-12">
                <Smartphone size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Инстансов пока нет</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Нажмите &quot;Add Instance&quot; чтобы создать первый
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {info.clients.map((client) => (
                  <div key={client._id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Status indicator */}
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            client.state
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate font-mono">
                              {client.login}
                            </p>
                            {client.activated && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Activated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Статус:{' '}
                              <span className={client.state ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                                {client.state ? 'Online' : 'Offline'}
                              </span>
                            </span>
                            {client.step && (
                              <span>
                                Step:{' '}
                                {typeof client.step === 'string'
                                  ? client.step
                                  : client.step.message || client.step.value}
                              </span>
                            )}
                            <span>
                              Добавлен: {new Date(client.addedTime).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {client.state && (
                          <button
                            onClick={() => handleShowScreenshot(client.login)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <QrCode size={12} />
                            QR / Screen
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleState(client)}
                          disabled={togglingLogin === client.login}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                            client.state
                              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          }`}
                        >
                          {togglingLogin === client.login ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : client.state ? (
                            <PowerOff size={12} />
                          ) : (
                            <Power size={12} />
                          )}
                          {client.state ? 'Выключить' : 'Включить'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Screenshot / QR-код
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {screenshotModal.login}
                </p>
              </div>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {screenshotModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-primary-600" />
                </div>
              ) : screenshotModal.url ? (
                <img
                  src={screenshotModal.url}
                  alt="WhatsApp Screenshot"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Скриншот недоступен. Попробуйте позже.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                {screenshotModal.url && (
                  <button
                    onClick={() => handleShowScreenshot(screenshotModal.login)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Обновить
                  </button>
                )}
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
