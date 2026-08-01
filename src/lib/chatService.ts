import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import {
  createRoom,
  joinRoom,
  findWaitingRoom,
  subscribeToRoom,
  deleteRoom,
  cleanupExpiredRooms,
  type Room
} from './rooms';
import { PeerConnectionError, SessionExpiredError, RoomNotFoundError } from './errors';

export type SystemMessageType = 'peerConnected' | 'peerDisconnected';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'peer' | 'system';
  text: string;
  timestamp: number;
  messageType?: SystemMessageType;
}

export type ConnectionStatus =
  | 'initializing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'expired';

export interface ChatCallbacks {
  onMessage: (message: ChatMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onPeerConnected: () => void;
  onPeerDisconnected: () => void;
  onRoomCreated: (roomId: string) => void;
  onTimeUpdate: (remainingMs: number) => void;
}

export class ChatService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private roomId: string | null = null;
  private isHost: boolean = false;
  private callbacks: ChatCallbacks;
  private unsubscribeRoom: (() => void) | null = null;
  private timerInterval: number | null = null;
  private expiresAt: number = 0;
  private isDestroyed: boolean = false;
  private connectionTimeout: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(callbacks: ChatCallbacks) {
    this.callbacks = callbacks;
  }

  // Calculate exponential backoff
  private getReconnectDelay(): number {
    return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 8000);
  }

  // Initialize PeerJS
  private initPeer(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new PeerConnectionError('Service is destroyed'));
        return;
      }

      // Generate unique ID
      const peerId = `lacorte-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      this.peer = new Peer(peerId, {
        debug: 2, // More verbose debugging
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[Chat] PeerJS connected with ID:', id);
        this.reconnectAttempts = 0; // Reset retry counter on successful connection
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('[Chat] PeerJS error:', err);
        if (!this.isDestroyed) {
          this.callbacks.onStatusChange('error');
        }
        reject(err);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Chat] Incoming connection from:', conn.peer);
        if (!this.connection) {
          this.setupConnection(conn);
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[Chat] PeerJS signaling disconnected');
        // Retry reconnection with exponential backoff
        if (this.peer && !this.peer.destroyed && !this.isDestroyed && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.getReconnectDelay();
          console.log(`[Chat] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

          setTimeout(() => {
            if (this.peer && !this.peer.destroyed && !this.isDestroyed) {
              this.reconnectAttempts++;
              this.peer.reconnect();
            }
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[Chat] Max reconnection attempts reached');
          if (!this.isDestroyed) {
            this.callbacks.onStatusChange('error');
          }
        }
      });

      this.peer.on('close', () => {
        console.log('[Chat] PeerJS closed');
      });
    });
  }

  // Set up connection
  private setupConnection(conn: DataConnection) {
    // Ignore if a connection already exists
    if (this.connection && this.connection.open) {
      console.log('[Chat] Already have an open connection, ignoring new one');
      return;
    }

    this.connection = conn;
    console.log('[Chat] Setting up connection with:', conn.peer);

    // Clear previous timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Set connection timeout (30 seconds)
    this.connectionTimeout = window.setTimeout(() => {
      if (this.connection && !this.connection.open && !this.isDestroyed) {
        console.log('[Chat] Connection timeout');
        this.connection.close();
        this.callbacks.onStatusChange('error');
      }
    }, 30000);

    conn.on('open', () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      console.log('[Chat] Data connection OPEN');
      if (!this.isDestroyed) {
        this.callbacks.onStatusChange('connected');
        this.callbacks.onPeerConnected();
      }
    });

    conn.on('data', (data) => {
      if (this.isDestroyed) return;
      // Copy message before modifying (avoid mutating original)
      const message: ChatMessage = {
        ...(data as ChatMessage),
        sender: 'peer'
      };
      this.callbacks.onMessage(message);
    });

    conn.on('close', () => {
      console.log('[Chat] Connection CLOSED');
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.connection = null;
      if (!this.isDestroyed) {
        this.callbacks.onPeerDisconnected();
        this.callbacks.onStatusChange('disconnected');
      }
    });

    conn.on('error', (err) => {
      console.error('[Chat] Connection error:', err);
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      if (!this.isDestroyed) {
        this.callbacks.onStatusChange('error');
      }
    });
  }

  // Start timer
  private startTimer() {
    if (this.timerInterval) {
      return; // Ignore if already running
    }

    this.timerInterval = window.setInterval(() => {
      if (this.isDestroyed) {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        return;
      }

      const remaining = this.expiresAt - Date.now();

      if (remaining <= 0) {
        this.callbacks.onTimeUpdate(0);
        this.callbacks.onStatusChange('expired');
        this.disconnect();
      } else {
        this.callbacks.onTimeUpdate(remaining);
      }
    }, 1000);
  }

  // Create a new room (for link sharing)
  async createNewRoom(): Promise<string> {
    if (this.isDestroyed) throw new Error('Service is destroyed');

    this.callbacks.onStatusChange('initializing');

    try {
      const peerId = await this.initPeer();
      const roomId = await createRoom(peerId);

      this.roomId = roomId;
      this.isHost = true;

      // Subscribe to room (detect guest join)
      this.unsubscribeRoom = subscribeToRoom(roomId, (room) => {
        if (this.isDestroyed) return;

        if (room && room.guestPeerId && !this.connection) {
          // Guest joined - attempt connection
          console.log('[Chat] Guest joined, connecting to:', room.guestPeerId);
          this.callbacks.onStatusChange('connecting');

          // Connect after a short delay (wait for guest PeerJS setup)
          setTimeout(() => {
            if (this.peer && !this.peer.destroyed && !this.connection) {
              const conn = this.peer.connect(room.guestPeerId!, {
                reliable: true,
                serialization: 'json'
              });
              this.setupConnection(conn);
            }
          }, 500);
        }

        if (room && this.expiresAt === 0) {
          this.expiresAt = room.expiresAt;
          this.startTimer();
        }
      });

      this.callbacks.onStatusChange('waiting');
      this.callbacks.onRoomCreated(roomId);

      return roomId;
    } catch (error) {
      console.error('[Chat] Failed to create room:', error);
      if (!this.isDestroyed) {
        this.callbacks.onStatusChange('error');
      }
      throw error;
    }
  }

  // Join a specific room
  async joinExistingRoom(roomId: string): Promise<boolean> {
    if (this.isDestroyed) return false;

    this.callbacks.onStatusChange('initializing');

    try {
      const peerId = await this.initPeer();
      const room = await joinRoom(roomId, peerId);

      if (!room) {
        console.log('[Chat] Room not found or expired');
        this.callbacks.onStatusChange('error');
        throw new RoomNotFoundError(`Room ${roomId} not found or expired`);
      }

      this.roomId = roomId;
      this.isHost = false;
      this.expiresAt = room.expiresAt;
      this.startTimer();

      console.log('[Chat] Joined room, waiting for host to connect...');
      this.callbacks.onStatusChange('connecting');
      this.callbacks.onRoomCreated(roomId);

      return true;
    } catch (error) {
      console.error('[Chat] Failed to join room:', error);
      if (!this.isDestroyed) {
        this.callbacks.onStatusChange('error');
      }
      throw error;
    }
  }

  // Random matching
  async findRandomMatch(): Promise<string | null> {
    if (this.isDestroyed) return null;

    this.callbacks.onStatusChange('initializing');

    try {
      // Clean up expired rooms
      await cleanupExpiredRooms();

      // Find waiting rooms
      const waitingRoom = await findWaitingRoom();

      if (waitingRoom) {
        // Found waiting room - join
        console.log('[Chat] Found waiting room:', waitingRoom.id);
        const success = await this.joinExistingRoom(waitingRoom.id);
        return success ? waitingRoom.id : null;
      } else {
        // No waiting room - create one and wait
        console.log('[Chat] No waiting room, creating new one');
        const roomId = await this.createNewRoom();
        return roomId;
      }
    } catch (error) {
      console.error('[Chat] Failed to find match:', error);
      if (!this.isDestroyed) {
        this.callbacks.onStatusChange('error');
      }
      throw error;
    }
  }

  // Send message
  sendMessage(text: string): ChatMessage | null {
    if (!this.connection) {
      console.error('[Chat] No connection');
      return null;
    }

    if (!this.connection.open) {
      console.error('[Chat] Connection not open');
      return null;
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'me',
      text,
      timestamp: Date.now()
    };

    try {
      this.connection.send(message);
      console.log('[Chat] Message sent');
      return message;
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      return null;
    }
  }

  // Disconnect
  disconnect() {
    console.log('[Chat] Disconnecting...');
    this.isDestroyed = true;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.unsubscribeRoom) {
      this.unsubscribeRoom();
      this.unsubscribeRoom = null;
    }

    if (this.connection) {
      try {
        this.connection.close();
      } catch (e) {
        console.error('[Chat] Error closing connection:', e);
      }
      this.connection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        console.error('[Chat] Error destroying peer:', e);
      }
      this.peer = null;
    }

    // Only host deletes the room
    if (this.roomId && this.isHost) {
      deleteRoom(this.roomId).catch(console.error);
    }

    this.roomId = null;
    this.isHost = false;
    this.expiresAt = 0;
  }

  // Check status
  isConnected(): boolean {
    return this.connection !== null && this.connection.open === true;
  }

  getRoomId(): string | null {
    return this.roomId;
  }
}
