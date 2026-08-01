'use client';

import { useState, useCallback, useMemo } from 'react';
import { type ChatMessage, type ConnectionStatus } from '../lib/chatService';
import { useTranslation } from '../i18n/useTranslation';
import { useChatService } from '../hooks/useChatService';
import { useScrollToBottom } from '../hooks/useScrollToBottom';
import { useTimeFormat } from '../hooks/useTimeFormat';

// Extract roomId from URL hash
function getRoomIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.slice(1); // remove '#'
  return hash || null;
}

export default function Chat() {
  const { t, lang, translations } = useTranslation();
  const tt = translations.chat;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('initializing');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useScrollToBottom(messages);
  const { formatTime } = useTimeFormat();

  // Memoized callbacks
  const handleMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    console.log('[Chat UI] Status changed:', newStatus);
    setStatus(newStatus);
  }, []);

  const handlePeerConnected = useCallback(() => {
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      sender: 'system' as const,
      text: '',
      timestamp: Date.now(),
      messageType: 'peerConnected'
    }]);
  }, []);

  const handlePeerDisconnected = useCallback(() => {
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      sender: 'system' as const,
      text: '',
      timestamp: Date.now(),
      messageType: 'peerDisconnected'
    }]);
  }, []);

  const handleRoomCreated = useCallback((roomId: string) => {
    console.log('[Chat UI] Room created/joined:', roomId);
    setCurrentRoomId(roomId);
  }, []);

  const handleTimeUpdate = useCallback((remainingMs: number) => {
    setRemainingTime(remainingMs);
  }, []);

  // Initialize chat service
  const { sendMessage, reconnect } = useChatService({
    onMessage: handleMessage,
    onStatusChange: handleStatusChange,
    onPeerConnected: handlePeerConnected,
    onPeerDisconnected: handlePeerDisconnected,
    onRoomCreated: handleRoomCreated,
    onTimeUpdate: handleTimeUpdate,
    initialRoomId: getRoomIdFromHash(),
  });

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = sendMessage(inputText.trim());
    if (message) {
      setMessages(prev => [...prev, message]);
      setInputText('');
    }
  }, [inputText, sendMessage]);

  const handleCopyLink = useCallback(async () => {
    if (!currentRoomId) return;

    // Preserve current URL path (including language prefix)
    const url = `${window.location.origin}${window.location.pathname}#${currentRoomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentRoomId]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentRoomId(null);
    setStatus('initializing');

    reconnect({
      onMessage: handleMessage,
      onStatusChange: handleStatusChange,
      onPeerConnected: handlePeerConnected,
      onPeerDisconnected: handlePeerDisconnected,
      onRoomCreated: handleRoomCreated,
      onTimeUpdate: handleTimeUpdate,
    });
  }, [reconnect, handleMessage, handleStatusChange, handlePeerConnected, handlePeerDisconnected, handleRoomCreated, handleTimeUpdate]);

  const statusText = useMemo(() => {
    return t(tt.status[status] || tt.status.error);
  }, [status, t, tt.status]);

  const statusColor = useMemo(() => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'waiting':
      case 'connecting':
      case 'initializing':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'expired':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, [status]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-card)]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]"
        role="status"
        aria-live="polite"
        aria-label={t(tt.status[status] || tt.status.error)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${statusColor}`}
            aria-hidden="true"
          />
          <span className="text-sm text-[var(--color-text-muted)]">{statusText}</span>
        </div>
        {remainingTime > 0 && (
          <div className="text-sm text-[var(--color-text-muted)]" aria-label={`${t(tt.ui.remainingTime)} ${formatTime(remainingTime)}`}>
            {t(tt.ui.remainingTime)} {formatTime(remainingTime)}
          </div>
        )}
      </div>

      {/* Security notice banner - shown only while waiting or initializing */}
      {(status === 'waiting' || status === 'initializing' || status === 'connecting') && (
        <div className="px-4 py-3 bg-green-500/10 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{t(tt.security.title)}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <span>🔒</span> {t(tt.security.noStorage)}
            </span>
            <span className="flex items-center gap-1">
              <span>🔗</span> {t(tt.security.p2p)}
            </span>
            <span className="flex items-center gap-1">
              <span>⏱️</span> {t(tt.security.sessionLimit)}
            </span>
          </div>
        </div>
      )}

      {/* Share link */}
      {currentRoomId && status === 'waiting' && (
        <div className="px-4 py-3 bg-blue-500/10 border-b border-[var(--color-border)]" role="region" aria-label={t(tt.ui.shareLink)}>
          <p className="text-sm mb-2 text-[var(--color-text)]">{t(tt.ui.shareLink)}</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#${currentRoomId}`}
              className="flex-1 px-3 py-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t(tt.ui.shareLink)}
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label={copied ? t(tt.ui.copied) : t(tt.ui.copy)}
            >
              {copied ? t(tt.ui.copied) : t(tt.ui.copy)}
            </button>
          </div>
        </div>
      )}

      {/* Message area */}
      <div
        ref={messagesEndRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-label={t(tt.messages.emptyChat)}
        aria-live="polite"
      >
        {messages.length === 0 && status === 'connected' && (
          <p className="text-center text-[var(--color-text-muted)] text-sm">
            {t(tt.messages.emptyChat)}
          </p>
        )}
        {messages.map((msg) => {
          // Resolve system message text
          const messageText = msg.sender === 'system' && msg.messageType
            ? t(tt.messages[msg.messageType])
            : msg.text;

          return (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              {msg.sender === 'system' ? (
                <div className="px-3 py-1 rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm border border-[var(--color-border)]">
                  {messageText}
                </div>
              ) : (
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    msg.sender === 'me'
                      ? 'bg-blue-500 text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                  role="article"
                  aria-label={`${msg.sender === 'me' ? t(tt.ui.myMessage) : t(tt.ui.peerMessage)}: ${messageText}`}
                >
                  <p className="break-words">{messageText}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-[var(--color-text-muted)]'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expired/error state */}
      {(status === 'expired' || status === 'error' || status === 'disconnected') && (
        <div className="px-4 py-3 bg-red-500/10 border-t border-[var(--color-border)]" role="alert" aria-live="assertive">
          <p className="text-sm text-center mb-2 text-[var(--color-text)]">
            {status === 'expired' ? t(tt.messages.sessionExpired) : t(tt.messages.connectionLost)}
          </p>
          <button
            onClick={handleNewChat}
            className="w-full py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label={t(tt.ui.newChat)}
          >
            {t(tt.ui.newChat)}
          </button>
        </div>
      )}

      {/* Input area */}
      {status === 'connected' && (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--color-border)]" role="form" aria-label={t(tt.ui.messageInputForm)}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(tt.ui.inputPlaceholder)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t(tt.ui.inputPlaceholder)}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t(tt.ui.send)}
            >
              {t(tt.ui.send)}
            </button>
          </div>
        </form>
      )}

      {/* Waiting guidance instead of input */}
      {(status === 'waiting' || status === 'connecting' || status === 'initializing') && (
        <div className="p-4 border-t border-[var(--color-border)]" role="status" aria-live="polite">
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] mb-3">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">
              {status === 'waiting' ? t(tt.messages.waitingMessage) : t(tt.messages.connectingMessage)}
            </span>
          </div>
          <div className="text-center text-xs text-[var(--color-text-muted)]">
            <p>{t(tt.quickGuide.share)} · {t(tt.quickGuide.random)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
