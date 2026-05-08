'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { CryptoSource, CryptoDeal } from '@/types';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Link2,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Coins,
  Eye,
} from 'lucide-react';

export default function CryptoDealsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<CryptoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deals view
  const [selectedSource, setSelectedSource] = useState<CryptoSource | null>(null);
  const [deals, setDeals] = useState<CryptoDeal[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [dealsPage, setDealsPage] = useState(1);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`)
    : '/api';

  const loadSources = useCallback(async () => {
    try {
      const data = await api.get<CryptoSource[]>('/crypto-deals/sources');
      setSources(data);
    } catch (e) {
      console.error('Failed to load sources:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const loadDeals = useCallback(async (sourceId: string, page = 1) => {
    setDealsLoading(true);
    try {
      const data = await api.get<{ data: CryptoDeal[]; total: number }>(
        `/crypto-deals/deals?sourceId=${sourceId}&page=${page}&limit=20`,
      );
      setDeals(data.data);
      setDealsTotal(data.total);
      setDealsPage(page);
    } catch (e) {
      console.error('Failed to load deals:', e);
    } finally {
      setDealsLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!newSourceName.trim()) return;
    setCreating(true);
    try {
      await api.post('/crypto-deals/sources', { name: newSourceName.trim() });
      setNewSourceName('');
      setShowCreateForm(false);
      await loadSources();
    } catch (e) {
      console.error('Failed to create source:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот источник и все его сделки? Это действие необратимо.')) return;
    try {
      await api.delete(`/crypto-deals/sources/${id}`);
      if (selectedSource?.id === id) {
        setSelectedSource(null);
        setDeals([]);
      }
      await loadSources();
    } catch (e) {
      console.error('Failed to delete source:', e);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/crypto-deals/sources/${id}/toggle`, {});
      await loadSources();
    } catch (e) {
      console.error('Failed to toggle source:', e);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Удалить эту сделку?')) return;
    try {
      await api.delete(`/crypto-deals/deals/${id}`);
      if (selectedSource) {
        await loadDeals(selectedSource.id, dealsPage);
        await loadSources();
      }
    } catch (e) {
      console.error('Failed to delete deal:', e);
    }
  };

  const copyWebhookUrl = (slug: string, sourceId: string) => {
    const url = `${baseUrl}/crypto-deals/webhook/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sourceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openSource = (source: CryptoSource) => {
    setSelectedSource(source);
    setExpandedDeal(null);
    loadDeals(source.id);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64 text-secondary">Загрузка...</div>;
  }

  if (!user) return null;

  // Deals view for a selected source
  if (selectedSource) {
    const totalPages = Math.ceil(dealsTotal / 20);
    return (
      <>
        <Header title="Криптосделки" user={user} />
        <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setSelectedSource(null); setDeals([]); }}
              className="p-2 hover:bg-input-bg rounded-lg transition-colors text-secondary hover:text-card-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">{selectedSource.name}</h2>
              <p className="text-xs text-secondary">
                Всего сделок: {dealsTotal}
              </p>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <p className="text-xs text-secondary mb-1">Webhook URL:</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <code className="text-xs bg-input-bg px-3 py-1.5 rounded font-mono text-card-foreground break-all flex-1">
                {baseUrl}/crypto-deals/webhook/{selectedSource.slug}
              </code>
              <button
                onClick={() => copyWebhookUrl(selectedSource.slug, selectedSource.id)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                title="Копировать"
              >
                {copiedId === selectedSource.id
                  ? <Check size={16} className="text-green-500" />
                  : <Copy size={16} className="text-secondary" />
                }
              </button>
            </div>
          </div>

          {dealsLoading ? (
            <div className="text-center py-8 text-secondary">Загрузка...</div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12 text-secondary">
              <Coins size={40} className="mx-auto mb-2 opacity-30" />
              <p>Сделок пока нет</p>
              <p className="text-xs mt-1">Отправьте POST-запрос на webhook URL для создания сделки</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-card border border-card-border rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-input-bg transition-colors"
                    onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-secondary">
                        {expandedDeal === deal.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground font-mono truncate">
                          {JSON.stringify(deal.payload).substring(0, 100)}
                          {JSON.stringify(deal.payload).length > 100 ? '...' : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                          <span className="text-xs text-secondary">
                            {new Date(deal.createdAt).toLocaleString('ru-RU')}
                          </span>
                          {deal.senderIp && (
                            <span className="text-xs text-secondary">
                              IP: {deal.senderIp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-secondary hover:text-red-400 ml-2"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {expandedDeal === deal.id && (
                    <div className="border-t border-card-border p-4 bg-input-bg">
                      <pre className="text-xs font-mono text-card-foreground whitespace-pre-wrap break-all overflow-x-auto">
                        {JSON.stringify(deal.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => loadDeals(selectedSource.id, dealsPage - 1)}
                disabled={dealsPage <= 1}
                className="px-3 py-1.5 text-sm bg-card border border-card-border rounded-lg disabled:opacity-30 hover:bg-input-bg transition-colors text-card-foreground"
              >
                Назад
              </button>
              <span className="text-sm text-secondary">
                {dealsPage} / {totalPages}
              </span>
              <button
                onClick={() => loadDeals(selectedSource.id, dealsPage + 1)}
                disabled={dealsPage >= totalPages}
                className="px-3 py-1.5 text-sm bg-card border border-card-border rounded-lg disabled:opacity-30 hover:bg-input-bg transition-colors text-card-foreground"
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // Sources list view
  return (
    <>
      <Header title="Криптосделки" user={user} />
      <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Криптосделки</h1>
          <p className="text-secondary mt-1">
            Создавайте уникальные URL для приёма сделок
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Link2 size={20} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-card-foreground">Источники</h2>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              <Plus size={16} />
              Создать источник
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-4 p-4 bg-input-bg border border-card-border rounded-lg">
              <div className="mb-3">
                <label className="block text-xs text-secondary mb-1">Название источника</label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="Например: Binance P2P, LocalBitcoins"
                  className="w-full px-3 py-2 bg-card border border-card-border rounded-lg text-sm text-card-foreground placeholder:text-secondary/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newSourceName.trim() || creating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-card border border-card-border hover:bg-input-bg text-card-foreground rounded-lg text-sm transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-secondary">Загрузка...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <Link2 size={40} className="mx-auto mb-2 opacity-30" />
              <p>Источники ещё не созданы</p>
              <p className="text-xs mt-1">Создайте источник для получения уникального webhook URL</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 bg-input-bg border border-card-border rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-card-foreground">{source.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${source.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {source.isActive ? 'Активен' : 'Отключён'}
                        </span>
                        {source.dealsCount !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            {source.dealsCount} сделок
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <code className="text-xs text-secondary font-mono truncate max-w-md">
                          {baseUrl}/crypto-deals/webhook/{source.slug}
                        </code>
                        <button
                          onClick={() => copyWebhookUrl(source.slug, source.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                          title="Копировать URL"
                        >
                          {copiedId === source.id
                            ? <Check size={14} className="text-green-500" />
                            : <Copy size={14} className="text-secondary" />
                          }
                        </button>
                      </div>
                      <p className="text-xs text-secondary mt-1">
                        Создан: {new Date(source.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => openSource(source)}
                        className="p-2 hover:bg-white/10 rounded transition-colors text-secondary hover:text-amber-400"
                        title="Посмотреть сделки"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleToggle(source.id)}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                        title={source.isActive ? 'Отключить' : 'Включить'}
                      >
                        {source.isActive ? (
                          <ToggleRight size={18} className="text-green-400" />
                        ) : (
                          <ToggleLeft size={18} className="text-secondary" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 hover:bg-red-500/20 rounded transition-colors text-secondary hover:text-red-400"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
