'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiKeyItem } from '@/types';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function ApiPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('auth');

  const loadKeys = useCallback(async () => {
    try {
      const data = await api.get<ApiKeyItem[]>('/api-keys');
      setKeys(data);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await api.post<ApiKeyItem>('/api-keys', {
        name: newKeyName.trim(),
        expiresAt: newKeyExpiry || undefined,
      });
      setNewlyCreatedKey(result.key || null);
      setNewKeyName('');
      setNewKeyExpiry('');
      setShowCreateForm(false);
      await loadKeys();
    } catch (e) {
      console.error('Failed to create API key:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот API ключ? Это действие необратимо.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      await loadKeys();
    } catch (e) {
      console.error('Failed to delete API key:', e);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/api-keys/${id}/toggle`, {});
      await loadKeys();
    } catch (e) {
      console.error('Failed to toggle API key:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`)
    : '/api';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">API</h1>
        <p className="text-secondary mt-1">
          Управляйте API ключами и используйте API для автоматизации Email Outreach
        </p>
      </div>

      {/* API Keys Management */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-card-foreground">API Ключи</h2>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Создать ключ
          </button>
        </div>

        {/* Newly Created Key Warning */}
        {newlyCreatedKey && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-500 mb-1">
                  Сохраните ключ — он больше не будет показан!
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-black/20 px-3 py-1.5 rounded font-mono text-card-foreground break-all">
                    {newlyCreatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                    title="Копировать"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-secondary" />}
                  </button>
                </div>
                <button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="mt-2 text-xs text-secondary hover:text-card-foreground"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-4 p-4 bg-input-bg border border-card-border rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-secondary mb-1">Название</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Например: Интеграция с CRM"
                  className="w-full px-3 py-2 bg-card border border-card-border rounded-lg text-sm text-card-foreground placeholder:text-secondary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Срок действия (опционально)</label>
                <input
                  type="date"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-card-border rounded-lg text-sm text-card-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
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

        {/* Keys List */}
        {loading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-secondary">
            <Key size={40} className="mx-auto mb-2 opacity-30" />
            <p>API ключи ещё не созданы</p>
            <p className="text-xs mt-1">Создайте ключ для доступа к API</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 bg-input-bg border border-card-border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-card-foreground">{key.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${key.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {key.isActive ? 'Активен' : 'Отключён'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-secondary font-mono">{key.keyPrefix}...****</code>
                    {key.lastUsedAt && (
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(key.lastUsedAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                    {key.expiresAt && (
                      <span className="text-xs text-secondary">
                        до {new Date(key.expiresAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(key.id)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    title={key.isActive ? 'Отключить' : 'Включить'}
                  >
                    {key.isActive ? (
                      <ToggleRight size={18} className="text-green-400" />
                    ) : (
                      <ToggleLeft size={18} className="text-secondary" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors text-secondary hover:text-red-400"
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Документация API</h2>
        <p className="text-sm text-secondary mb-4">
          Все запросы к API Outreach требуют авторизации через API ключ в заголовке <code className="bg-input-bg px-1.5 py-0.5 rounded text-xs">Authorization</code>.
        </p>

        <div className="mb-6 p-4 bg-input-bg border border-card-border rounded-lg">
          <p className="text-xs text-secondary mb-2">Базовый URL:</p>
          <code className="text-sm font-mono text-blue-400">{baseUrl}</code>
        </div>

        {/* Auth Section */}
        <DocSection
          title="Авторизация"
          id="auth"
          expanded={expandedSection === 'auth'}
          onToggle={() => toggleSection('auth')}
        >
          <p className="text-sm text-secondary mb-3">
            Добавьте API ключ в заголовок каждого запроса:
          </p>
          <CodeBlock code={`curl -H "Authorization: Bearer oak_ваш_ключ" \\\n  ${baseUrl}/outreach/dashboard`} />
        </DocSection>

        {/* Dashboard */}
        <DocSection
          title="Дашборд"
          id="dashboard"
          expanded={expandedSection === 'dashboard'}
          onToggle={() => toggleSection('dashboard')}
        >
          <Endpoint method="GET" path="/outreach/dashboard" desc="Получить статистику outreach" />
          <p className="text-xs text-secondary mt-2 mb-2">Ответ:</p>
          <CodeBlock code={`{
  "totalAccounts": 3,
  "activeAccounts": 2,
  "totalLeads": 1500,
  "totalCampaigns": 5,
  "activeCampaigns": 2,
  "totalSent": 850,
  "totalOpened": 320,
  "totalReplied": 45,
  "totalBounced": 12
}`} />
        </DocSection>

        {/* Email Accounts */}
        <DocSection
          title="Почтовые аккаунты"
          id="email-accounts"
          expanded={expandedSection === 'email-accounts'}
          onToggle={() => toggleSection('email-accounts')}
        >
          <Endpoint method="GET" path="/outreach/email-accounts" desc="Список всех почтовых аккаунтов" />

          <Endpoint method="POST" path="/outreach/email-accounts" desc="Создать почтовый аккаунт" />
          <CodeBlock code={`{
  "email": "sender@example.com",
  "senderName": "John Doe",
  "smtpHost": "smtp.example.com",
  "smtpPort": 587,
  "smtpUser": "sender@example.com",
  "smtpPass": "password",
  "imapHost": "imap.example.com",
  "imapPort": 993,
  "imapUser": "sender@example.com",
  "imapPass": "password",
  "dailyLimit": 50,
  "signature": "<p>С уважением, John</p>",
  "smtpRelayUrl": "https://relay.example.com/send"
}`} />

          <Endpoint method="PATCH" path="/outreach/email-accounts/:id" desc="Обновить почтовый аккаунт" />
          <CodeBlock code={`{
  "senderName": "New Name",
  "dailyLimit": 100,
  "status": "active"
}`} />

          <Endpoint method="DELETE" path="/outreach/email-accounts/:id" desc="Удалить почтовый аккаунт" />

          <Endpoint method="POST" path="/outreach/email-accounts/:id/test" desc="Тестировать SMTP-подключение" />
        </DocSection>

        {/* Lead Lists */}
        <DocSection
          title="Списки лидов"
          id="lead-lists"
          expanded={expandedSection === 'lead-lists'}
          onToggle={() => toggleSection('lead-lists')}
        >
          <Endpoint method="GET" path="/outreach/lead-lists" desc="Список всех списков лидов" />

          <Endpoint method="POST" path="/outreach/lead-lists" desc="Создать список лидов" />
          <CodeBlock code={`{
  "name": "IT-компании Москва",
  "description": "Директора IT-компаний в Москве"
}`} />

          <Endpoint method="DELETE" path="/outreach/lead-lists/:id" desc="Удалить список лидов" />
        </DocSection>

        {/* Leads */}
        <DocSection
          title="Лиды"
          id="leads"
          expanded={expandedSection === 'leads'}
          onToggle={() => toggleSection('leads')}
        >
          <Endpoint method="GET" path="/outreach/lead-lists/:listId/leads?page=1&limit=50" desc="Получить лидов из списка (с пагинацией)" />
          <p className="text-xs text-secondary mt-2 mb-2">Ответ:</p>
          <CodeBlock code={`{
  "data": [
    {
      "id": "uuid",
      "email": "contact@company.com",
      "firstName": "Иван",
      "lastName": "Петров",
      "company": "ООО Рога и Копыта",
      "position": "Директор",
      "status": "active"
    }
  ],
  "total": 150
}`} />

          <Endpoint method="POST" path="/outreach/lead-lists/:listId/leads" desc="Добавить одного лида" />
          <CodeBlock code={`{
  "email": "contact@company.com",
  "firstName": "Иван",
  "lastName": "Петров",
  "company": "ООО Рога и Копыта",
  "website": "https://company.com",
  "position": "Директор",
  "phone": "+7 999 123 4567"
}`} />

          <Endpoint method="POST" path="/outreach/lead-lists/:listId/import" desc="Массовый импорт лидов" />
          <CodeBlock code={`{
  "leads": [
    {
      "email": "contact1@company.com",
      "firstName": "Иван",
      "company": "Компания 1"
    },
    {
      "email": "contact2@company.com",
      "firstName": "Мария",
      "company": "Компания 2"
    }
  ]
}`} />

          <Endpoint method="DELETE" path="/outreach/leads/:id" desc="Удалить лида" />
        </DocSection>

        {/* Campaigns */}
        <DocSection
          title="Кампании"
          id="campaigns"
          expanded={expandedSection === 'campaigns'}
          onToggle={() => toggleSection('campaigns')}
        >
          <Endpoint method="GET" path="/outreach/campaigns" desc="Список всех кампаний" />

          <Endpoint method="GET" path="/outreach/campaigns/:id" desc="Детали кампании (вкл. шаги и лиды)" />

          <Endpoint method="POST" path="/outreach/campaigns" desc="Создать кампанию" />
          <CodeBlock code={`{
  "name": "Зимняя рассылка 2024",
  "leadListId": "uuid-списка-лидов",
  "emailAccountIds": ["uuid-аккаунта-1", "uuid-аккаунта-2"],
  "dailySendLimit": 50,
  "sendFromHour": 9,
  "sendToHour": 18,
  "timezone": "Europe/Moscow",
  "trackOpens": true
}`} />

          <Endpoint method="PATCH" path="/outreach/campaigns/:id" desc="Обновить кампанию" />
          <CodeBlock code={`{
  "name": "Новое название",
  "dailySendLimit": 100
}`} />

          <Endpoint method="DELETE" path="/outreach/campaigns/:id" desc="Удалить кампанию" />
        </DocSection>

        {/* Campaign Steps */}
        <DocSection
          title="Шаги кампании (Email-последовательность)"
          id="steps"
          expanded={expandedSection === 'steps'}
          onToggle={() => toggleSection('steps')}
        >
          <Endpoint method="POST" path="/outreach/campaigns/:id/steps" desc="Сохранить шаги email-последовательности" />
          <CodeBlock code={`{
  "steps": [
    {
      "subject": "{{firstName}}, у нас есть предложение для {{company}}",
      "body": "<p>Здравствуйте, {{firstName}}!</p><p>Мы заметили, что {{company}} работает в сфере...</p>",
      "delayDays": 0,
      "delayHours": 0
    },
    {
      "subject": "Re: предложение для {{company}}",
      "body": "<p>{{firstName}}, хотел уточнить, получили ли вы моё предыдущее письмо?</p>",
      "delayDays": 3,
      "delayHours": 0
    }
  ]
}`} />
          <p className="text-xs text-secondary mt-3">
            Доступные переменные: <code className="bg-input-bg px-1 rounded">{'{{firstName}}'}</code>, <code className="bg-input-bg px-1 rounded">{'{{lastName}}'}</code>, <code className="bg-input-bg px-1 rounded">{'{{company}}'}</code>, <code className="bg-input-bg px-1 rounded">{'{{position}}'}</code>, <code className="bg-input-bg px-1 rounded">{'{{website}}'}</code>
          </p>
        </DocSection>

        {/* Campaign Actions */}
        <DocSection
          title="Управление кампанией"
          id="actions"
          expanded={expandedSection === 'actions'}
          onToggle={() => toggleSection('actions')}
        >
          <Endpoint method="POST" path="/outreach/campaigns/:id/launch" desc="Запустить кампанию (draft → active)" />
          <Endpoint method="POST" path="/outreach/campaigns/:id/pause" desc="Поставить на паузу" />
          <Endpoint method="POST" path="/outreach/campaigns/:id/resume" desc="Возобновить кампанию" />
          <Endpoint method="POST" path="/outreach/campaigns/:id/send" desc="Обработать и отправить запланированные письма" />
        </DocSection>

        {/* Campaign Emails */}
        <DocSection
          title="Письма кампании"
          id="emails"
          expanded={expandedSection === 'emails'}
          onToggle={() => toggleSection('emails')}
        >
          <Endpoint method="GET" path="/outreach/campaigns/:id/emails?page=1&limit=50&status=sent" desc="Получить письма кампании (с пагинацией и фильтром)" />
          <p className="text-xs text-secondary mt-2 mb-2">
            Фильтр <code className="bg-input-bg px-1 rounded">status</code>: scheduled, sent, opened, replied, bounced, failed
          </p>
          <p className="text-xs text-secondary mb-2">Ответ:</p>
          <CodeBlock code={`{
  "data": [
    {
      "id": "uuid",
      "toEmail": "contact@company.com",
      "subject": "Предложение для Компания",
      "status": "sent",
      "sentAt": "2024-01-15T10:30:00Z",
      "openedAt": null,
      "repliedAt": null,
      "replyText": null
    }
  ],
  "total": 250
}`} />
        </DocSection>

        {/* Inbox */}
        <DocSection
          title="Входящие (Inbox)"
          id="inbox"
          expanded={expandedSection === 'inbox'}
          onToggle={() => toggleSection('inbox')}
        >
          <Endpoint method="POST" path="/outreach/inbox/check-replies" desc="Проверить IMAP на наличие новых ответов" />
          <Endpoint method="GET" path="/outreach/inbox?page=1&limit=50" desc="Получить входящие ответы (с пагинацией)" />
        </DocSection>

        {/* Full Example */}
        <DocSection
          title="Полный пример: Создание и запуск кампании"
          id="example"
          expanded={expandedSection === 'example'}
          onToggle={() => toggleSection('example')}
        >
          <p className="text-xs text-secondary mb-3">1. Создайте список лидов:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/lead-lists \\
  -H "Authorization: Bearer oak_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Тестовый список"}'`} />

          <p className="text-xs text-secondary mt-4 mb-3">2. Импортируйте лидов:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/lead-lists/LIST_ID/import \\
  -H "Authorization: Bearer oak_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{"leads": [{"email":"test@example.com","firstName":"Иван","company":"ТестКо"}]}'`} />

          <p className="text-xs text-secondary mt-4 mb-3">3. Создайте кампанию:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/campaigns \\
  -H "Authorization: Bearer oak_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Тест","leadListId":"LIST_ID","emailAccountIds":["ACCOUNT_ID"],"dailySendLimit":50}'`} />

          <p className="text-xs text-secondary mt-4 mb-3">4. Добавьте шаги email-последовательности:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/campaigns/CAMPAIGN_ID/steps \\
  -H "Authorization: Bearer oak_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{"steps":[{"subject":"Привет {{firstName}}","body":"<p>Текст письма</p>","delayDays":0}]}'`} />

          <p className="text-xs text-secondary mt-4 mb-3">5. Запустите кампанию:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/campaigns/CAMPAIGN_ID/launch \\
  -H "Authorization: Bearer oak_ваш_ключ"`} />

          <p className="text-xs text-secondary mt-4 mb-3">6. Отправьте письма:</p>
          <CodeBlock code={`curl -X POST ${baseUrl}/outreach/campaigns/CAMPAIGN_ID/send \\
  -H "Authorization: Bearer oak_ваш_ключ"`} />
        </DocSection>
      </div>
    </div>
  );
}

function DocSection({
  title,
  id,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-card-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full py-3 text-left text-sm font-medium text-card-foreground hover:text-blue-400 transition-colors"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {expanded && (
        <div className="pb-4 pl-6">
          {children}
        </div>
      )}
    </div>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PATCH: 'bg-yellow-500/20 text-yellow-400',
    DELETE: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="flex items-start gap-2 mt-3 mb-1">
      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${methodColors[method] || 'bg-gray-500/20 text-gray-400'}`}>
        {method}
      </span>
      <div>
        <code className="text-xs font-mono text-card-foreground">{path}</code>
        <p className="text-xs text-secondary mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-2">
      <pre className="bg-[#1a1b26] border border-card-border rounded-lg p-3 overflow-x-auto">
        <code className="text-xs font-mono text-gray-300 whitespace-pre">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Копировать"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
      </button>
    </div>
  );
}
