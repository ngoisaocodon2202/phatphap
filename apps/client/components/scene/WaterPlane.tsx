import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

export function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial & { time?: number };
    if (mat.uniforms && mat.uniforms["time"]) {
      mat.uniforms["time"].value = clock.getElapsedTime();
    }
  });

  return (
    <group position={[0, 0.01, 0]}>
      {/* Main reflective pool */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[5, 64]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={0.8}
          mixStrength={0.4}
          roughness={0.1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050a14"
          metalness={0.9}
          mirror={0.75}
        />
      </mesh>
    </group>
  );
}
