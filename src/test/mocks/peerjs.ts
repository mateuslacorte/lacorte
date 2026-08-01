import { vi } from 'vitest';

export class MockDataConnection {
  public open = false;
  public peer = '';
  private listeners: Record<string, Function[]> = {};

  constructor(peerId: string) {
    this.peer = peerId;
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  send(data: any) {
    // Simulate sending data
    return true;
  }

  close() {
    this.open = false;
    this._emit('close');
  }

  _emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(...args));
    }
  }

  _simulateOpen() {
    this.open = true;
    this._emit('open');
  }

  _simulateData(data: any) {
    this._emit('data', data);
  }

  _simulateError(error: Error) {
    this._emit('error', error);
  }
}

export class MockPeer {
  public id: string | null = null;
  public destroyed = false;
  private listeners: Record<string, Function[]> = {};
  private connections: MockDataConnection[] = [];

  constructor(id: string, options?: any) {
    this.id = id;
    // Simulate async connection
    setTimeout(() => {
      if (!this.destroyed) {
        this._emit('open', id);
      }
    }, 10);
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  connect(peerId: string, options?: any): MockDataConnection {
    const conn = new MockDataConnection(peerId);
    this.connections.push(conn);
    // Simulate async connection
    setTimeout(() => {
      if (!this.destroyed) {
        conn._simulateOpen();
      }
    }, 50);
    return conn;
  }

  destroy() {
    this.destroyed = true;
    this.connections.forEach(conn => conn.close());
    this._emit('close');
  }

  reconnect() {
    setTimeout(() => {
      if (!this.destroyed) {
        this._emit('open', this.id);
      }
    }, 10);
  }

  _emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(...args));
    }
  }

  _simulateIncomingConnection(conn: MockDataConnection) {
    this._emit('connection', conn);
  }

  _simulateError(error: Error) {
    this._emit('error', error);
  }

  _simulateDisconnect() {
    this._emit('disconnected');
  }
}

// Mock Peer constructor
export default MockPeer;
