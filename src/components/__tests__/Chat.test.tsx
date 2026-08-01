import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '../Chat';

// Mock useChatService
const mockSendMessage = vi.fn();
const mockReconnect = vi.fn();
let mockOnStatusChange: ((status: string) => void) | null = null;
let mockOnMessage: ((message: unknown) => void) | null = null;
let mockOnPeerConnected: (() => void) | null = null;
let mockOnRoomCreated: ((roomId: string) => void) | null = null;
let mockOnTimeUpdate: ((time: number) => void) | null = null;

vi.mock('../../hooks/useChatService', () => ({
  useChatService: (options: {
    onMessage: (message: unknown) => void;
    onStatusChange: (status: string) => void;
    onPeerConnected: () => void;
    onPeerDisconnected: () => void;
    onRoomCreated: (roomId: string) => void;
    onTimeUpdate: (time: number) => void;
  }) => {
    mockOnStatusChange = options.onStatusChange;
    mockOnMessage = options.onMessage;
    mockOnPeerConnected = options.onPeerConnected;
    mockOnRoomCreated = options.onRoomCreated;
    mockOnTimeUpdate = options.onTimeUpdate;
    return {
      sendMessage: mockSendMessage,
      reconnect: mockReconnect,
    };
  },
}));

// Mock useTranslation
vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    lang: 'en',
    t: (obj: Record<string, string>) => obj.en || obj.en || Object.values(obj)[0],
    changeLanguage: vi.fn(),
    translations: {
      chat: {
        pageTitle: { en: 'Stranger Chat', pt: 'Stranger Chat' },
        status: {
          initializing: { en: 'Initializing...', pt: 'Initializing...' },
          waiting: { en: 'Waiting for peer...', pt: 'Waiting for peer...' },
          connecting: { en: 'Connecting...', pt: 'Connecting...' },
          connected: { en: 'Connected', pt: 'Connected' },
          disconnected: { en: 'Disconnected', pt: 'Disconnected' },
          expired: { en: 'Session Expired', pt: 'Session Expired' },
          error: { en: 'Error Occurred', pt: 'Error Occurred' },
        },
        ui: {
          shareLink: { en: 'Share this link:', pt: 'Share this link:' },
          copy: { en: 'Copy', pt: 'Copy' },
          copied: { en: 'Copied!', pt: 'Copied!' },
          send: { en: 'Send', pt: 'Send' },
          inputPlaceholder: { en: 'Type a message...', pt: 'Type a message...' },
          remainingTime: { en: 'Time left:', pt: 'Time left:' },
          newChat: { en: 'Start New Chat', pt: 'Start New Chat' },
          myMessage: { en: 'My message', pt: 'My message' },
          peerMessage: { en: "Peer's message", pt: "Peer's message" },
          messageInputForm: { en: 'Message input form', pt: 'Message input form' },
        },
        security: {
          title: { en: 'Secure P2P chat', pt: 'Secure P2P chat' },
          noStorage: { en: 'No server storage', pt: 'No server storage' },
          p2p: { en: 'Direct P2P connection', pt: 'Direct P2P connection' },
          sessionLimit: { en: '1-hour session limit', pt: '1-hour session limit' },
        },
        messages: {
          peerConnected: { en: 'Peer connected!', pt: 'Peer connected!' },
          peerDisconnected: { en: 'Peer disconnected.', pt: 'Peer disconnected.' },
          sessionExpired: { en: 'Session has expired.', pt: 'Session has expired.' },
          connectionLost: { en: 'Connection lost.', pt: 'Connection lost.' },
          waitingMessage: { en: 'Waiting for peer to join...', pt: 'Waiting for peer to join...' },
          connectingMessage: { en: 'Preparing connection...', pt: 'Preparing connection...' },
          emptyChat: { en: 'Type a message to start chatting!', pt: 'Type a message to start chatting!' },
        },
        quickGuide: {
          share: { en: 'Share link to invite friends', pt: 'Share link to invite friends' },
          random: { en: 'Or wait for random match', pt: 'Or wait for random match' },
        },
      },
    },
  }),
}));

// Mock useScrollToBottom
vi.mock('../../hooks/useScrollToBottom', () => ({
  useScrollToBottom: () => ({ current: null }),
}));

// Mock useTimeFormat
vi.mock('../../hooks/useTimeFormat', () => ({
  useTimeFormat: () => ({
    formatTime: (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  }),
}));

// Mock window.location
const mockLocation = {
  hash: '',
  origin: 'https://example.com',
  pathname: '/anonymous-chat',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('navigator', {
  ...navigator,
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.hash = '';
    mockOnStatusChange = null;
    mockOnMessage = null;
    mockOnPeerConnected = null;
    mockOnRoomCreated = null;
    mockOnTimeUpdate = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders chat component with initializing status', () => {
      render(<Chat />);
      expect(screen.getByText('Initializing...')).toBeInTheDocument();
    });

    it('displays loading spinner during initialization', () => {
      render(<Chat />);
      expect(screen.getByRole('status', { name: 'Initializing...' })).toBeInTheDocument();
    });
  });

  describe('Status Changes', () => {
    it('shows waiting status when waiting for peer', async () => {
      render(<Chat />);

      // Simulate status change to waiting
      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('waiting');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Waiting for peer...')).toBeInTheDocument();
      });
    });

    it('shows connected status when peer connects', async () => {
      render(<Chat />);

      // Simulate status change to connected
      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('shows disconnected status', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('disconnected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    it('shows expired status', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('expired');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Session Expired')).toBeInTheDocument();
      });
    });
  });

  describe('Share Link', () => {
    it('shows share link when room is created and waiting', async () => {
      render(<Chat />);

      // Simulate room creation and waiting status
      await act(async () => {
        if (mockOnRoomCreated) {
          mockOnRoomCreated('test-room-123');
        }
        if (mockOnStatusChange) {
          mockOnStatusChange('waiting');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Share this link:')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/test-room-123/)).toBeInTheDocument();
      });
    });

    it('copies link to clipboard when copy button is clicked', async () => {
      render(<Chat />);

      // Set up room and waiting status
      await act(async () => {
        if (mockOnRoomCreated) {
          mockOnRoomCreated('test-room-123');
        }
        if (mockOnStatusChange) {
          mockOnStatusChange('waiting');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy');
      await act(async () => {
        copyButton.click();
      });

      expect(mockWriteText).toHaveBeenCalledWith(
        'https://example.com/anonymous-chat#test-room-123'
      );

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Message Input', () => {
    it('shows input field when connected', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
      });
    });

    it('does not show input field when not connected', () => {
      render(<Chat />);
      expect(screen.queryByPlaceholderText('Type a message...')).not.toBeInTheDocument();
    });

    it('sends message when form is submitted', async () => {
      mockSendMessage.mockReturnValue({
        id: 'msg-1',
        sender: 'me',
        text: 'Hello',
        timestamp: Date.now(),
      });

      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Hello' } });
      await act(async () => {
        screen.getByRole('button', { name: 'Send' }).click();
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('does not send empty message', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Send')).toBeInTheDocument();
      });

      const form = screen.getByRole('form');
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('disables send button when input is empty', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('Messages Display', () => {
    it('displays received messages', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
        if (mockOnMessage) {
          mockOnMessage({
            id: 'msg-1',
            sender: 'peer',
            text: 'Hello from peer',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Hello from peer')).toBeInTheDocument();
      });
    });

    it('shows empty chat message when connected with no messages', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Type a message to start chatting!')).toBeInTheDocument();
      });
    });
  });

  describe('Remaining Time', () => {
    it('displays remaining time when available', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnTimeUpdate) {
          mockOnTimeUpdate(1800000); // 30 minutes
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Time left/)).toBeInTheDocument();
      });
    });
  });

  describe('New Chat', () => {
    it('shows new chat button when disconnected', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('disconnected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Start New Chat')).toBeInTheDocument();
      });
    });

    it('shows new chat button when expired', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('expired');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Start New Chat')).toBeInTheDocument();
      });
    });

    it('calls reconnect when new chat button is clicked', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('disconnected');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Start New Chat')).toBeInTheDocument();
      });

      const newChatButton = screen.getByText('Start New Chat');
      await act(async () => {
        newChatButton.click();
      });

      expect(mockReconnect).toHaveBeenCalled();
    });
  });

  describe('Peer Events', () => {
    it('adds system message when peer connects', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
        if (mockOnPeerConnected) {
          mockOnPeerConnected();
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Peer connected!')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<Chat />);

      await act(async () => {
        if (mockOnStatusChange) {
          mockOnStatusChange('connected');
        }
      });

      await waitFor(() => {
        expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Message input form');
        expect(screen.getByRole('log')).toBeInTheDocument();
      });
    });

    it('has live regions for status updates', () => {
      render(<Chat />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });
});
