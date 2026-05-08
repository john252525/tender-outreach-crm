'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { Search, FolderTree, Terminal } from 'lucide-react';

export default function SshBrowserPage() {
  const { user } = useAuth();
  const [path, setPath] = useState('/');
  const [serverId, setServerId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePathChanged = useCallback(() => {
    const newPath = sessionStorage.getItem('ssh-selected-path') || '/';
    const newServerId = sessionStorage.getItem('ssh-selected-server-id') || '';
    setPath(newPath);
    setServerId(newServerId);
  }, []);

  useEffect(() => {
    handlePathChanged();

    window.addEventListener('ssh-path-changed', handlePathChanged);
    return () => {
      window.removeEventListener('ssh-path-changed', handlePathChanged);
    };
  }, [handlePathChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId) {
      setError('Сначала выберите сервер в боковом меню');
      return;
    }

    setError('');
    setLoading(true);
    setResult('');

    try {
      const data = await api.post<{ files: string[] }>(
        `/ssh-servers/${serverId}/ls-recursive`,
        { path },
      );
      setResult(data.files.join('\n'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка получения файлов');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header title="SSH Browser" user={user} />
      <div className="p-3 sm:p-6 max-w-4xl">
        {!serverId && (
          <div className="card mb-6 flex items-center gap-3 text-gray-500">
            <Terminal size={20} />
            <p className="text-sm">
              Раскройте раздел <strong>SSH Browser</strong> в боковом меню, добавьте сервер и выберите его для начала работы.
            </p>
          </div>
        )}

        <div className="card mb-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Путь на сервере
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/"
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={loading || !serverId}
                className="btn-primary flex items-center justify-center gap-2 sm:whitespace-nowrap"
              >
                <Search size={18} />
                {loading ? 'Загрузка...' : 'Показать файлы'}
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </form>
        </div>

        {result && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <FolderTree size={18} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">
                Результат ({result.split('\n').filter(Boolean).length} файлов)
              </h3>
            </div>
            <textarea
              readOnly
              value={result}
              className="w-full h-96 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg resize-y focus:outline-none"
            />
          </div>
        )}
      </div>
    </>
  );
}
