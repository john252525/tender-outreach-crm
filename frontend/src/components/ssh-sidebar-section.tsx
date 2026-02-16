'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import type { SshServer, DirectoryEntry } from '@/types';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Server,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import AddServerModal from './add-server-modal';

function getStorageKey(serverId: string): string {
  return `ssh-tree-state-${serverId}`;
}

function loadExpandedPaths(serverId: string): Set<string> {
  try {
    const stored = localStorage.getItem(getStorageKey(serverId));
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveExpandedPaths(serverId: string, paths: Set<string>): void {
  localStorage.setItem(getStorageKey(serverId), JSON.stringify(Array.from(paths)));
}

function getSelectedServerId(): string {
  try {
    return sessionStorage.getItem('ssh-selected-server-id') || '';
  } catch {
    return '';
  }
}

function saveSelectedServerId(id: string): void {
  try {
    sessionStorage.setItem('ssh-selected-server-id', id);
  } catch {
    // ignore
  }
}

interface FileTreeItemProps {
  entry: DirectoryEntry;
  depth: number;
  expandedPaths: Set<string>;
  childrenMap: Map<string, DirectoryEntry[]>;
  loadingPaths: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectItem: (path: string) => void;
  selectedPath: string;
}

function FileTreeItem({
  entry,
  depth,
  expandedPaths,
  childrenMap,
  loadingPaths,
  onToggleFolder,
  onSelectItem,
  selectedPath,
}: FileTreeItemProps) {
  const isExpanded = expandedPaths.has(entry.path);
  const isLoading = loadingPaths.has(entry.path);
  const children = childrenMap.get(entry.path);
  const isSelected = selectedPath === entry.path;

  return (
    <div>
      <button
        onClick={() => {
          if (entry.isDirectory) {
            onToggleFolder(entry.path);
          }
          onSelectItem(entry.path);
        }}
        className={`flex items-center gap-1 w-full text-left py-0.5 px-1 rounded text-xs
          hover:bg-sidebar-hover transition-colors truncate
          ${isSelected ? 'bg-sidebar-active text-white' : 'text-gray-300'}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        title={entry.path}
      >
        {entry.isDirectory ? (
          <>
            {isLoading ? (
              <Loader2 size={12} className="animate-spin flex-shrink-0" />
            ) : isExpanded ? (
              <ChevronDown size={12} className="flex-shrink-0" />
            ) : (
              <ChevronRight size={12} className="flex-shrink-0" />
            )}
            <Folder size={12} className="flex-shrink-0 text-yellow-400" />
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            <File size={12} className="flex-shrink-0 text-gray-500" />
          </>
        )}
        <span className="truncate">{entry.name}</span>
      </button>

      {entry.isDirectory && isExpanded && children && (
        <div>
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              childrenMap={childrenMap}
              loadingPaths={loadingPaths}
              onToggleFolder={onToggleFolder}
              onSelectItem={onSelectItem}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SshSidebarSection() {
  const router = useRouter();
  const pathname = usePathname();
  const [servers, setServers] = useState<SshServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Map<string, DirectoryEntry[]>>(new Map());
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState('/');
  const [sshExpanded, setSshExpanded] = useState(false);
  const [connectingServer, setConnectingServer] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const data = await api.get<SshServer[]>('/ssh-servers');
      setServers(data);
    } catch (err) {
      console.error('Failed to fetch SSH servers:', err);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Restore selected server on mount (page refresh)
  useEffect(() => {
    const storedServerId = getSelectedServerId();
    if (storedServerId && servers.length > 0) {
      const exists = servers.find((s) => s.id === storedServerId);
      if (exists) {
        setSshExpanded(true);
        handleSelectServer(storedServerId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers]);

  const loadDirectory = useCallback(async (serverId: string, path: string) => {
    setLoadingPaths((prev) => new Set(prev).add(path));
    try {
      const entries = await api.post<DirectoryEntry[]>(
        `/ssh-servers/${serverId}/ls`,
        { path },
      );
      setChildrenMap((prev) => {
        const next = new Map(prev);
        next.set(path, entries);
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to load ${path}:`, msg);
      setConnectionError(msg);
    } finally {
      setLoadingPaths((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    }
  }, []);

  const handleSelectServer = useCallback(async (serverId: string) => {
    if (selectedServerId === serverId) return;

    setSelectedServerId(serverId);
    setChildrenMap(new Map());
    setSelectedPath('/');
    setConnectingServer(serverId);
    setConnectionError(null);
    saveSelectedServerId(serverId);

    // Restore expanded paths from localStorage
    const stored = loadExpandedPaths(serverId);
    setExpandedPaths(stored);

    // Load root directory
    await loadDirectory(serverId, '/');

    // Re-expand previously expanded paths
    Array.from(stored).forEach((p) => {
      loadDirectory(serverId, p);
    });

    setConnectingServer(null);

    // Update session storage for the page
    sessionStorage.setItem('ssh-selected-path', '/');
    sessionStorage.setItem('ssh-selected-server-id', serverId);
    window.dispatchEvent(new Event('ssh-path-changed'));

    if (pathname !== '/ssh-browser') {
      router.push('/ssh-browser');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServerId, loadDirectory, pathname, router]);

  const handleToggleFolder = useCallback((path: string) => {
    if (!selectedServerId) return;

    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        if (!childrenMap.has(path)) {
          loadDirectory(selectedServerId, path);
        }
      }
      saveExpandedPaths(selectedServerId, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServerId, childrenMap, loadDirectory]);

  const handleSelectItem = useCallback((path: string) => {
    setSelectedPath(path);
    sessionStorage.setItem('ssh-selected-path', path);
    sessionStorage.setItem('ssh-selected-server-id', selectedServerId || '');
    window.dispatchEvent(new Event('ssh-path-changed'));

    if (pathname !== '/ssh-browser') {
      router.push('/ssh-browser');
    }
  }, [selectedServerId, pathname, router]);

  const handleDeleteServer = async (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    if (!confirm('Удалить этот сервер?')) return;
    try {
      await api.delete(`/ssh-servers/${serverId}`);
      if (selectedServerId === serverId) {
        setSelectedServerId(null);
        setChildrenMap(new Map());
        setExpandedPaths(new Set());
        sessionStorage.removeItem('ssh-selected-server-id');
        sessionStorage.removeItem('ssh-selected-path');
      }
      localStorage.removeItem(getStorageKey(serverId));
      fetchServers();
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  };

  const rootEntries = childrenMap.get('/') || [];
  const isActive = pathname === '/ssh-browser';

  return (
    <>
      <div>
        <button
          onClick={() => {
            setSshExpanded((prev) => !prev);
            if (!sshExpanded && pathname !== '/ssh-browser') {
              router.push('/ssh-browser');
            }
          }}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors duration-150
            ${isActive
              ? 'bg-sidebar-active text-white'
              : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            }`}
        >
          <Server size={20} />
          <span className="flex-1 text-left">SSH Browser</span>
          <ChevronRight
            size={14}
            className={`transition-transform duration-150 ${sshExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {sshExpanded && (
          <div className="ml-3 mt-1 space-y-0.5">
            {servers.map((server) => (
              <div key={server.id}>
                <div
                  onClick={() => handleSelectServer(server.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs cursor-pointer group transition-colors
                    ${selectedServerId === server.id
                      ? 'bg-sidebar-hover text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-sidebar-hover'
                    }`}
                >
                  {connectingServer === server.id ? (
                    <Loader2 size={12} className="animate-spin flex-shrink-0" />
                  ) : (
                    <Server size={12} className="flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">{server.name}</span>
                  <button
                    onClick={(e) => handleDeleteServer(e, server.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                    title="Удалить сервер"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {selectedServerId === server.id && connectionError && (
                  <div className="ml-2 mt-1 px-2 py-1.5 text-xs text-red-400 bg-red-900/20 rounded">
                    {connectionError}
                  </div>
                )}

                {selectedServerId === server.id && rootEntries.length > 0 && (
                  <div className="ml-2 mt-0.5 max-h-80 overflow-y-auto scrollbar-thin">
                    {rootEntries.map((entry) => (
                      <FileTreeItem
                        key={entry.path}
                        entry={entry}
                        depth={1}
                        expandedPaths={expandedPaths}
                        childrenMap={childrenMap}
                        loadingPaths={loadingPaths}
                        onToggleFolder={handleToggleFolder}
                        onSelectItem={handleSelectItem}
                        selectedPath={selectedPath}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 w-full rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-sidebar-hover transition-colors"
            >
              <Plus size={12} />
              Добавить сервер
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchServers}
        />
      )}
    </>
  );
}
