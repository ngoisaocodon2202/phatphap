"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";
import type { RemotePlayer } from "@/stores/templeStore";
import { LittleMonkAvatar } from "./Avatar";

const lerpTargets = new Map<string, { x: number; y: number; z: number; rotY: number }>();

function RemotePlayerMesh({ player }: { player: RemotePlayer }) {
  const groupRef = useRef<THREE.Group>(null);

  if (!lerpTargets.has(player.sessionId)) {
    lerpTargets.set(player.sessionId, {
      x: player.x,
      y: player.y,
      z: player.z,
      rotY: player.rotY,
    });
  }

  const target = lerpTargets.get(player.sessionId)!;
  target.x    = player.x;
  target.y    = player.y;
  target.z    = player.z;
  target.rotY = player.rotY;

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const lerpFactor = 1 - Math.pow(0.001, dt);

    g.position.x = THREE.MathUtils.lerp(g.position.x, target.x,    lerpFactor);
    g.position.y = THREE.MathUtils.lerp(g.position.y, target.y,    lerpFactor);
    g.position.z = THREE.MathUtils.lerp(g.position.z, target.z,    lerpFactor);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target.rotY, lerpFactor);
  });

  const isSitting = player.action === "sit" || player.isMeditating;

  return (
    <group ref={groupRef} position={[player.x, player.y, player.z]}>
      <LittleMonkAvatar
        color={player.avatarColor}
        gender={player.gender}
        action={player.action}
        isMeditating={player.isMeditating}
      />

      <Html
        position={[0, isSitting ? 0.78 : 0.92, 0]}
        center
        distanceFactor={7.5}
        sprite
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "linear-gradient(180deg, rgba(40, 20, 12, 0.85), rgba(22, 10, 6, 0.9))",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(217, 164, 65, 0.55)",
            color: "#F6D58A",
            padding: "3px 12px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 500,
            fontFamily: "system-ui, -apple-system, sans-serif",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            userSelect: "none",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "999px",
              background: "#4ADE80",
              boxShadow: "0 0 6px #4ADE80",
            }}
          />
          <span>
            {isSitting
              ? `Tọa thiền · ${player.username}`
              : player.action === "bow"
              ? `Lạy Phật · ${player.username}`
              : player.username}
          </span>
        </div>
      </Html>
    </group>
  );
}

export function RemotePlayers() {
  const remotePlayers = useTempleStore((s) => s.remotePlayers);
  const sessionId = useTempleStore((s) => s.sessionId);

  return (
    <group>
      {Array.from(remotePlayers.values())
        .filter((p) => p.sessionId !== sessionId)
        .map((player) => (
          <RemotePlayerMesh key={player.sessionId} player={player} />
        ))}
    </group>
  );
}
