"use client";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";
import { sendRoomMessage } from "@/hooks/useMultiplayer";

interface SacredBellProps {
  position: [number, number, number];
}

export function SacredBell({ position }: SacredBellProps) {
  const bellRef     = useRef<THREE.Group>(null);
  const ringsRef    = useRef<THREE.Mesh[]>([]);
  const [nearby, setNearby] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const bellRinging = useTempleStore((s) => s.bellRinging);
  const [, getKeys] = useKeyboardControls();
  const prevInteract = useRef(false);
  const strikeTime   = useRef(0);

  useEffect(() => {
    if (bellRinging) {
      strikeTime.current = Date.now();
    }
  }, [bellRinging]);

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - strikeTime.current) / 1000;

    // Chuông đung đưa ngân vang
    if (bellRef.current) {
      const swing = bellRinging
        ? Math.sin(elapsed * 10) * Math.max(0, 0.2 - elapsed * 0.05)
        : 0;
      bellRef.current.rotation.z = swing;
    }

    // Vòng sóng vàng chấn động lan tỏa
    ringsRef.current.forEach((ring, i) => {
      if (!ring || !ring.material) return;
      const delay = i * 0.35;
      if (bellRinging) {
        const t = Math.max(0, elapsed - delay);
        ring.scale.setScalar(1 + t * 2.8);
        (ring.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.8 - t * 0.3);
      } else {
        ring.scale.setScalar(1);
        (ring.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    });

    const { localPlayerPos } = useTempleStore.getState();
    const dist = Math.hypot(localPlayerPos.x - position[0], localPlayerPos.z - position[2]);
    const isNearby = dist < 3.8;
    if (isNearby !== nearby) setNearby(isNearby);

    const { interact } = getKeys() as Record<string, boolean>;
    if (interact && !prevInteract.current && isNearby && !cooldown) {
      sendRoomMessage("bellStrike");
      setCooldown(true);
      setTimeout(() => setCooldown(false), 4500);
    }
    prevInteract.current = interact;
  });

  return (
    <group position={position} scale={[0.55, 0.55, 0.55]}>
      {/* Khung giá treo chuông bằng gỗ lim cổ kính */}
      <group>
        <mesh position={[-1.1, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 3.6, 12]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        <mesh position={[1.1, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 3.6, 12]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[2.5, 0.25, 0.35]} />
          <meshStandardMaterial color="#2d170b" roughness={0.8} />
        </mesh>
      </group>

      {/* Đại Hồng Chung Đồng Cổ (Great Temple Bell) */}
      <group ref={bellRef} position={[0, 2.3, 0]}>
        {/* Quai chuông hình rồng (Dragon Loop) */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <torusGeometry args={[0.18, 0.06, 8, 16]} />
          <meshStandardMaterial color="#92400e" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Thân chuông đồng đúc */}
        <mesh castShadow>
          <cylinderGeometry args={[0.55, 0.78, 1.3, 20, 1, true]} />
          <meshStandardMaterial
            color="#a16207"
            metalness={0.85}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Đỉnh chóp chuông */}
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a16207" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Vành chuông khắc hoa sen chạm nổi */}
        <mesh position={[0, -0.6, 0]}>
          <torusGeometry args={[0.77, 0.04, 8, 24]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Sóng chấn động tâm linh lan tỏa */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) ringsRef.current[i] = el; }}
            position={[0, -0.5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.9 + i * 0.3, 0.035, 4, 32]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={2}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Chày gỗ gõ chuông (Suspended Striking Log) */}
      <mesh position={[0, 1.7, 0.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 1.6, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>

      {/* Gợi ý tương tác tiếng Việt */}
      {nearby && !cooldown && (
        <Html position={[0, 4.3, 0]} center distanceFactor={10} sprite>
          <div
            onClick={() => {
              sendRoomMessage("bellStrike");
              setCooldown(true);
              setTimeout(() => setCooldown(false), 4500);
            }}
            style={{
              background: "rgba(18, 14, 24, 0.85)",
              backdropFilter: "blur(12px)",
              color: "#fef08a",
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: "1px solid rgba(251, 191, 36, 0.5)",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            Nhấn [E] Thỉnh Đại Hồng Chung
          </div>
        </Html>
      )}
      {nearby && cooldown && (
        <Html position={[0, 4.3, 0]} center distanceFactor={10} sprite>
          <div style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            color: "#94a3b8",
            padding: "3px 12px",
            borderRadius: "999px",
            fontSize: "11px",
            fontFamily: "system-ui, sans-serif",
          }}>
            Chuông đang ngân vang...
          </div>
        </Html>
      )}
    </group>
  );
}
