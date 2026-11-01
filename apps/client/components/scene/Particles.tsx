"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
}

function createSoftCircleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.35, "rgba(255, 244, 210, 0.8)");
  grad.addColorStop(0.7, "rgba(255, 220, 140, 0.25)");
  grad.addColorStop(1, "rgba(255, 220, 140, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createLotusPetalSpriteTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);

  ctx.save();
  ctx.translate(32, 32);
  ctx.rotate(-0.35);
  const grad = ctx.createLinearGradient(0, -22, 0, 22);
  grad.addColorStop(0, "rgba(253, 224, 238, 0.95)");
  grad.addColorStop(0.55, "rgba(244, 114, 182, 0.85)");
  grad.addColorStop(1, "rgba(190, 24, 93, 0.2)");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(16, -12, 18, 10, 0, 22);
  ctx.bezierCurveTo(-18, 10, -16, -12, 0, -22);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function ParticleSystem({
  count,
  color,
  size,
  spreadX,
  spreadZ,
  riseSpeed,
  originY,
  center = [0, 0, 0],
  map,
  additive = true,
  opacity = 0.72,
}: {
  count: number;
  color: string;
  size: number;
  spreadX: number;
  spreadZ: number;
  riseSpeed: number;
  originY: number;
  center?: [number, number, number];
  map?: THREE.Texture | null;
  additive?: boolean;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Points>(null);

  const data = useMemo<ParticleData>(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = center[0] + (Math.random() - 0.5) * spreadX;
      positions[i3 + 1] = originY + Math.random() * 3.8;
      positions[i3 + 2] = center[2] + (Math.random() - 0.5) * spreadZ;
      velocities[i3] = (Math.random() - 0.5) * 0.14;
      velocities[i3 + 1] = riseSpeed + (Math.random() - 0.3) * 0.12;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.14;
      lifetimes[i] = Math.random() * 6;
      maxLifetimes[i] = 4.5 + Math.random() * 4;
    }
    return { positions, velocities, lifetimes, maxLifetimes };
  }, [count, spreadX, spreadZ, riseSpeed, originY, center]);

  useFrame((state, dt) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      data.lifetimes[i] += dt;

      if (data.lifetimes[i] > data.maxLifetimes[i]) {
        pos[i3] = center[0] + (Math.random() - 0.5) * spreadX;
        pos[i3 + 1] = originY + Math.random() * 0.6;
        pos[i3 + 2] = center[2] + (Math.random() - 0.5) * spreadZ;
        data.lifetimes[i] = 0;
      } else {
        pos[i3] += data.velocities[i3] * dt + Math.sin(t * 0.8 + i) * 0.0018;
        pos[i3 + 1] += data.velocities[i3 + 1] * dt;
        pos[i3 + 2] += data.velocities[i3 + 2] * dt + Math.cos(t * 0.6 + i) * 0.0012;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions.slice(), 3));
    return geo;
  }, [data.positions]);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        map={map ?? undefined}
        size={size}
        transparent
        opacity={opacity}
        alphaTest={0.02}
        sizeAttenuation
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

export function Particles() {
  const qualityPreset = useTempleStore((s) => s.qualityPreset);
  const circleTex = useMemo(() => createSoftCircleTexture(), []);
  const petalTex = useMemo(() => createLotusPetalSpriteTexture(), []);

  const multiplier = qualityPreset === "low" ? 0.35 : qualityPreset === "medium" ? 0.7 : 1;

  return (
    <group>
      {/* Hạt bụi vàng ấm (Warm Golden Light Motes) bay nhẹ trong Chánh Điện */}
      <ParticleSystem
        count={Math.round(90 * multiplier)}
        color="#F6D58A"
        size={0.09}
        spreadX={10}
        spreadZ={9}
        riseSpeed={0.12}
        originY={0.4}
        center={[0, 0, -0.8]}
        map={circleTex}
        additive={true}
        opacity={0.78}
      />

      {/* Cánh hoa sen hồng nhẹ nhàng bay từ hai bên hiên chùa */}
      <ParticleSystem
        count={Math.round(42 * multiplier)}
        color="#F9A8D4"
        size={0.16}
        spreadX={12}
        spreadZ={8}
        riseSpeed={-0.08}
        originY={3.2}
        center={[0, 0, -0.5]}
        map={petalTex}
        additive={false}
        opacity={0.85}
      />
    </group>
  );
}
