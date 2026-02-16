'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

interface AddServerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddServerModal({ onClose, onCreated }: AddServerModalProps) {
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    privateKey: '',
    authType: 'password' as 'password' | 'key',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/ssh-servers', {
        name: form.name,
        host: form.host,
        port: parseInt(form.port, 10) || 22,
        username: form.username,
        authType: form.authType,
        password: form.authType === 'password' ? form.password : undefined,
        privateKey: form.authType === 'key' ? form.privateKey : undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Добавить SSH сервер</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              type="text"
              placeholder="Production Server"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">IP / Хост</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={form.host}
                onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Порт</label>
              <input
                type="number"
                placeholder="22"
                value={form.port}
                onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
            <input
              type="text"
              placeholder="root"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип аутентификации
            </label>
            <select
              value={form.authType}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  authType: e.target.value as 'password' | 'key',
                }))
              }
              className="input-field"
            >
              <option value="password">Пароль</option>
              <option value="key">SSH ключ</option>
            </select>
          </div>

          {form.authType === 'password' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приватный ключ (PEM)</label>
              <textarea
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..."
                value={form.privateKey}
                onChange={(e) => setForm((p) => ({ ...p, privateKey: e.target.value }))}
                className="input-field font-mono text-xs"
                rows={5}
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
