'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { ROLE_LABELS } from '@/types';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';
import ThemedCard from '@/components/themed/card';
import ThemedInput from '@/components/themed/input';
import ThemedButton from '@/components/themed/button';

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [urlForm, setUrlForm] = useState({
    parserDocsUrl: '',
    proxyUrl: '',
  });
  const [aiForm, setAiForm] = useState({
    aiUrl: '',
    aiPrompt: '',
    searchApiUrl: '',
  });
  const [touchForm, setTouchForm] = useState({
    touchApiToken: '',
  });
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    emailFrom: '',
    smtpRelayUrl: '',
  });
  const [imapForm, setImapForm] = useState({
    imapHost: '',
    imapPort: '',
    imapUser: '',
    imapPass: '',
    imapSecure: true,
  });
  const [saving, setSaving] = useState(false);
  const [savingUrls, setSavingUrls] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savingTouch, setSavingTouch] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingImap, setSavingImap] = useState(false);
  const [message, setMessage] = useState('');
  const [urlMessage, setUrlMessage] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [touchMessage, setTouchMessage] = useState('');
  const [smtpMessage, setSmtpMessage] = useState('');
  const [imapMessage, setImapMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
      setUrlForm({
        parserDocsUrl: user.settings?.parserDocsUrl || '',
        proxyUrl: user.settings?.proxyUrl || '',
      });
      setAiForm({
        aiUrl: user.settings?.aiUrl || '',
        aiPrompt: user.settings?.aiPrompt || '',
        searchApiUrl: user.settings?.searchApiUrl || '',
      });
      setTouchForm({
        touchApiToken: user.settings?.touchApiToken || '',
      });
      setSmtpForm({
        smtpHost: user.settings?.smtpHost || '',
        smtpPort: user.settings?.smtpPort?.toString() || '',
        smtpUser: user.settings?.smtpUser || '',
        smtpPass: user.settings?.smtpPass || '',
        smtpSecure: user.settings?.smtpSecure ?? false,
        emailFrom: user.settings?.emailFrom || '',
        smtpRelayUrl: user.settings?.smtpRelayUrl || '',
      });
      setImapForm({
        imapHost: user.settings?.imapHost || '',
        imapPort: user.settings?.imapPort?.toString() || '',
        imapUser: user.settings?.imapUser || '',
        imapPass: user.settings?.imapPass || '',
        imapSecure: user.settings?.imapSecure ?? true,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/users/${user.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
      });
      await refetch();
      setMessage('Профиль обновлён');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Профиль" user={user} />
      <div className="p-6 max-w-2xl space-y-6">
        <ThemedCard>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                <ThemedInput
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                <ThemedInput
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
              <ThemedInput
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+7 999 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <ThemedInput
                type="email"
                value={user.email}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Роль</label>
              <ThemedInput
                type="text"
                value={ROLE_LABELS[user.role]}
                disabled
              />
            </div>

            <ThemedButton
              type="submit"
              disabled={saving}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </ThemedButton>
          </form>
        </ThemedCard>

        <ThemedCard>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Настройки парсинга документов
          </h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingUrls(true);
              setUrlMessage('');
              try {
                await api.patch(`/users/${user.id}`, {
                  settings: {
                    ...user.settings,
                    parserDocsUrl: urlForm.parserDocsUrl || undefined,
                    proxyUrl: urlForm.proxyUrl || undefined,
                  },
                });
                await refetch();
                setUrlMessage('Настройки сохранены');
              } catch (err) {
                setUrlMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
              } finally {
                setSavingUrls(false);
              }
            }}
            className="space-y-4"
          >
            {urlMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {urlMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parser Docs URL
              </label>
              <ThemedInput
                type="url"
                value={urlForm.parserDocsUrl}
                onChange={(e) => setUrlForm((p) => ({ ...p, parserDocsUrl: e.target.value }))}
                placeholder="https://parser.example.com/parse?url="
              />
              <p className="text-xs text-gray-400 mt-1">
                URL сервиса парсинга документов. Закодированная ссылка будет добавлена в конец.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proxy URL
              </label>
              <ThemedInput
                type="url"
                value={urlForm.proxyUrl}
                onChange={(e) => setUrlForm((p) => ({ ...p, proxyUrl: e.target.value }))}
                placeholder="https://proxy.example.com/fetch?url="
              />
              <p className="text-xs text-gray-400 mt-1">
                URL прокси-сервера. Прямая ссылка на документ будет закодирована и добавлена в конец.
              </p>
            </div>

            <ThemedButton
              type="submit"
              disabled={savingUrls}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {savingUrls ? 'Сохранение...' : 'Сохранить настройки'}
            </ThemedButton>
          </form>
        </ThemedCard>

        <ThemedCard>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Настройки AI
          </h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingAi(true);
              setAiMessage('');
              try {
                await api.patch(`/users/${user.id}`, {
                  settings: {
                    ...user.settings,
                    aiUrl: aiForm.aiUrl || undefined,
                    aiPrompt: aiForm.aiPrompt || undefined,
                    searchApiUrl: aiForm.searchApiUrl || undefined,
                  },
                });
                await refetch();
                setAiMessage('Настройки сохранены');
              } catch (err) {
                setAiMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
              } finally {
                setSavingAi(false);
              }
            }}
            className="space-y-4"
          >
            {aiMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {aiMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI URL
              </label>
              <ThemedInput
                type="url"
                value={aiForm.aiUrl}
                onChange={(e) => setAiForm((p) => ({ ...p, aiUrl: e.target.value }))}
                placeholder="https://ai.example.com/api/chat"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL AI-сервиса. На этот адрес будет отправлен POST-запрос с данными закупки.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI промпт
              </label>
              <textarea
                value={aiForm.aiPrompt}
                onChange={(e) => setAiForm((p) => ({ ...p, aiPrompt: e.target.value }))}
                placeholder="Проанализируй закупку и верни JSON с полями search, subject, body..."
                rows={5}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">
                Промпт будет отправлен вместе с названием закупки и текстами сохранённых документов.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search API URL
              </label>
              <ThemedInput
                type="url"
                value={aiForm.searchApiUrl}
                onChange={(e) => setAiForm((p) => ({ ...p, searchApiUrl: e.target.value }))}
                placeholder="https://example.com/search/api.php?q="
              />
              <p className="text-xs text-gray-400 mt-1">
                URL поискового API. Поисковый запрос будет закодирован и добавлен в конец.
              </p>
            </div>

            <ThemedButton
              type="submit"
              disabled={savingAi}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {savingAi ? 'Сохранение...' : 'Сохранить настройки'}
            </ThemedButton>
          </form>
        </ThemedCard>
        <ThemedCard>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            TouchAPI (WhatsApp)
          </h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingTouch(true);
              setTouchMessage('');
              try {
                await api.patch(`/users/${user.id}`, {
                  settings: {
                    ...user.settings,
                    touchApiToken: touchForm.touchApiToken || undefined,
                  },
                });
                await refetch();
                setTouchMessage('Токен сохранён');
              } catch (err) {
                setTouchMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
              } finally {
                setSavingTouch(false);
              }
            }}
            className="space-y-4"
          >
            {touchMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {touchMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                TouchAPI Token
              </label>
              <ThemedInput
                type="text"
                value={touchForm.touchApiToken}
                onChange={(e) => setTouchForm((p) => ({ ...p, touchApiToken: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-400 mt-1">
                Токен для управления WhatsApp-инстансами через TouchAPI.
              </p>
            </div>

            <ThemedButton
              type="submit"
              disabled={savingTouch}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {savingTouch ? 'Сохранение...' : 'Сохранить токен'}
            </ThemedButton>
          </form>
        </ThemedCard>
        <ThemedCard>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            SMTP (отправка почты)
          </h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingSmtp(true);
              setSmtpMessage('');
              try {
                await api.patch(`/users/${user.id}`, {
                  settings: {
                    ...user.settings,
                    smtpHost: smtpForm.smtpHost || undefined,
                    smtpPort: smtpForm.smtpPort ? parseInt(smtpForm.smtpPort, 10) : undefined,
                    smtpUser: smtpForm.smtpUser || undefined,
                    smtpPass: smtpForm.smtpPass || undefined,
                    smtpSecure: smtpForm.smtpSecure,
                    emailFrom: smtpForm.emailFrom || undefined,
                    smtpRelayUrl: smtpForm.smtpRelayUrl || undefined,
                  },
                });
                await refetch();
                setSmtpMessage('Настройки SMTP сохранены');
              } catch (err) {
                setSmtpMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
              } finally {
                setSavingSmtp(false);
              }
            }}
            className="space-y-4"
          >
            {smtpMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {smtpMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                <ThemedInput
                  type="text"
                  value={smtpForm.smtpHost}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpHost: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Port</label>
                <ThemedInput
                  type="number"
                  value={smtpForm.smtpPort}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpPort: e.target.value }))}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Логин</label>
                <ThemedInput
                  type="text"
                  value={smtpForm.smtpUser}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpUser: e.target.value }))}
                  placeholder="user@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
                <ThemedInput
                  type="password"
                  value={smtpForm.smtpPass}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpPass: e.target.value }))}
                  placeholder="app password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email From</label>
              <ThemedInput
                type="email"
                value={smtpForm.emailFrom}
                onChange={(e) => setSmtpForm((p) => ({ ...p, emailFrom: e.target.value }))}
                placeholder="noreply@company.com (необязательно, по умолчанию логин)"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={smtpForm.smtpSecure}
                onChange={(e) => setSmtpForm((p) => ({ ...p, smtpSecure: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              SSL/TLS (порт 465)
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Relay URL (необязательно)</label>
              <ThemedInput
                type="url"
                value={smtpForm.smtpRelayUrl}
                onChange={(e) => setSmtpForm((p) => ({ ...p, smtpRelayUrl: e.target.value }))}
                placeholder="https://my-vps.com/smtp-relay.php"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Если указан — письма отправляются через этот URL вместо прямого SMTP
              </p>
            </div>

            <ThemedButton
              type="submit"
              disabled={savingSmtp}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {savingSmtp ? 'Сохранение...' : 'Сохранить SMTP'}
            </ThemedButton>
          </form>
        </ThemedCard>

        <ThemedCard>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            IMAP (получение почты)
          </h4>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingImap(true);
              setImapMessage('');
              try {
                await api.patch(`/users/${user.id}`, {
                  settings: {
                    ...user.settings,
                    imapHost: imapForm.imapHost || undefined,
                    imapPort: imapForm.imapPort ? parseInt(imapForm.imapPort, 10) : undefined,
                    imapUser: imapForm.imapUser || undefined,
                    imapPass: imapForm.imapPass || undefined,
                    imapSecure: imapForm.imapSecure,
                  },
                });
                await refetch();
                setImapMessage('Настройки IMAP сохранены');
              } catch (err) {
                setImapMessage(err instanceof Error ? err.message : 'Ошибка сохранения');
              } finally {
                setSavingImap(false);
              }
            }}
            className="space-y-4"
          >
            {imapMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                {imapMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMAP Host</label>
                <ThemedInput
                  type="text"
                  value={imapForm.imapHost}
                  onChange={(e) => setImapForm((p) => ({ ...p, imapHost: e.target.value }))}
                  placeholder="imap.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMAP Port</label>
                <ThemedInput
                  type="number"
                  value={imapForm.imapPort}
                  onChange={(e) => setImapForm((p) => ({ ...p, imapPort: e.target.value }))}
                  placeholder="993"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Логин</label>
                <ThemedInput
                  type="text"
                  value={imapForm.imapUser}
                  onChange={(e) => setImapForm((p) => ({ ...p, imapUser: e.target.value }))}
                  placeholder="user@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
                <ThemedInput
                  type="password"
                  value={imapForm.imapPass}
                  onChange={(e) => setImapForm((p) => ({ ...p, imapPass: e.target.value }))}
                  placeholder="app password"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={imapForm.imapSecure}
                onChange={(e) => setImapForm((p) => ({ ...p, imapSecure: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              SSL/TLS (порт 993)
            </label>

            <ThemedButton
              type="submit"
              disabled={savingImap}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {savingImap ? 'Сохранение...' : 'Сохранить IMAP'}
            </ThemedButton>
          </form>
        </ThemedCard>
      </div>
    </>
  );
}
