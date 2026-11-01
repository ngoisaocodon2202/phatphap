"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  KeyboardControls,
} from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { Environment } from "./Environment";
import { TempleGeometry } from "./TempleGeometry";
import { Particles } from "./Particles";
import { LocalPlayer } from "../player/LocalPlayer";
import { RemotePlayers } from "../player/RemotePlayers";
import { IncenseBurner } from "../interactions/IncenseBurner";
import { SacredBell } from "../interactions/SacredBell";
import { FloatingLanterns } from "../interactions/FloatingLanterns";
import { SpatialAudio } from "../audio/SpatialAudio";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useTempleStore } from "@/stores/templeStore";

const KEY_MAP = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "interact", keys: ["KeyE"] },
];

interface TempleSceneProps {
  room: string;
  instance: string;
  region: string;
}

export function TempleScene({ room, instance, region }: TempleSceneProps) {
  const currentServerId = useTempleStore((s) => s.currentServerId);
  const activeRoomId = currentServerId || room;
  useMultiplayer({ room: activeRoomId, instance, region });
  const qualityPreset = useTempleStore((s) => s.qualityPreset);

  const dprRange: [number, number] =
    qualityPreset === "low"
      ? [0.75, 1]
      : qualityPreset === "medium"
      ? [1, 1.2]
      : [1, 1.35];

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        shadows={qualityPreset !== "low"}
        camera={{ fov: 56, near: 0.1, far: 180, position: [0, 1.85, 5.2] }}
        gl={{
          antialias: qualityPreset !== "low",
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        dpr={dprRange}
        style={{ background: "#1B0D09" }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <SpatialAudio />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} timeStep="vary">
            <Environment />
            <TempleGeometry />
            <Particles />
            <LocalPlayer />
            <RemotePlayers />
            {/* Lư hương đồng lớn trước Phật đài: bước tới để thắp một nén nhang */}
            <IncenseBurner />
            {/* Đại Hồng Chung đặt trang nghiêm tại hành lang bên phải của Chánh Điện rộng */}
            <SacredBell position={[9.25, 0, -1.65]} />
            {/* Hoa đăng sen thả trôi trên 2 hồ sen hai bên Chánh Điện */}
            <FloatingLanterns />
          </Physics>
        </Suspense>

        <Preload all />
      </Canvas>
    </KeyboardControls>
  );
}
