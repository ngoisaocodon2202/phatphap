"use client";
import { useEffect, useRef } from "react";
import { Client, Room } from "colyseus.js";
import { useTempleStore } from "@/stores/templeStore";
import type { RemotePlayer, Lantern } from "@/stores/templeStore";

const SERVER_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";

interface UseMultiplayerOptions {
  room: string;
  instance: string;
  region: string;
}

// Singleton client
let colyseusClient: Client | null = null;
function getClient() {
  if (!colyseusClient) colyseusClient = new Client(SERVER_URL);
  return colyseusClient;
}

export function useMultiplayer({ room, instance, region }: UseMultiplayerOptions) {
  const roomRef = useRef<Room<any> | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let disposed = false;

    async function connect() {
      try {
        const client = getClient();
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
        });

        joinedRoom.state.players.onChange((_player: any, sessionId: string) => {
          // Bỏ qua cập nhật của chính local player để không gây re-render liên tục
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
        console.error("[Multiplayer] Connection failed:", err);
        if (!disposed) setTimeout(connect, 3000);
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

  useTempleStore.getState().setRemotePlayers(map);
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
