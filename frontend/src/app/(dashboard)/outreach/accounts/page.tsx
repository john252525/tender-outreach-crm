'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { OutreachEmailAccount } from '@/types';
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  TestTube,
  Pause,
  Play,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';

type FormState = {
  email: string;
  senderName: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  imapHost: string;
  imapPort: string;
  imapUser: string;
  imapPass: string;
  dailyLimit: string;
  signature: string;
  smtpRelayUrl: string;
};

const emptyForm: FormState = {
  email: '',
  senderName: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  imapHost: '',
  imapPort: '993',
  imapUser: '',
  imapPass: '',
  dailyLimit: '50',
  signature: '',
  smtpRelayUrl: '',
};

function accountToForm(a: OutreachEmailAccount): FormState {
  return {
    email: a.email,
    senderName: a.senderName || '',
    smtpHost: a.smtpHost,
    smtpPort: String(a.smtpPort),
    smtpUser: a.smtpUser,
    smtpPass: a.smtpPass,
    imapHost: a.imapHost || '',
    imapPort: a.imapPort ? String(a.imapPort) : '993',
    imapUser: a.imapUser || '',
    imapPass: a.imapPass || '',
    dailyLimit: String(a.dailyLimit),
    signature: a.signature || '',
    smtpRelayUrl: a.smtpRelayUrl || '',
  };
}

function AccountForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
  isEdit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="card mb-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {isEdit ? 'Редактирование аккаунта' : 'Новый почтовый аккаунт'}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="input-field"
            placeholder="user@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Имя отправителя
          </label>
          <input
            type="text"
            value={form.senderName}
            onChange={(e) => setForm((p) => ({ ...p, senderName: e.target.value }))}
            className="input-field"
            placeholder="Иван Петров"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            SMTP Host *
          </label>
          <input
            type="text"
            required
            value={form.smtpHost}
            onChange={(e) => setForm((p) => ({ ...p, smtpHost: e.target.value }))}
            className="input-field"
            placeholder="smtp.gmail.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            SMTP Port *
          </label>
          <input
            type="number"
            required
            value={form.smtpPort}
            onChange={(e) => setForm((p) => ({ ...p, smtpPort: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            SMTP User *
          </label>
          <input
            type="text"
            required
            value={form.smtpUser}
            onChange={(e) => setForm((p) => ({ ...p, smtpUser: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            SMTP Password *
          </label>
          <input
            type="password"
            required={!isEdit}
            value={form.smtpPass}
            onChange={(e) => setForm((p) => ({ ...p, smtpPass: e.target.value }))}
            className="input-field"
            placeholder={isEdit ? '(без изменений)' : ''}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Дневной лимит
          </label>
          <input
            type="number"
            value={form.dailyLimit}
            onChange={(e) => setForm((p) => ({ ...p, dailyLimit: e.target.value }))}
            className="input-field"
          />
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 mt-2 uppercase tracking-wide">
            IMAP (для получения ответов)
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            IMAP Host
          </label>
          <input
            type="text"
            value={form.imapHost}
            onChange={(e) => setForm((p) => ({ ...p, imapHost: e.target.value }))}
            className="input-field"
            placeholder="imap.gmail.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            IMAP Port
          </label>
          <input
            type="number"
            value={form.imapPort}
            onChange={(e) => setForm((p) => ({ ...p, imapPort: e.target.value }))}
            className="input-field"
            placeholder="993"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            IMAP User
          </label>
          <input
            type="text"
            value={form.imapUser}
            onChange={(e) => setForm((p) => ({ ...p, imapUser: e.target.value }))}
            className="input-field"
            placeholder="user@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            IMAP Password
          </label>
          <input
            type="password"
            value={form.imapPass}
            onChange={(e) => setForm((p) => ({ ...p, imapPass: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          SMTP Relay URL (необязательно)
        </label>
        <input
          type="url"
          value={form.smtpRelayUrl}
          onChange={(e) => setForm((p) => ({ ...p, smtpRelayUrl: e.target.value }))}
          className="input-field"
          placeholder="https://my-vps.com/smtp-relay.php"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Если указан — письма отправляются через этот URL вместо прямого SMTP
        </p>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Подпись
        </label>
        <textarea
          value={form.signature}
          onChange={(e) => setForm((p) => ({ ...p, signature: e.target.value }))}
          className="input-field"
          rows={3}
          placeholder={'С уважением,\nИван Петров'}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : isEdit ? <Save size={14} /> : <Plus size={14} />}
          {isEdit ? 'Сохранить' : 'Добавить'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Отмена
        </button>
      </div>
    </form>
  );
}

export default function OutreachAccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<OutreachEmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<FormState>({ ...emptyForm });

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.get<OutreachEmailAccount[]>('/outreach/email-accounts');
      setAccounts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<OutreachEmailAccount>('/outreach/email-accounts', {
        email: form.email,
        senderName: form.senderName || undefined,
        smtpHost: form.smtpHost,
        smtpPort: parseInt(form.smtpPort),
        smtpUser: form.smtpUser,
        smtpPass: form.smtpPass,
        imapHost: form.imapHost || undefined,
        imapPort: form.imapPort ? parseInt(form.imapPort) : undefined,
        imapUser: form.imapUser || undefined,
        imapPass: form.imapPass || undefined,
        dailyLimit: parseInt(form.dailyLimit),
        signature: form.signature || undefined,
        smtpRelayUrl: form.smtpRelayUrl || undefined,
      });
      setAccounts((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({ ...emptyForm });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (account: OutreachEmailAccount) => {
    setEditingId(account.id);
    setEditForm(accountToForm(account));
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        email: editForm.email,
        senderName: editForm.senderName || null,
        smtpHost: editForm.smtpHost,
        smtpPort: parseInt(editForm.smtpPort),
        smtpUser: editForm.smtpUser,
        imapHost: editForm.imapHost || null,
        imapPort: editForm.imapPort ? parseInt(editForm.imapPort) : null,
        imapUser: editForm.imapUser || null,
        imapPass: editForm.imapPass || null,
        dailyLimit: parseInt(editForm.dailyLimit),
        signature: editForm.signature || null,
        smtpRelayUrl: editForm.smtpRelayUrl || null,
      };
      if (editForm.smtpPass) {
        data.smtpPass = editForm.smtpPass;
      }
      const updated = await api.patch<OutreachEmailAccount>(`/outreach/email-accounts/${editingId}`, data);
      setAccounts((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await api.post<{ success: boolean; error?: string }>(`/outreach/email-accounts/${id}/test`, {});
      if (result.success) {
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'active' as const, lastError: null } : a)));
        alert('Подключение успешно!');
      } else {
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'error' as const, lastError: result.error || null } : a)));
        alert(`Ошибка: ${result.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить почтовый аккаунт?')) return;
    try {
      await api.delete(`/outreach/email-accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async (account: OutreachEmailAccount) => {
    const newStatus = account.status === 'paused' ? 'active' : 'paused';
    try {
      await api.patch<OutreachEmailAccount>(`/outreach/email-accounts/${account.id}`, { status: newStatus });
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, status: newStatus as 'active' | 'paused' } : a)));
    } catch {
      // ignore
    }
  };

  if (!user) return null;

  return (
    <>
      <Header title="Почтовые аккаунты" user={user} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/outreach"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            <ArrowLeft size={16} /> Назад
          </Link>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Добавить аккаунт
          </button>
        </div>

        {/* Create Form */}
        {showForm && !editingId && (
          <AccountForm
            form={form}
            setForm={setForm}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
            isEdit={false}
          />
        )}

        {/* Accounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="card text-center py-12">
            <Mail size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Нет подключенных аккаунтов</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Подключите корпоративную почту для рассылок
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id}>
                {editingId === account.id ? (
                  <AccountForm
                    form={editForm}
                    setForm={setEditForm}
                    onSubmit={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    saving={saving}
                    isEdit={true}
                  />
                ) : (
                  <div className="card">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${
                            account.status === 'active'
                              ? 'bg-green-50 dark:bg-green-900/30'
                              : account.status === 'error'
                                ? 'bg-red-50 dark:bg-red-900/30'
                                : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          {account.status === 'active' ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : account.status === 'error' ? (
                            <XCircle size={18} className="text-red-600" />
                          ) : (
                            <Pause size={18} className="text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {account.email}
                            </p>
                            {account.senderName && (
                              <span className="text-xs text-gray-400">({account.senderName})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>SMTP: {account.smtpHost}:{account.smtpPort}</span>
                            {account.imapHost ? (
                              <span className="text-green-600 dark:text-green-400">IMAP: {account.imapHost}</span>
                            ) : (
                              <span className="text-orange-500 dark:text-orange-400">IMAP не настроен</span>
                            )}
                            <span>Лимит: {account.dailyLimit}/день</span>
                            <span>Отправлено сегодня: {account.sentToday}</span>
                            {account.smtpRelayUrl && (
                              <span className="text-teal-600 dark:text-teal-400">via Relay</span>
                            )}
                          </div>
                          {account.lastError && (
                            <p className="text-xs text-red-500 mt-1 truncate">{account.lastError}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTest(account.id)}
                          disabled={testingId === account.id}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                          title="Проверить подключение"
                        >
                          {testingId === account.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <TestTube size={12} />
                          )}
                          Тест
                        </button>
                        <button
                          onClick={() => handleStartEdit(account)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(account)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            account.status === 'paused'
                              ? 'text-green-500 hover:text-green-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={account.status === 'paused' ? 'Возобновить' : 'Приостановить'}
                        >
                          {account.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
