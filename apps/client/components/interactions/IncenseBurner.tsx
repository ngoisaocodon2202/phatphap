"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useKeyboardControls } from "@react-three/drei";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import * as THREE from "three";
import {
  useTempleStore,
  INCENSE_BURNER_POS,
  INCENSE_BURN_MS,
  IncenseStick,
} from "@/stores/templeStore";

const ASH_Y = 0.78; // Mặt tro hương trong lư (tọa độ cục bộ)
const STICK_FULL_LENGTH = 0.62;

let cachedSmokeTex: THREE.CanvasTexture | null = null;
function getSmokeTexture(): THREE.CanvasTexture | null {
  if (cachedSmokeTex) return cachedSmokeTex;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 250, 240, 0.7)");
  grad.addColorStop(0.5, "rgba(235, 228, 218, 0.3)");
  grad.addColorStop(1, "rgba(235, 228, 218, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  cachedSmokeTex = new THREE.CanvasTexture(canvas);
  return cachedSmokeTex;
}

// Vị trí cắm của từng nén hương trên mặt tro (xếp xoắn ốc để các nén không chạm nhau)
function slotOffset(slot: number): [number, number] {
  const a = slot * 2.399963;
  const r = 0.05 + 0.06 * Math.sqrt(slot);
  return [Math.cos(a) * r, Math.sin(a) * r];
}

// Làn khói hương mảnh bay lên từ đầu nén hương đang cháy
function StickSmoke() {
  const count = 16;
  const height = 0.95;
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => getSmokeTexture(), []);

  const [geo, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] = (i / count) * height;
      spd[i] = 0.2 + Math.random() * 0.1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return [g, spd] as const;
  }, []);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      arr[k + 1] += speeds[i] * dt;
      const h = arr[k + 1];
      arr[k] = Math.sin(t * 1.3 + h * 4.2 + i) * (0.012 + h * 0.05);
      arr[k + 2] = Math.cos(t * 1.1 + h * 3.4 + i * 1.7) * (0.012 + h * 0.04);
      if (h > height) arr[k + 1] = 0;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        map={tex ?? undefined}
        color="#F3EDE3"
        size={0.2}
        transparent
        opacity={0.42}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// Một nén hương đang cháy: thân hương ngắn dần, đầu hương đỏ rực kèm khói
function BurningStick({ stick }: { stick: IncenseStick }) {
  const stickMeshRef = useRef<THREE.Mesh>(null);
  const tipGroupRef = useRef<THREE.Group>(null);
  const emberMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const emberRef = useRef<THREE.Mesh>(null);

  const [ox, oz] = useMemo(() => slotOffset(stick.slot), [stick.slot]);
  const tiltX = ((stick.id % 7) - 3) * 0.02;
  const tiltZ = ((stick.id % 11) - 5) * 0.016;

  useFrame(({ clock }) => {
    const age = Date.now() - stick.litAt;
    const p = Math.min(1, Math.max(0, age / INCENSE_BURN_MS));
    const length = STICK_FULL_LENGTH * (1 - 0.82 * p);

    if (stickMeshRef.current) {
      stickMeshRef.current.scale.y = length;
      stickMeshRef.current.position.y = length / 2;
    }
    if (tipGroupRef.current) tipGroupRef.current.position.y = length;

    // Lúc mới châm lửa đầu hương bùng sáng rồi dịu dần
    const flare = Math.max(0, 1 - age / 900);
    if (emberMatRef.current) {
      emberMatRef.current.emissiveIntensity =
        1.9 + Math.sin(clock.elapsedTime * 3.2 + stick.id) * 0.45 + flare * 2.2;
    }
    if (emberRef.current) emberRef.current.scale.setScalar(1 + flare * 0.9);
  });

  return (
    <group position={[ox, ASH_Y - 0.05, oz]} rotation={[tiltZ, 0, tiltX]}>
      {/* Thân nén hương: tăm hương nâu đỏ truyền thống */}
      <mesh ref={stickMeshRef} position={[0, STICK_FULL_LENGTH / 2, 0]}>
        <cylinderGeometry args={[0.011, 0.013, 1, 6]} />
        <meshStandardMaterial color="#8E3B22" roughness={0.8} />
      </mesh>
      {/* Đầu hương cháy đỏ rực + khói */}
      <group ref={tipGroupRef} position={[0, STICK_FULL_LENGTH, 0]}>
        <mesh ref={emberRef}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial
            ref={emberMatRef}
            color="#FF6A1F"
            emissive="#FF4A0F"
            emissiveIntensity={2}
            roughness={0.4}
          />
        </mesh>
        <StickSmoke />
      </group>
    </group>
  );
}

// ── LƯ HƯƠNG ĐỒNG LỚN TRƯỚC PHẬT ĐÀI: BƯỚC TỚI & THẮP NÉN NHANG ──
export function IncenseBurner() {
  const sticks = useTempleStore((s) => s.incenseSticks);
  const pruneIncense = useTempleStore((s) => s.pruneIncense);
  const [nearby, setNearby] = useState(false);
  const [, getKeys] = useKeyboardControls();
  const prevInteract = useRef(false);

  // Thân lư hương tiện tròn (đỉnh đồng tam túc): đáy thu nhỏ - bụng phình - miệng loe
  const bodyGeo = useMemo(() => {
    const pts = [
      [0.0, 0.22],
      [0.26, 0.22],
      [0.38, 0.3],
      [0.45, 0.44],
      [0.46, 0.55],
      [0.42, 0.68],
      [0.37, 0.76],
      [0.4, 0.8],
      [0.44, 0.84],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  // Dọn các nén hương đã cháy hết
  useEffect(() => {
    const t = setInterval(() => pruneIncense(), 1500);
    return () => clearInterval(t);
  }, [pruneIncense]);

  const activate = () => useTempleStore.getState().startWalkToIncenseBurner();

  useFrame(() => {
    const { localPlayerPos, localAction, navigationTarget } =
      useTempleStore.getState();
    const dist = Math.hypot(
      localPlayerPos.x - INCENSE_BURNER_POS.x,
      localPlayerPos.z - INCENSE_BURNER_POS.z
    );
    const isNearby =
      dist < 3.4 &&
      !navigationTarget &&
      localAction !== "bow" &&
      localAction !== "sit";
    if (isNearby !== nearby) setNearby(isNearby);

    const { interact } = getKeys() as Record<string, boolean>;
    if (interact && !prevInteract.current && isNearby) activate();
    prevInteract.current = interact;
  });

  const lightIntensity = sticks.length > 0 ? Math.min(6, 1.4 + sticks.length * 0.6) : 0;

  return (
    <group position={[INCENSE_BURNER_POS.x, 0, INCENSE_BURNER_POS.z]}>
      {/* Khối va chạm để nhân vật không đi xuyên qua lư hương */}
      <RigidBody
        type="fixed"
        position={[0, 0.45, 0]}
        colliders={false}
      >
        <CylinderCollider args={[0.45, 0.45]} />
      </RigidBody>

      {/* Phần thân lư: bấm vào để bước tới thắp hương */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          activate();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        {/* Ba chân lư đồng tam túc */}
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
          return (
            <group key={`leg-${i}`} position={[Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3]}>
              <mesh castShadow rotation={[Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22]}>
                <cylinderGeometry args={[0.05, 0.065, 0.26, 10]} />
                <meshStandardMaterial color="#7A4B14" metalness={0.82} roughness={0.3} />
              </mesh>
              <mesh position={[Math.cos(a) * 0.02, -0.12, Math.sin(a) * 0.02]}>
                <sphereGeometry args={[0.07, 10, 8]} />
                <meshStandardMaterial color="#C8922E" metalness={0.85} roughness={0.25} />
              </mesh>
            </group>
          );
        })}

        {/* Thân lư hương đồng cổ */}
        <mesh castShadow receiveShadow geometry={bodyGeo}>
          <meshStandardMaterial
            color="#9B6A1E"
            metalness={0.86}
            roughness={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Đai vàng hoa văn quanh bụng lư */}
        <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.463, 0.022, 8, 40]} />
          <meshStandardMaterial color="#F6D58A" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.435, 0.016, 8, 40]} />
          <meshStandardMaterial color="#F6D58A" metalness={0.9} roughness={0.18} />
        </mesh>
        {/* Vành miệng lư viền vàng */}
        <mesh position={[0, 0.84, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.032, 10, 40]} />
          <meshStandardMaterial color="#E5B546" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Hai quai lư hai bên */}
        {[-1, 1].map((sx) => (
          <mesh
            key={`ear-${sx}`}
            position={[sx * 0.5, 0.82, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <torusGeometry args={[0.1, 0.028, 8, 20]} />
            <meshStandardMaterial color="#C8922E" metalness={0.88} roughness={0.22} />
          </mesh>
        ))}

        {/* Tro hương trắng xám trong lòng lư */}
        <mesh position={[0, ASH_Y, 0]}>
          <cylinderGeometry args={[0.385, 0.385, 0.04, 32]} />
          <meshStandardMaterial color="#9A948C" roughness={0.95} />
        </mesh>
      </group>

      {/* Các nén hương đang cháy */}
      {sticks.map((s) => (
        <BurningStick key={s.id} stick={s} />
      ))}

      {/* Ánh lửa hương ấm áp quanh lư */}
      <pointLight
        position={[0, 1.05, 0.05]}
        color="#FF9A3C"
        intensity={lightIntensity}
        distance={4.5}
        decay={2}
      />

      {/* Gợi ý thắp hương khi Phật tử bước lại gần */}
      {nearby && (
        <Html position={[0, 1.95, 0.2]} center distanceFactor={9} sprite>
          <button
            onClick={activate}
            style={{
              background:
                "linear-gradient(180deg, rgba(42, 21, 12, 0.92), rgba(24, 11, 6, 0.95))",
              backdropFilter: "blur(12px)",
              color: "#F6D58A",
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: "1px solid rgba(217, 164, 65, 0.65)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
              cursor: "pointer",
            }}
          >
            Nhấn [E] Thắp Nén Hương Dâng Phật
          </button>
        </Html>
      )}
    </group>
  );
}
