import { Room, Client } from "colyseus";
import { TempleState, PlayerState, LanternState, BellState } from "./TempleSchema";
import { randomUUID } from "crypto";

// Message type constants
const MSG = {
  PLAYER_UPDATE:   "playerUpdate",
  ALTAR_INTERACT:  "altarInteract",
  BELL_STRIKE:     "bellStrike",
  MEDITATION_START:"meditationStart",
  MEDITATION_END:  "meditationEnd",
  PING:            "ping",
  PONG:            "pong",
} as const;

const BELL_COOLDOWN_MS   = 5000;
const MAX_LANTERNS       = 50;
const LANTERN_LIFETIME   = 120_000; // 2 minutes

export class TempleRoom extends Room<TempleState> {
  maxClients = 100; // Tối đa đúng 100 Phật tử tương ứng 100 bồ đoàn Chánh Điện
  private lanternTimers = new Map<string, NodeJS.Timeout>();

  onAuth(_client: Client, _options: any) {
    // Chặn người thứ 101 bước vào Chánh Điện nếu đã đủ 100 người
    if (this.clients.length >= this.maxClients) {
      throw new Error("Chánh Điện đã đủ tối đa 100 Phật tử. Không thể tiếp nhận thêm người thứ 101!");
    }
    return true;
  }

  onCreate(options: { roomId?: string; region?: string }) {
    this.setState(new TempleState());
    this.state.roomId = options.roomId ?? "default";
    this.state.region = options.region ?? "us-east-1";

    this.setPatchRate(1000 / 15); // 15 Hz state sync

    this.onMessage(MSG.PLAYER_UPDATE, (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.x      = this.clamp(data.x,   -100, 100);
      player.y      = this.clamp(data.y,   -5,   20);
      player.z      = this.clamp(data.z,   -100, 100);
      player.rotY   = data.rotY ?? 0;
      player.action = data.action ?? "idle";
    });

    this.onMessage(MSG.ALTAR_INTERACT, (client, data: { wish: string; color?: string }) => {
      if (!data.wish || data.wish.trim().length === 0) return;
      if (data.wish.length > 280) return; // Twitter-style limit

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Trim old lanterns
      while (this.state.lanterns.length >= MAX_LANTERNS) {
        const oldest = this.state.lanterns[0];
        if (!oldest) break;
        const existingTimer = this.lanternTimers.get(oldest.id);
        if (existingTimer) clearTimeout(existingTimer);
        this.lanternTimers.delete(oldest.id);
        this.state.lanterns.splice(0, 1);
      }

      const lantern     = new LanternState();
      lantern.id        = randomUUID();
      lantern.wish      = data.wish.trim();
      lantern.authorId  = client.sessionId;
      lantern.x         = player.x + (Math.random() - 0.5) * 4;
      lantern.y         = 5;
      lantern.z         = player.z + (Math.random() - 0.5) * 4;
      lantern.color     = data.color ?? "#fbbf24";
      lantern.createdAt = Date.now();

      this.state.lanterns.push(lantern);

      // Auto-expire lantern
      const timer = setTimeout(() => {
        const idx = this.state.lanterns.findIndex(l => l.id === lantern.id);
        if (idx !== -1) this.state.lanterns.splice(idx, 1);
        this.lanternTimers.delete(lantern.id);
      }, LANTERN_LIFETIME);
      this.lanternTimers.set(lantern.id, timer);
    });

    this.onMessage(MSG.BELL_STRIKE, (client) => {
      const now = Date.now();
      if (now - this.state.bell.lastStrikeAt < BELL_COOLDOWN_MS) return;

      this.state.bell.isRinging    = true;
      this.state.bell.lastStrikeBy = client.sessionId;
      this.state.bell.lastStrikeAt = now;

      // Broadcast immediate bell event for audio sync
      this.broadcast("bellRing", { strikerId: client.sessionId, timestamp: now });

      setTimeout(() => { this.state.bell.isRinging = false; }, 3000);
    });

    this.onMessage(MSG.MEDITATION_START, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) { player.isMeditating = true; player.action = "meditate"; }
    });

    this.onMessage(MSG.MEDITATION_END, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) { player.isMeditating = false; player.action = "idle"; }
    });

    this.onMessage(MSG.PING, (client, data) => {
      client.send(MSG.PONG, { t: data.t });
    });

    console.log(`[TempleRoom] Created: ${this.roomId} | region: ${this.state.region}`);
  }

  onJoin(client: Client, options: { username?: string; avatarColor?: string }) {
    const player          = new PlayerState();
    player.sessionId      = client.sessionId;
    player.username       = options.username   ?? `Đồng đạo_${client.sessionId.slice(0, 4)}`;
    player.avatarColor    = options.avatarColor ?? this.randomColor();
    // Spawn in a circle around the altar
    const angle           = Math.random() * Math.PI * 2;
    player.x              = Math.cos(angle) * 6;
    player.y              = 0.1;
    player.z              = Math.sin(angle) * 6;

    this.state.players.set(client.sessionId, player);
    console.log(`[TempleRoom] ${player.username} joined (${this.clients.length}/${this.maxClients})`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`[TempleRoom] ${client.sessionId} left`);
  }

  onDispose() {
    // Clean up all lantern timers
    for (const t of this.lanternTimers.values()) clearTimeout(t);
    console.log(`[TempleRoom] Disposed: ${this.roomId}`);
  }

  private clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val ?? 0, min), max);
  }

  private randomColor() {
    const colors = ["#a78bfa","#f472b6","#34d399","#60a5fa","#fb923c","#facc15"];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
