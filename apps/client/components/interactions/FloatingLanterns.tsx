"use client";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  useTempleStore,
  Lantern,
  POND_CENTER_X,
  POND_CENTER_Z,
} from "@/stores/templeStore";

const WATER_SURFACE_Y = 0.2; // Mặt nước hồ sen (khớp SacredLotusPond trong TempleGeometry)
const RELEASE_SECONDS = 3.4; // Thời gian hoa đăng bay từ hiên chùa xuống mặt hồ
const LANTERN_BASE_SCALE = 2.0;

function normalizeLanternColor(raw: string): {
  petal: string;
  inner: string;
  core: string;
} {
  const c = (raw || "").toLowerCase();
  if (
    c.includes("8d3026") ||
    c.includes("c84b31") ||
    c.includes("dc2626") ||
    c.includes("fb923c")
  ) {
    return { petal: "#B83B2A", inner: "#E06D53", core: "#FFE5B4" };
  }
  if (c.includes("f472b6") || c.includes("f4a7b9") || c.includes("ec4899") || c.includes("e879a0")) {
    return { petal: "#E58A9E", inner: "#F7C6D0", core: "#FFF0D4" };
  }
  if (c.includes("fff") || c.includes("f7ebd5")) {
    return { petal: "#EFE2C8", inner: "#FAF3E3", core: "#FFE8A3" };
  }
  return { petal: "#D9A441", inner: "#F6D58A", core: "#FFF7D6" };
}

let sharedLanternPetalGeo: THREE.ExtrudeGeometry | null = null;
function getSharedLanternPetalGeo(): THREE.ExtrudeGeometry {
  if (sharedLanternPetalGeo) return sharedLanternPetalGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.085, 0.09, 0.055, 0.22);
  shape.quadraticCurveTo(0, 0.28, 0, 0.3);
  shape.quadraticCurveTo(0, 0.28, -0.055, 0.22);
  shape.quadraticCurveTo(-0.085, 0.09, 0, 0);

  sharedLanternPetalGeo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.012,
    bevelEnabled: false,
  });
  return sharedLanternPetalGeo;
}

let cachedGlowTex: THREE.CanvasTexture | null = null;
function getGlowTexture(): THREE.CanvasTexture | null {
  if (cachedGlowTex) return cachedGlowTex;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 31);
  grad.addColorStop(0, "rgba(255, 226, 150, 0.95)");
  grad.addColorStop(0.4, "rgba(255, 178, 80, 0.45)");
  grad.addColorStop(1, "rgba(255, 150, 60, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  cachedGlowTex = new THREE.CanvasTexture(canvas);
  return cachedGlowTex;
}

// Băm chuỗi id hoa đăng thành số ngẫu nhiên ổn định để mỗi hoa đăng luôn trôi về cùng một chỗ trên hồ
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rand01(h: number, n: number): number {
  const v = Math.imul(h ^ Math.imul(n + 1, 0x9e3779b1), 2246822519) >>> 0;
  return (v % 10000) / 10000;
}

const tempScaleVec = new THREE.Vector3();

function PondLotusLantern({ lantern }: { lantern: Lantern }) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showWish, setShowWish] = useState(true);
  const wishVisibleRef = useRef(true);

  const palette = useMemo(() => normalizeLanternColor(lantern.color), [lantern.color]);
  const petalGeo = useMemo(() => getSharedLanternPetalGeo(), []);
  const glowTex = useMemo(() => getGlowTexture(), []);

  // Hồ nào? Theo phía Phật tử đứng lúc thả (x < 0: hồ trái, x > 0: hồ phải); không rõ thì chia theo id
  const motion = useMemo(() => {
    const h = hashString(lantern.id);
    const side = lantern.x < -0.05 ? -1 : lantern.x > 0.05 ? 1 : h % 2 === 0 ? -1 : 1;
    const cx = side * POND_CENTER_X;
    // Điểm thả: sát hiên chùa tại cao độ z của Phật tử
    const startX = side * 10.1;
    const startZ = Math.max(0.6, Math.min(9.0, lantern.z));
    // Điểm dừng ngẫu nhiên nhưng ổn định trên mặt hồ (hồ rộng 4.4m × 11.6m)
    const endX = cx + (rand01(h, 1) - 0.5) * 3.4;
    const endZ = POND_CENTER_Z + (rand01(h, 2) - 0.5) * 9.6;
    return {
      side,
      startX,
      startZ,
      endX,
      endZ,
      phase: rand01(h, 3) * 100,
      driftX: 0.18 + rand01(h, 4) * 0.22,
      driftZ: 0.25 + rand01(h, 5) * 0.35,
    };
  }, [lantern.id, lantern.x, lantern.z]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime() + motion.phase;
    const age = Math.max(0, (Date.now() - lantern.createdAt) / 1000);
    const k = Math.min(1, age / RELEASE_SECONDS);
    const ease = 1 - Math.pow(1 - k, 3);

    // Sau khi hạ xuống hồ, hoa đăng trôi chầm chậm theo làn nước
    const driftX = Math.sin(t * 0.13) * motion.driftX * k;
    const driftZ = Math.cos(t * 0.1) * motion.driftZ * k;

    const x = THREE.MathUtils.lerp(motion.startX, motion.endX, ease) + driftX;
    const z = THREE.MathUtils.lerp(motion.startZ, motion.endZ, ease) + driftZ;
    // Bay vòng cung từ hiên chùa rồi nhẹ nhàng đáp xuống mặt nước
    const arc = Math.sin(Math.PI * Math.min(1, k)) * 1.1;
    const startY = 1.15;
    const floatY = WATER_SURFACE_Y + 0.07 + Math.sin(t * 1.3) * 0.012;
    const y = THREE.MathUtils.lerp(startY, floatY, ease) + arc * (1 - ease * 0.4);

    g.position.set(x, y, z);
    g.rotation.y = t * 0.1;
    const settled = k >= 1;
    g.rotation.z = settled ? Math.sin(t * 0.9) * 0.025 : 0;
    g.rotation.x = settled ? Math.cos(t * 0.8) * 0.025 : 0;

    const s = LANTERN_BASE_SCALE * (hovered ? 1.15 : 1.0);
    tempScaleVec.set(s, s, s);
    g.scale.lerp(tempScaleVec, 0.1);

    // Quầng sáng ấm & gợn sóng nước tỏa ra quanh hoa đăng đã nằm trên mặt hồ
    if (glowRef.current) {
      glowRef.current.position.set(x, WATER_SURFACE_Y + 0.025, z);
      glowRef.current.visible = settled;
      const pulse = 1 + Math.sin(t * 1.6) * 0.06;
      glowRef.current.scale.setScalar(pulse);
    }
    if (rippleRef.current) {
      rippleRef.current.position.set(x, WATER_SURFACE_Y + 0.03, z);
      rippleRef.current.visible = settled;
      const rt = (t * 0.35) % 1;
      rippleRef.current.scale.setScalar(1 + rt * 1.4);
      (rippleRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - rt);
    }

    // Nhãn lời nguyện: hiện lúc mới thả (8 giây đầu) hoặc khi rê chuột vào
    const wantWish = hovered || age < 8;
    if (wantWish !== wishVisibleRef.current) {
      wishVisibleRef.current = wantWish;
      setShowWish(wantWish);
    }
  });

  return (
    <>
      {/* Quầng sáng vàng ấm tỏa trên mặt nước */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.85, 24]} />
        <meshBasicMaterial
          map={glowTex ?? undefined}
          color={palette.core}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Vòng sóng nước lan tỏa */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.34, 32]} />
        <meshBasicMaterial
          color="#CFF7FA"
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group
        ref={groupRef}
        scale={[LANTERN_BASE_SCALE, LANTERN_BASE_SCALE, LANTERN_BASE_SCALE]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Vùng bắt chuột vô hình để dễ rê vào hoa đăng nhỏ trên mặt hồ */}
        <mesh position={[0, 0.1, 0]} visible={false}>
          <cylinderGeometry args={[0.3, 0.3, 0.3, 8]} />
          <meshBasicMaterial />
        </mesh>

        {/* Đế đài sen bằng đồng vàng nổi trên mặt nước */}
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.14, 0.1, 0.05, 12]} />
          <meshStandardMaterial color="#C8922E" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Lớp cánh sen ngoài (8 cánh) */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <group key={`outer-${i}`} rotation={[0, angle, 0]}>
              <mesh geometry={petalGeo} position={[0, -0.02, 0.07]} rotation={[0.58, 0, 0]}>
                <meshStandardMaterial
                  color={palette.petal}
                  emissive={palette.petal}
                  emissiveIntensity={hovered ? 0.65 : 0.4}
                  roughness={0.45}
                />
              </mesh>
            </group>
          );
        })}

        {/* Lớp cánh sen trong (8 cánh) */}
        {[...Array(8)].map((_, i) => {
          const angle = ((i + 0.5) / 8) * Math.PI * 2;
          return (
            <group key={`inner-${i}`} rotation={[0, angle, 0]}>
              <mesh
                geometry={petalGeo}
                position={[0, 0.0, 0.045]}
                rotation={[0.28, 0, 0]}
                scale={[0.85, 0.9, 0.85]}
              >
                <meshStandardMaterial
                  color={palette.inner}
                  emissive={palette.core}
                  emissiveIntensity={hovered ? 0.9 : 0.6}
                  roughness={0.35}
                />
              </mesh>
            </group>
          );
        })}

        {/* Lõi đèn nến vàng ấm phát sáng */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.055, 0.065, 0.14, 12]} />
          <meshStandardMaterial
            color={palette.core}
            emissive="#F59E0B"
            emissiveIntensity={hovered ? 2.4 : 1.8}
            roughness={0.2}
          />
        </mesh>

        {lantern.wish && showWish && (
          <Html position={[0, 0.5, 0]} center distanceFactor={9} sprite>
            <div
              title={lantern.wish}
              style={{
                background:
                  "linear-gradient(180deg, rgba(38, 19, 12, 0.92), rgba(22, 10, 6, 0.95))",
                color: "#F6D58A",
                border: "1px solid rgba(217, 164, 65, 0.55)",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "10px",
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(0,0,0,0.55)",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {lantern.wish}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// Hoa đăng của mọi Phật tử được thả trôi trên 2 hồ sen hai bên Chánh Điện
export function FloatingLanterns() {
  const lanterns = useTempleStore((s) => s.lanterns);

  return (
    <group>
      {lanterns.map((l) => (
        <PondLotusLantern key={l.id} lantern={l} />
      ))}
    </group>
  );
}
