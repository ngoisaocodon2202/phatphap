"use client";
import { useEffect, useRef } from "react";
import { Client, Room } from "colyseus.js";
import { useTempleStore } from "@/stores/templeStore";
import type { RemotePlayer, Lantern } from "@/stores/templeStore";

export function getColyseusEndpoint(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567";
  }

  // 1. URL search parameter: ?server=...
  const urlParam = new URLSearchParams(window.location.search).get("server");
  if (urlParam) {
    try {
      localStorage.setItem("sansa_colyseus_url", urlParam);
    } catch {}
    return urlParam;
  }

  // 2. Saved custom URL from localStorage
  try {
    const saved = localStorage.getItem("sansa_colyseus_url");
    if (saved) return saved;
  } catch {}

  // 3. Environment variable from build
  if (process.env.NEXT_PUBLIC_COLYSEUS_URL) {
    return process.env.NEXT_PUBLIC_COLYSEUS_URL;
  }

  // 4. Nếu mở qua mạng LAN Wi-Fi (ví dụ mở http://192.168.1.18:3000 trên điện thoại)
  const hostname = window.location.hostname;
  const isHttps = window.location.protocol === "https:";
  const wsProtocol = isHttps ? "wss:" : "ws:";

  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.includes("vercel.app")) {
    return `${wsProtocol}//${hostname}:2567`;
  }

  // 5. Mặc định
  return isHttps ? "wss://localhost:2567" : "ws://localhost:2567";
}

interface UseMultiplayerOptions {
  room: string;
  instance: string;
  region: string;
}

// Singleton client cache theo endpoint
let colyseusClient: Client | null = null;
let currentClientEndpoint = "";

function getClient(endpoint: string) {
  if (!colyseusClient || currentClientEndpoint !== endpoint) {
    colyseusClient = new Client(endpoint);
    currentClientEndpoint = endpoint;
  }
  return colyseusClient;
}

export function useMultiplayer({ room, instance, region }: UseMultiplayerOptions) {
  const roomRef = useRef<Room<any> | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let disposed = false;

    async function connect() {
      try {
        const endpoint = getColyseusEndpoint();
        const client = getClient(endpoint);
        const store = useTempleStore.getState();

        // Join or create room with instance sharding
        const joinedRoom: Room<any> = await client.joinOrCreate("temple", {
          roomId: room,
          instanceId: instance,
          region,
          username: store.localPlayer.username,
          avatarColor: store.localPlayer.avatarColor,
        });

        if (disposed) {
          joinedRoom.leave();
          return;
        }

        roomRef.current = joinedRoom;
        setActiveRoom(joinedRoom);
        const st = useTempleStore.getState();
        st.setConnected(true);
        st.setSessionId(joinedRoom.sessionId);
        st.setRoomId(joinedRoom.id);

        // ── State listeners ──────────────────────────────────────────────
        joinedRoom.state.players.onAdd((_player: any, sessionId: string) => {
          if (sessionId === joinedRoom.sessionId) return;
          syncPlayers(joinedRoom);
        });

        joinedRoom.state.players.onRemove((_: any, sessionId: string) => {
          if (sessionId === joinedRoom.sessionId) return;
          const currentStore = useTempleStore.getState();
          const map = new Map(currentStore.remotePlayers);
          map.delete(sessionId);
          currentStore.setRemotePlayers(map);
          currentStore.updateServerOnlineCount(currentStore.currentServerId, map.size + 1);
        });

        joinedRoom.state.players.onChange((_player: any, sessionId: string) => {
          if (sessionId === joinedRoom.sessionId) return;
          syncPlayers(joinedRoom);
        });

        joinedRoom.state.lanterns.onAdd(() => {
          syncLanterns(joinedRoom);
        });

        joinedRoom.state.lanterns.onRemove(() => {
          syncLanterns(joinedRoom);
        });

        // Bell event
        joinedRoom.onMessage(
          "bellRing",
          (data: { strikerId: string; timestamp: number }) => {
            const players = joinedRoom.state.players as Map<string, any>;
            const striker = players.get(data.strikerId);
            useTempleStore
              .getState()
              .setBellRinging(true, striker?.username ?? "Một đồng đạo");
            setTimeout(
              () => useTempleStore.getState().setBellRinging(false),
              3500
            );
          }
        );

        // ── Ping measurement ─────────────────────────────────────────────
        pingIntervalRef.current = setInterval(() => {
          const t = Date.now();
          joinedRoom.send("ping", { t });
        }, 5000);

        joinedRoom.onMessage("pong", (data: { t: number }) => {
          useTempleStore.getState().setPing(Date.now() - data.t);
        });

        joinedRoom.onLeave(() => {
          if (!disposed) useTempleStore.getState().setConnected(false);
        });

        joinedRoom.onError((code, message) => {
          console.error(`[Colyseus] Error ${code}: ${message}`);
        });
      } catch (err) {
        console.warn("[Multiplayer] Connection failed (running in single-player offline mode):", err);
        if (!disposed) {
          useTempleStore.getState().setConnected(false);
          setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      setActiveRoom(null);
      roomRef.current?.leave();
      roomRef.current = null;
      useTempleStore.getState().setConnected(false);
    };
  }, [room, instance, region]);

  return roomRef;
}

export function useRoomRef() {
  return useTempleStore.getState();
}

function syncPlayers(room: Room<any>) {
  const map = new Map<string, RemotePlayer>();
  const myId = room.sessionId;

  (room.state.players as any).forEach((p: any, sid: string) => {
    if (sid === myId) return;
    map.set(sid, {
      sessionId: sid,
      username: p.username,
      avatarColor: p.avatarColor,
      gender: p.gender === "female" ? "female" : "male",
      x: p.x,
      y: p.y,
      z: p.z,
      rotY: p.rotY,
      action: p.action,
      isMeditating: p.isMeditating,
    });
  });

  const store = useTempleStore.getState();
  store.setRemotePlayers(map);
  store.updateServerOnlineCount(store.currentServerId, map.size + 1);
}

function syncLanterns(room: Room<any>) {
  const arr: Lantern[] = [];
  (room.state.lanterns as any).forEach((l: any) => {
    arr.push({
      id: l.id,
      wish: l.wish,
      authorId: l.authorId,
      x: l.x,
      y: l.y,
      z: l.z,
      color: l.color,
      createdAt: l.createdAt,
    });
  });
  useTempleStore.getState().setLanterns(arr);
}

let _activeRoom: Room<any> | null = null;
export function setActiveRoom(room: Room<any> | null) {
  _activeRoom = room;
}
export function sendRoomMessage(type: string, data?: any) {
  _activeRoom?.send(type, data);
}
