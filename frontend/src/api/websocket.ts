import type { TransactionEvent } from '../types';

type EventCallback = (event: TransactionEvent) => void;
type StatusCallback = (connected: boolean) => void;

class WalletWebSocketClient {
  private socket: WebSocket | null = null;
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSubscribedAccountId: number | null = null;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      // Determine protocol and host dynamically
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? 'localhost:8080' : window.location.host;
      const url = `${protocol}//${host}/ws/wallet`;

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        if (this.activeSubscribedAccountId) {
          this.subscribe(this.activeSubscribedAccountId);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.eventType) {
            this.notifyEvent(data as TransactionEvent);
          }
        } catch {
          // Ignored parse ping or welcome packet
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public subscribe(accountId: number) {
    this.activeSubscribedAccountId = accountId;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'SUBSCRIBE',
        accountId,
      }));
    }
  }

  public onEvent(callback: EventCallback): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  public onStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  public getStatus(): boolean {
    return this.isConnected;
  }

  private notifyEvent(event: TransactionEvent) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in WebSocket listener:', err);
      }
    });
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }
}

export const walletSocket = new WalletWebSocketClient();
