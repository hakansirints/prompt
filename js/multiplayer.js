// Veritabanısız WebRTC (PeerJS) çok oyunculu oda yöneticisi
// GitHub Pages üzerinde tamamen statik olarak farklı cihazlar arasında çalışır.

const PEER_PREFIX = 'isimsehir-oyun-2026-';

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class RoomNetwork {
  constructor(handlers) {
    this.handlers = handlers; // { onStatus, onMessage, onPeerLeft, onError }
    this.peer = null;
    this.role = 'offline'; // 'host' | 'guest' | 'offline'
    this.roomCode = '';
    this.connections = new Map(); // host: peerId -> DataConnection
    this.hostConn = null; // guest -> host DataConnection
  }

  destroy() {
    this.connections.forEach(conn => {
      try { conn.close(); } catch (_) {}
    });
    this.connections.clear();
    if (this.hostConn) {
      try { this.hostConn.close(); } catch (_) {}
      this.hostConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.role = 'offline';
    this.roomCode = '';
  }

  isPeerJsLoaded() {
    return typeof window.Peer === 'function';
  }

  hostRoom(code) {
    this.destroy();
    this.roomCode = code.toUpperCase();
    if (!this.isPeerJsLoaded()) {
      this.role = 'offline';
      this.handlers.onStatus?.('offline', 'Yerel mod (PeerJS yüklenemedi, botlarla oynayabilirsin)');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.handlers.onStatus?.('connecting', 'Oda açılıyor...');
      const peerId = `${PEER_PREFIX}${this.roomCode}`;
      const peer = new window.Peer(peerId, { debug: 0 });
      this.peer = peer;

      const timeout = setTimeout(() => {
        if (this.role !== 'host') {
          this.handlers.onStatus?.('offline', 'Bağlantı zaman aşımı — yerel mod aktif');
          resolve(false);
        }
      }, 6500);

      peer.on('open', () => {
        clearTimeout(timeout);
        this.role = 'host';
        this.handlers.onStatus?.('host', `Oda ${this.roomCode} açık · Arkadaşların bağlanabilir!`);
        resolve(true);
      });

      peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });
        conn.on('data', (data) => {
          this.handlers.onMessage?.(data, conn.peer);
        });
        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.handlers.onPeerLeft?.(conn.peer);
        });
      });

      peer.on('error', (err) => {
        clearTimeout(timeout);
        this.handlers.onError?.(err?.type || 'bağlantı hatası');
        resolve(false);
      });
    });
  }

  joinRoom(code, helloPayload) {
    this.destroy();
    this.roomCode = code.trim().toUpperCase();
    if (!this.isPeerJsLoaded()) {
      this.handlers.onError?.('PeerJS yüklenemedi, internet bağlantını kontrol et.');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.handlers.onStatus?.('connecting', `${this.roomCode} odasına bağlanılıyor...`);
      const peer = new window.Peer({ debug: 0 });
      this.peer = peer;

      const timeout = setTimeout(() => {
        if (this.role !== 'guest') {
          this.handlers.onError?.('Odaya ulaşılamadı. Oda kodunu kontrol et.');
          this.destroy();
          resolve(false);
        }
      }, 7500);

      peer.on('open', () => {
        const conn = peer.connect(`${PEER_PREFIX}${this.roomCode}`, { reliable: true });
        this.hostConn = conn;

        conn.on('open', () => {
          clearTimeout(timeout);
          this.role = 'guest';
          this.handlers.onStatus?.('guest', `${this.roomCode} odasına bağlandın!`);
          conn.send({ type: 'hello', ...helloPayload });
          resolve(true);
        });

        conn.on('data', (data) => {
          this.handlers.onMessage?.(data, 'host');
        });

        conn.on('close', () => {
          this.handlers.onError?.('Oda kurucusu ayrıldı.');
          this.destroy();
        });
      });

      peer.on('error', () => {
        clearTimeout(timeout);
        this.handlers.onError?.('Oda bulunamadı. Kodun doğru olduğundan emin ol.');
        resolve(false);
      });
    });
  }

  broadcast(message) {
    if (this.role === 'host') {
      this.connections.forEach((conn) => {
        if (conn.open) conn.send(message);
      });
    } else if (this.role === 'guest' && this.hostConn?.open) {
      this.hostConn.send(message);
    }
  }

  sendTo(peerId, message) {
    const conn = this.connections.get(peerId);
    if (conn?.open) conn.send(message);
  }
}
