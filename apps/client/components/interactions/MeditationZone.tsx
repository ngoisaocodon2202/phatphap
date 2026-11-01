"use client";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";
import { sendRoomMessage } from "@/hooks/useMultiplayer";

interface MeditationZoneProps {
  position: [number, number, number];
  radius: number;
}

export function MeditationZone({ position, radius }: MeditationZoneProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const store   = useTempleStore();

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    // Pulsing sacred circle
    ringRef.current.rotation.y = t * 0.3;
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;
  });

  return (
    <group position={position}>
      {/* Sacred circle floor marking */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 64]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.7}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Inner lotus pattern */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * (radius * 0.5);
        const z = Math.sin(angle) * (radius * 0.5);
        return (
          <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, angle]}>
            <circleGeometry args={[0.3, 6]} />
            <meshStandardMaterial
              color="#a78bfa"
              emissive="#8b5cf6"
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Sensor collider for enter/exit */}
      <RigidBody
        type="fixed"
        sensor
        colliders={false}
        onIntersectionEnter={() => {
          setActive(true);
          store.setIsMeditating(true);
          sendRoomMessage("meditationStart");
        }}
        onIntersectionExit={() => {
          setActive(false);
          store.setIsMeditating(false);
          sendRoomMessage("meditationEnd");
        }}
      >
        <CylinderCollider args={[1, radius]} />
      </RigidBody>

      {/* Ambient meditation particles */}
      {active && (
        <pointLight color="#7c3aed" intensity={3} distance={radius * 2} decay={2} />
      )}
    </group>
  );
}
