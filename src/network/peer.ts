// ==========================================
// WebRTC P2P 點對點連線封裝 (PeerJS Host-as-Server)
// ==========================================
import * as PeerModule from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { P2PMessage } from '../types';

// 安全解析 Peer 建構函式，防範 ESM/CJS interop 或環境差異
function getPeerConstructor(): any {
  const mod = PeerModule as any;
  if (typeof mod === 'function') return mod;
  if (typeof mod.Peer === 'function') return mod.Peer;
  if (typeof mod.default === 'function') return mod.default;
  if (mod.default && typeof mod.default.Peer === 'function') return mod.default.Peer;
  if (typeof window !== 'undefined' && typeof (window as any).Peer === 'function') {
    return (window as any).Peer;
  }
  return null;
}

export class NetworkManager {
  private peer: any = null;
  public myPeerId = '';
  public isHost = false;
  public currentRoomId = '';
  private hostConnection: DataConnection | null = null; // Client perspective
  private clientConnections: Map<string, DataConnection> = new Map(); // Host perspective
  private messageHandlers: Array<(msg: P2PMessage, senderId: string) => void> = [];
  private peerOpenHandlers: Array<(id: string) => void> = [];
  private peerDisconnectHandlers: Array<(peerId: string) => void> = [];

  constructor() {}

  /**
   * 初始化本機 Peer (具備防卡死超時與 Fallback 機制)
   */
  public async initPeer(customId?: string): Promise<string> {
    return new Promise((resolve) => {
      const prefix = 'lq-';
      const rand = Math.random().toString(36).substring(2, 6);
      const chosenId = customId || `${prefix}${rand}`;

      const PeerClass = getPeerConstructor();
      if (!PeerClass) {
        console.warn('PeerJS constructor not available, using offline fallback ID');
        this.myPeerId = chosenId;
        resolve(chosenId);
        return;
      }

      // 4 秒超時防線，確保任何網路或防火牆狀態下都不會卡死 UI
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.myPeerId = chosenId;
          resolve(chosenId);
        }
      }, 4000);

      try {
        this.peer = new PeerClass(chosenId, {
          debug: 1,
        });

        this.peer.on('open', (id: string) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.myPeerId = id;
            this.peerOpenHandlers.forEach((cb) => cb(id));
            resolve(id);
          }
        });

        this.peer.on('connection', (conn: DataConnection) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err: any) => {
          console.warn('PeerJS error:', err);
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.myPeerId = chosenId;
            resolve(chosenId);
          }
        });
      } catch (err) {
        console.warn('Failed to construct Peer:', err);
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.myPeerId = chosenId;
          resolve(chosenId);
        }
      }
    });
  }

  /**
   * 房主建立房間
   */
  public async createRoom(): Promise<string> {
    if (!this.peer || this.peer.destroyed) {
      await this.initPeer();
    }
    this.isHost = true;
    this.currentRoomId = this.myPeerId;
    return this.myPeerId;
  }

  /**
   * 隊友加入房間
   */
  public async joinRoom(roomId: string): Promise<boolean> {
    if (!this.peer || this.peer.destroyed) {
      await this.initPeer();
    }
    this.isHost = false;
    this.currentRoomId = roomId.trim().toLowerCase();

    return new Promise((resolve) => {
      try {
        if (!this.peer || typeof this.peer.connect !== 'function') {
          resolve(false);
          return;
        }

        const conn = this.peer.connect(this.currentRoomId, {
          reliable: true,
        });

        conn.on('open', () => {
          this.hostConnection = conn;
          resolve(true);
        });

        conn.on('data', (data: unknown) => {
          this.emitMessage(data as P2PMessage, conn.peer);
        });

        conn.on('close', () => {
          this.peerDisconnectHandlers.forEach((cb) => cb(conn.peer));
        });

        conn.on('error', (err: unknown) => {
          console.warn('Connect to host error:', err);
          resolve(false);
        });
      } catch (err) {
        console.warn('joinRoom error:', err);
        resolve(false);
      }
    });
  }

  /**
   * 監聽來自新 Client 的連線（Host 視角）
   */
  private handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.clientConnections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      this.emitMessage(data as P2PMessage, conn.peer);
    });

    conn.on('close', () => {
      this.clientConnections.delete(conn.peer);
      this.peerDisconnectHandlers.forEach((cb) => cb(conn.peer));
    });

    conn.on('error', (err) => {
      console.warn('Connection error with client:', err);
      this.clientConnections.delete(conn.peer);
    });
  }

  /**
   * 廣播訊息給房間內所有人
   */
  public broadcast(msg: P2PMessage) {
    if (this.isHost) {
      this.clientConnections.forEach((conn) => {
        if (conn.open) {
          conn.send(msg);
        }
      });
    } else {
      if (this.hostConnection && this.hostConnection.open) {
        this.hostConnection.send(msg);
      }
    }
  }

  /**
   * 房主向特定隊友發送訊息
   */
  public sendTo(peerId: string, msg: P2PMessage) {
    const conn = this.clientConnections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  public onMessage(handler: (msg: P2PMessage, senderId: string) => void) {
    this.messageHandlers.push(handler);
  }

  public onPeerOpen(handler: (id: string) => void) {
    this.peerOpenHandlers.push(handler);
  }

  public onPeerDisconnect(handler: (peerId: string) => void) {
    this.peerDisconnectHandlers.push(handler);
  }

  private emitMessage(msg: P2PMessage, senderId: string) {
    this.messageHandlers.forEach((handler) => handler(msg, senderId));
  }

  public destroy() {
    this.clientConnections.forEach((c) => c.close());
    this.clientConnections.clear();
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const network = new NetworkManager();
