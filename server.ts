import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// In-memory signaling registry for peer-to-peer walkie talkie channels
interface RadioPeer {
  id: string;
  name: string;
  res: Response;
  lastSeen: number;
}

const channels = new Map<string, Map<string, RadioPeer>>();

// Server-Sent Events (SSE) for zero-latency peer discovery and signaling
app.get('/api/radio/events', (req: Request, res: Response) => {
  const channelId = (req.query.channel as string) || '1';
  const peerId = (req.query.peerId as string) || `peer_${Date.now()}`;
  const peerName = (req.query.name as string) || 'Rádio Remoto';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!channels.has(channelId)) {
    channels.set(channelId, new Map());
  }

  const room = channels.get(channelId)!;
  room.set(peerId, { id: peerId, name: peerName, res, lastSeen: Date.now() });

  // Broadcast peer join to everyone in room
  const peersList = Array.from(room.values())
    .filter((p) => p.id !== peerId)
    .map((p) => ({ id: p.id, name: p.name }));

  // Send current peers to new peer
  res.write(`data: ${JSON.stringify({ type: 'PEERS_LIST', peers: peersList })}\n\n`);

  // Notify existing peers
  room.forEach((peer) => {
    if (peer.id !== peerId) {
      peer.res.write(
        `data: ${JSON.stringify({
          type: 'PEER_JOINED',
          peer: { id: peerId, name: peerName },
        })}\n\n`
      );
    }
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    room.delete(peerId);
    room.forEach((peer) => {
      try {
        peer.res.write(
          `data: ${JSON.stringify({
            type: 'PEER_LEFT',
            peerId,
          })}\n\n`
        );
      } catch {
        // Ignore
      }
    });
    if (room.size === 0) {
      channels.delete(channelId);
    }
  });
});

// Relay WebRTC SDP / ICE signals / PTT states
app.post('/api/radio/signal', (req: Request, res: Response) => {
  const { channelId, fromPeerId, toPeerId, message } = req.body;
  if (!channelId || !fromPeerId || !message) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const room = channels.get(String(channelId));
  if (!room) {
    res.json({ delivered: false, note: 'Channel not active' });
    return;
  }

  if (toPeerId) {
    // Direct signal to specific peer
    const targetPeer = room.get(toPeerId);
    if (targetPeer) {
      targetPeer.res.write(
        `data: ${JSON.stringify({
          type: 'SIGNAL',
          fromPeerId,
          message,
        })}\n\n`
      );
    }
  } else {
    // Broadcast signal to all peers in channel
    room.forEach((peer) => {
      if (peer.id !== fromPeerId) {
        peer.res.write(
          `data: ${JSON.stringify({
            type: 'SIGNAL',
            fromPeerId,
            message,
          })}\n\n`
        );
      }
    });
  }

  res.json({ delivered: true });
});

// Fast audio transmission relay (Slide2Talk / Talkie voice packet relay)
app.post('/api/radio/broadcast-voice', (req: Request, res: Response) => {
  const { channelId, senderId, senderName, audioBase64, durationMs } = req.body;
  if (!channelId || !audioBase64) {
    res.status(400).json({ error: 'Missing voice data' });
    return;
  }

  const room = channels.get(String(channelId));
  if (room) {
    room.forEach((peer) => {
      if (peer.id !== senderId) {
        peer.res.write(
          `data: ${JSON.stringify({
            type: 'INCOMING_VOICE',
            senderId,
            senderName,
            channelId,
            durationMs,
            audioBase64,
            timestamp: Date.now(),
          })}\n\n`
        );
      }
    });
  }

  res.json({ success: true });
});

// PTT Realtime State (Transmitting indicator / Call Alert)
app.post('/api/radio/ptt-state', (req: Request, res: Response) => {
  const { channelId, senderId, senderName, isTransmitting, callAlert } = req.body;
  const room = channels.get(String(channelId));
  if (room) {
    room.forEach((peer) => {
      if (peer.id !== senderId) {
        peer.res.write(
          `data: ${JSON.stringify({
            type: 'PTT_STATE',
            senderId,
            senderName,
            isTransmitting,
            callAlert,
          })}\n\n`
        );
      }
    });
  }
  res.json({ ok: true });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Walkie-Talkie Radio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
