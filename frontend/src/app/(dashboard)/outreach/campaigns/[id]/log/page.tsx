'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { OutreachCampaign, OutreachCampaignEmail, OutreachEmailAccount } from '@/types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  Reply,
  Clock,
  Eye,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Mail,
  Loader2,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  scheduled: { label: 'В очереди',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',        icon: <Clock size={11} /> },
  sent:      { label: 'Отправлено', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',       icon: <Send size={11} /> },
  opened:    { label: 'Открыто',    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', icon: <Eye size={11} /> },
  replied:   { label: 'Ответ',      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <Reply size={11} /> },
  bounced:   { label: 'Отскочило',  color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertTriangle size={11} /> },
  failed:    { label: 'Ошибка',     color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',           icon: <XCircle size={11} /> },
};

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '',        label: 'Все' },
  { value: 'sent',    label: 'Отправленные' },
  { value: 'replied', label: 'С ответом' },
  { value: 'failed',  label: 'Ошибки' },
  { value: 'scheduled', label: 'В очереди' },
];

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampaignLogPage() {
  const { user } = useAuth();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<OutreachCampaign | null>(null);
  const [emails, setEmails] = useState<OutreachCampaignEmail[]>([]);
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 25;

  // Load campaign name + account map once
  useEffect(() => {
    api.get<OutreachCampaign>(`/outreach/campaigns/${campaignId}`)
      .then(setCampaign)
      .catch(() => {});
    api.get<OutreachEmailAccount[]>('/outreach/email-accounts')
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((a) => { map[a.id] = a.email; });
        setAccountMap(map);
      })
      .catch(() => {});
  }, [campaignId]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const q = `page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
      const data = await api.get<{ data: OutreachCampaignEmail[]; total: number }>(
        `/outreach/campaigns/${campaignId}/emails?${q}`,
      );
      setEmails(data.data);
      setTotal(data.total);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, page, status]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Reset to first page when filter changes
  const changeFilter = (value: string) => {
    setStatus(value);
    setPage(1);
    setExpandedId(null);
  };

  const totalPages = Math.ceil(total / limit);

  if (!user) return null;

  return (
    <>
      <Header title="Журнал писем" user={user} />
      <div className="p-3 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Link
            href="/outreach/campaigns"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            <ArrowLeft size={16} /> К кампаниям
          </Link>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 !py-1.5 !px-3 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Обновить
          </button>
        </div>

        {campaign && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Всего писем: {total}
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                status === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-600" />
          </div>
        ) : emails.length === 0 ? (
          <div className="card text-center py-12">
            <Inbox size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Писем не найдено</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => {
              const cfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.scheduled;
              const isExpanded = expandedId === email.id;
              const sentLabel = email.sentAt || email.createdAt;
              return (
                <div key={email.id} className="card !p-0 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : email.id)}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {email.toEmail}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {email.subject || '(без темы)'}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(sentLabel)}
                      </span>
                      {accountMap[email.emailAccountId] && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {accountMap[email.emailAccountId]}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
                      <div className="sm:hidden flex flex-col gap-1 text-xs text-gray-400 pt-2">
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDateTime(sentLabel)}</span>
                        {accountMap[email.emailAccountId] && (
                          <span className="flex items-center gap-1"><Mail size={10} /> {accountMap[email.emailAccountId]}</span>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Тема</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{email.subject || '(без темы)'}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Текст письма</p>
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words font-sans leading-relaxed bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3">
                          {email.body}
                        </pre>
                      </div>

                      {email.replyText && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500 mb-1 flex items-center gap-1">
                            <Reply size={11} /> Ответ {email.repliedAt ? `· ${formatDateTime(email.repliedAt)}` : ''}
                          </p>
                          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words font-sans leading-relaxed bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            {email.replyText}
                          </pre>
                        </div>
                      )}

                      {email.errorMessage && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-1 flex items-center gap-1">
                            <XCircle size={11} /> Ошибка
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 break-words bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            {email.errorMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
