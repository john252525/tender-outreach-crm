'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { TouchApiInfo, TouchApiClient } from '@/types';
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  Image as ImageIcon,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';

/* ---------- local helpers & constants ---------- */

const NAMES_KEY = 'instance-names';
function loadNames(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NAMES_KEY) || '{}'); } catch { return {}; }
}

const SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'vk', label: 'VK' },
  { value: 'max', label: 'MAX' },
];

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  telegram: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  vk: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  max: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

/* ---------- types ---------- */

interface InstanceOption {
  login: string;
  source: string;
  label: string;
  state: boolean;
}

interface Chat {
  id: string;
  name: string;
  chatId: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  image?: string;
  isGroup?: boolean;
}

interface ChatMessage {
  id: string;
  body: string;
  type: string;
  fromMe: boolean;
  time: number;
  chatId: string;
  senderName?: string;
  caption?: string;
  quotedMsg?: { body?: string; caption?: string } | null;
  mediaUrl?: string;
  hasMedia?: boolean;
  ack?: number;
}

/* ---------- component ---------- */

export default function MessengerPage() {
  const { user } = useAuth();
  const hasToken = !!user?.settings?.touchApiToken;

  // Instances
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<InstanceOption | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(true);

  // Chats
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  // Active chat
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Send
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  // Attachment URL
  const [attachUrl, setAttachUrl] = useState('');
  const [showAttach, setShowAttach] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* --- Load instances --- */
  useEffect(() => {
    if (!hasToken) { setLoadingInstances(false); return; }
    (async () => {
      setLoadingInstances(true);
      const names = loadNames();
      const opts: InstanceOption[] = [];
      const results = await Promise.allSettled(
        SOURCES.map((s) =>
          api.get<TouchApiInfo>(`/touch-api/info?source=${encodeURIComponent(s.value)}`),
        ),
      );
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.status === 'ok') {
          r.value.clients.forEach((c) => {
            opts.push({
              login: c.login,
              source: SOURCES[i].value,
              label: names[c.login] || c.login.slice(0, 8),
              state: c.state,
            });
          });
        }
      });
      setInstances(opts);
      // Auto-select first active instance
      const active = opts.find((o) => o.state);
      if (active) setSelectedInstance(active);
      setLoadingInstances(false);
    })();
  }, [hasToken]);

  /* --- Load chats when instance changes --- */
  const fetchChats = useCallback(async () => {
    if (!selectedInstance) return;
    setLoadingChats(true);
    try {
      const res = await api.post<any>('/touch-api/get-chats', {
        login: selectedInstance.login,
        source: selectedInstance.source,
      });
      const raw = res?.chats || res?.data || res || [];
      const list: Chat[] = (Array.isArray(raw) ? raw : []).map((c: any) => {
        // TouchAPI: chat identifier is in 'phone' field
        const phone = String(c.phone || '');
        const lm = c.lastMessage;
        const lmData = lm?._data;
        // Body: top-level lastMessage.body, or _data.body, or type label
        let preview = lm?.body || lmData?.body || '';
        if (!preview && lm) {
          const t = lm.type || lmData?.type || '';
          if (t && t !== 'chat') preview = `[${t}]`;
        }
        return {
          id: phone,
          name: c.name || c.title || phone || '',
          chatId: phone,
          lastMessage: preview,
          lastMessageTime: c.timestamp || lm?.timestamp || lmData?.t || 0,
          unreadCount: c.unreadCount ?? 0,
          image: c.image || c.avatar || c.img || undefined,
          isGroup: !!c.isGroup,
        };
      });
      // Sort by last message time descending
      list.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      setChats(list);
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [selectedInstance]);

  useEffect(() => {
    setChats([]);
    setActiveChat(null);
    setMessages([]);
    fetchChats();
  }, [fetchChats]);

  /* --- Load messages when chat changes --- */
  const fetchMessages = useCallback(async (chat: Chat) => {
    if (!selectedInstance) return;
    setLoadingMessages(true);
    try {
      const res = await api.post<any>('/touch-api/get-chat-messages', {
        login: selectedInstance.login,
        source: selectedInstance.source,
        to: chat.chatId,
      });
      const raw = res?.messages || res?.data || res || [];
      const list: ChatMessage[] = (Array.isArray(raw) ? raw : []).map((m: any) => {
        // TouchAPI messages: fields at top level AND in _data
        const d = m._data || {};
        const idObj = m.id || d.id || {};
        const msgId =
          typeof idObj === 'string'
            ? idObj
            : idObj._serialized || idObj.id || String(Math.random());
        return {
          id: msgId,
          body: m.body ?? d.body ?? '',
          type: m.type || d.type || 'chat',
          fromMe: m.fromMe ?? idObj.fromMe ?? d.id?.fromMe ?? false,
          time: m.timestamp || d.t || 0,
          chatId: chat.chatId,
          senderName: m.senderName || m._data?.notifyName || undefined,
          caption: m.caption ?? d.caption ?? undefined,
          quotedMsg: m.quotedMsg || d.quotedMsg || null,
          mediaUrl: m.mediaUrl || d.mediaUrl || undefined,
          hasMedia: m.hasMedia ?? d.hasMedia ?? false,
          ack: m.ack ?? d.ack ?? 0,
        };
      });
      // Sort oldest first
      list.sort((a, b) => a.time - b.time);
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedInstance]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll messages every 10s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeChat && selectedInstance) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeChat);
      }, 10000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat, selectedInstance, fetchMessages]);

  /* --- Send message --- */
  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeChat || !selectedInstance || (!msgText.trim() && !attachUrl.trim()) || sending) return;
    setSending(true);
    try {
      const content: Array<{ type: string; src: string; filename: string }> = [];
      if (attachUrl.trim()) {
        content.push({ type: 'image', src: attachUrl.trim(), filename: 'file.jpg' });
      }
      await api.post('/touch-api/send-message', {
        login: selectedInstance.login,
        source: selectedInstance.source,
        to: activeChat.chatId,
        text: msgText.trim(),
        content: content.length > 0 ? content : undefined,
      });
      setMsgText('');
      setAttachUrl('');
      setShowAttach(false);
      // Refresh messages
      setTimeout(() => fetchMessages(activeChat), 1000);
    } catch {
      // ignore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [activeChat, selectedInstance, msgText, attachUrl, sending, fetchMessages]);

  /* --- Filtered chats --- */
  const filteredChats = useMemo(() => {
    if (!chatSearch.trim()) return chats;
    const q = chatSearch.toLowerCase();
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.chatId.toLowerCase().includes(q) ||
        (typeof c.lastMessage === 'string' && c.lastMessage.toLowerCase().includes(q)),
    );
  }, [chats, chatSearch]);

  /* --- Format time --- */
  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts < 1e12 ? ts * 1000 : ts);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  /* --- No token --- */
  if (!hasToken) {
    return (
      <>
        <Header title="Мессенджер" user={user} />
        <div className="p-6">
          <div className="card text-center py-12">
            <AlertCircle size={48} className="mx-auto text-amber-400 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">TouchAPI Token не настроен</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Перейдите в{' '}
              <a href="/profile" className="text-primary-600 dark:text-primary-400 hover:underline">
                Профиль
              </a>{' '}
              и добавьте TouchAPI Token
            </p>
          </div>
        </div>
      </>
    );
  }

  /* --- Loading instances --- */
  if (loadingInstances) {
    return (
      <>
        <Header title="Мессенджер" user={user} />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Мессенджер" user={user} />
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Instance selector bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto">
          {instances.length === 0 ? (
            <span className="text-sm text-gray-500">Нет инстансов. Создайте в разделе Instances.</span>
          ) : (
            instances.map((inst) => {
              const isActive = selectedInstance?.login === inst.login;
              const srcColor = SOURCE_COLORS[inst.source] || 'bg-gray-100 text-gray-700';
              return (
                <button
                  key={inst.login}
                  onClick={() => setSelectedInstance(inst)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      inst.state ? 'bg-emerald-400' : 'bg-gray-400'
                    }`}
                  />
                  <span className={`inline-flex px-1 py-0 rounded text-[9px] ${isActive ? 'bg-white/20' : srcColor}`}>
                    {SOURCES.find((s) => s.value === inst.source)?.label || inst.source}
                  </span>
                  {inst.label}
                </button>
              );
            })
          )}
        </div>

        {/* Main messenger layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left panel — Chat list */}
          <div className="w-80 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Поиск чатов..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary-600" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedInstance ? 'Нет чатов' : 'Выберите инстанс'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = activeChat?.chatId === chat.chatId;
                  return (
                    <div
                      key={chat.chatId}
                      onClick={() => setActiveChat(chat)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700/50 ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
                        {chat.image ? (
                          <img
                            src={chat.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
                            }}
                          />
                        ) : (
                          <UserIcon size={20} className="text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {chat.name}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatTime(chat.lastMessageTime || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {typeof chat.lastMessage === 'string' ? chat.lastMessage : ''}
                          </p>
                          {!!chat.unreadCount && chat.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-primary-600 text-white shrink-0">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Refresh button */}
            {selectedInstance && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={fetchChats}
                  disabled={loadingChats}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loadingChats ? 'animate-spin' : ''} />
                  Обновить
                </button>
              </div>
            )}
          </div>

          {/* Right panel — Messages */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
            {!activeChat ? (
              /* No chat selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    Выберите чат
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Чтобы начать переписку
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
                  {/* Back button on small screens */}
                  <button
                    onClick={() => setActiveChat(null)}
                    className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {activeChat.image ? (
                      <img src={activeChat.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {activeChat.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{activeChat.chatId}</p>
                  </div>
                  <button
                    onClick={() => fetchMessages(activeChat)}
                    disabled={loadingMessages}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Обновить сообщения"
                  >
                    <RefreshCw size={14} className={loadingMessages ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-primary-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-400">Нет сообщений</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                            msg.fromMe
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {/* Sender name for group chats */}
                          {!msg.fromMe && msg.senderName && (
                            <p
                              className={`text-[11px] font-semibold mb-0.5 ${
                                msg.fromMe ? 'text-white/70' : 'text-primary-600 dark:text-primary-400'
                              }`}
                            >
                              {msg.senderName}
                            </p>
                          )}

                          {/* Quoted message */}
                          {msg.quotedMsg && (
                            <div
                              className={`mb-1 px-2 py-1 rounded text-[11px] border-l-2 ${
                                msg.fromMe
                                  ? 'bg-white/10 border-white/40 text-white/80'
                                  : 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {msg.quotedMsg.body || msg.quotedMsg.caption || '...'}
                            </div>
                          )}

                          {/* Media */}
                          {msg.mediaUrl && (
                            <div className="mb-1">
                              {msg.type === 'image' || msg.type === 'sticker' ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt=""
                                  className="rounded-lg max-w-full max-h-64 object-contain"
                                />
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs underline ${
                                    msg.fromMe ? 'text-white/80' : 'text-primary-600 dark:text-primary-400'
                                  }`}
                                >
                                  Открыть файл
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text */}
                          {(msg.body || msg.caption) ? (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.body || msg.caption}
                            </p>
                          ) : msg.type !== 'chat' && !msg.mediaUrl ? (
                            <p className={`text-xs italic ${msg.fromMe ? 'text-white/60' : 'text-gray-400'}`}>
                              [{msg.type}]
                            </p>
                          ) : null}

                          {/* Time + status */}
                          <div
                            className={`flex items-center gap-1 mt-0.5 ${
                              msg.fromMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                msg.fromMe ? 'text-white/60' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(msg.time)}
                            </span>
                            {msg.fromMe && (
                              msg.ack && msg.ack >= 2 ? (
                                <CheckCheck
                                  size={12}
                                  className={msg.ack >= 3 ? 'text-blue-300' : 'text-white/60'}
                                />
                              ) : (
                                <Check size={12} className="text-white/60" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                  {/* Attachment URL bar */}
                  {showAttach && (
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-gray-400 shrink-0" />
                      <input
                        type="url"
                        value={attachUrl}
                        onChange={(e) => setAttachUrl(e.target.value)}
                        placeholder="URL изображения..."
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                      <button
                        onClick={() => { setShowAttach(false); setAttachUrl(''); }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    {/* Attach button */}
                    <button
                      type="button"
                      onClick={() => setShowAttach(!showAttach)}
                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                        showAttach
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="Прикрепить изображение"
                    >
                      <ImageIcon size={18} />
                    </button>

                    {/* Text input */}
                    <textarea
                      ref={inputRef}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Сообщение..."
                      rows={1}
                      className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none max-h-32"
                      style={{
                        minHeight: '40px',
                        height: 'auto',
                      }}
                      onInput={(e) => {
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                      }}
                    />

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={sending || (!msgText.trim() && !attachUrl.trim())}
                      className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
