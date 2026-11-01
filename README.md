# SansaTemple 🏯

> A browser-based, multiplayer 3D digital temple / virtual gathering experience.
> Built with React Three Fiber, Colyseus, Rapier Physics, and Three.js post-processing.

---

## Quick Start

### Prerequisites
- Node.js v18+
- pnpm v8+

### 1. Install dependencies

```bash
npm install -g pnpm
pnpm install
```

### 2. Start development (client + server)

```bash
# Terminal 1 — Game server (port 2567)
cd apps/server
pnpm dev

# Terminal 2 — Next.js client (port 3000)
cd apps/client
pnpm dev
```

Then open: **http://localhost:3000**

### 3. Join a specific room via URL

```
http://localhost:3000?room=zen-garden&instance=1&region=local
http://localhost:3000?room=main-hall&instance=2&region=local
```

---

## Room URL Parameters

| Parameter  | Description                    | Default      |
|------------|--------------------------------|--------------|
| `room`     | Room name/slug                 | `main-hall`  |
| `instance` | Sub-shard (max 50/instance)    | `1`          |
| `region`   | Server region for routing      | `us-east-1`  |

---

## Architecture

```
apps/
├── client/          Next.js 14 + React Three Fiber frontend
│   ├── app/         App Router pages
│   ├── components/  3D scene, player, interactions, UI
│   ├── hooks/       useMultiplayer, usePlayerController
│   └── stores/      Zustand global state
└── server/          Colyseus game server
    └── src/
        ├── rooms/   TempleRoom + Schema
        └── systems/ WishPersistence (Redis)
```

## Controls

| Key / Input          | Action              |
|----------------------|---------------------|
| WASD / Arrow keys    | Move                |
| Shift                | Sprint              |
| Space                | Jump                |
| Right-click + drag   | Rotate camera       |
| E (near altar)       | Open prayer modal   |
| E (near bell)        | Strike the bell     |
| Walk into rune circle| Enter meditation    |

---

## Interactive Features

- **🏮 Prayer Altar** — Submit a wish; spawns a glowing floating lantern visible to all players
- **🔔 Sacred Bell** — Strike to broadcast a synchronized ripple visual + sound (5s cooldown)
- **🧘 Meditation Zones** — Enter rune circles to trigger cinematic camera drift + meditation aura

---

## Production Deployment

### Docker Compose (full stack)
```bash
docker-compose up --build
```

### Environment Variables

**Client (`apps/client/.env.local`):**
```
NEXT_PUBLIC_COLYSEUS_URL=wss://your-game-server.com
```

**Server:**
```
PORT=2567
REDIS_URL=redis://your-redis:6379
NODE_ENV=production
```

---

## Performance Notes

- **LOD**: R3F `<AdaptiveDpr>` automatically scales pixel ratio on low-FPS devices
- **Instancing**: Multiple repeated geometries use instanced meshes
- **Network**: Binary msgpack delta compression at 15 Hz (< 200 bytes/tick)
- **Asset budget**: Targets < 3s load on 10 Mbps with DRACO GLTF + KTX2 textures
- **Physics**: Rapier WASM runs in a web worker thread

## Tech Stack

| Layer        | Tech                           |
|-------------|--------------------------------|
| Frontend     | Next.js 14, React 18           |
| 3D Engine    | Three.js via React Three Fiber |
| Physics      | @react-three/rapier (Rapier)   |
| Post-FX      | @react-three/postprocessing    |
| Multiplayer  | Colyseus (WebSocket)           |
| State        | Zustand                        |
| Audio        | Howler.js                      |
| Server       | Node.js + Colyseus             |
| Persistence  | Redis (ioredis)                |
| Styling      | Tailwind CSS                   |

