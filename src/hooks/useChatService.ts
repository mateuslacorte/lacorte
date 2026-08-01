import { useRef, useEffect, useCallback } from 'react';
import { ChatService, type ChatMessage, type ConnectionStatus } from '../lib/chatService';

interface UseChatServiceOptions {
  onMessage: (message: ChatMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onPeerConnected: () => void;
  onPeerDisconnected: () => void;
  onRoomCreated: (roomId: string) => void;
  onTimeUpdate: (remainingMs: number) => void;
  initialRoomId: string | null;
}

export function useChatService(options: UseChatServiceOptions) {
  const chatServiceRef = useRef<ChatService | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (isStartedRef.current) {
      console.log('[useChatService] Already started, skipping...');
      return;
    }
    isStartedRef.current = true;

    console.log('[useChatService] Starting chat service, roomId:', options.initialRoomId);

    const service = new ChatService({
      onMessage: options.onMessage,
      onStatusChange: options.onStatusChange,
      onPeerConnected: options.onPeerConnected,
      onPeerDisconnected: options.onPeerDisconnected,
      onRoomCreated: options.onRoomCreated,
      onTimeUpdate: options.onTimeUpdate,
    });

    chatServiceRef.current = service;

    if (options.initialRoomId) {
      service.joinExistingRoom(options.initialRoomId);
    } else {
      service.findRandomMatch();
    }

    const handleBeforeUnload = () => {
      service.disconnect();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!document.hidden) {
        service.disconnect();
        isStartedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((text: string): ChatMessage | null => {
    if (!chatServiceRef.current) return null;
    return chatServiceRef.current.sendMessage(text);
  }, []);

  const disconnect = useCallback(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
    }
  }, []);

  const reconnect = useCallback((callbacks: Omit<UseChatServiceOptions, 'initialRoomId'>) => {
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
    }

    const service = new ChatService({
      onMessage: callbacks.onMessage,
      onStatusChange: callbacks.onStatusChange,
      onPeerConnected: callbacks.onPeerConnected,
      onPeerDisconnected: callbacks.onPeerDisconnected,
      onRoomCreated: callbacks.onRoomCreated,
      onTimeUpdate: callbacks.onTimeUpdate,
    });

    chatServiceRef.current = service;
    service.findRandomMatch();

    return service;
  }, []);

  return {
    chatService: chatServiceRef.current,
    sendMessage,
    disconnect,
    reconnect,
  };
}
