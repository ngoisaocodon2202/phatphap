"use client";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { usePlayerController } from "@/hooks/usePlayerController";
import { useTempleStore } from "@/stores/templeStore";
import { LittleMonkAvatar } from "./Avatar";

export function LocalPlayer() {
  const rigidBodyRef = useRef<any>(null);
  const meshRef      = useRef<THREE.Group>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera>(null);
  const positionRef  = useRef(new THREE.Vector3());

  const localPlayer    = useTempleStore((s) => s.localPlayer);
  const localAction    = useTempleStore((s) => s.localAction);
  const isMeditating   = useTempleStore((s) => s.isMeditating);
  const sutraModalOpen = useTempleStore((s) => s.sutraModalOpen);

  const { setupPointerLock, playerRotRef } = usePlayerController(rigidBodyRef, cameraRef);

  useEffect(() => {
    const cleanup = setupPointerLock();
    return cleanup;
  }, [setupPointerLock]);

  const [, getKeys] = useKeyboardControls();
  const canJump = useRef(true);
  const lastSpawnTrigger = useRef(0);

  useFrame(() => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const state = useTempleStore.getState();

    // Khi vừa chọn xong Onboarding hoặc nhấn Đặt lại góc nhìn: đưa nhân vật về đúng tấm thảm hành lễ hướng thẳng lên Đức Phật
    if (state.playerSpawnTrigger !== lastSpawnTrigger.current) {
      lastSpawnTrigger.current = state.playerSpawnTrigger;
      rb.setTranslation({ x: 1.95, y: 0.76, z: 1.13 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      playerRotRef.current = 0;
      if (meshRef.current) {
        meshRef.current.rotation.y = 0;
      }
      positionRef.current.set(1.95, 0.76, 1.13);
      return;
    }

    const pos = rb.translation();
    const vel = rb.linvel();

    // Nếu nhân vật đang ở trạng thái ngồi/quỳ lễ nhưng tọa độ bị lệch ra ngoài khu vực 100 tấm thảm (do HMR hoặc lệch vật lý),
    // tự động đưa nhân vật về đúng tấm thảm hành lễ (x = 1.95, y = 0.76, z = 1.13)
    // Riêng khu vực trước lư hương trên thảm đỏ trung tâm (đảnh lễ sau khi thắp hương) là vị trí hợp lệ.
    const inIncenseZone =
      Math.abs(pos.x) < 1.4 && pos.z >= -1.6 && pos.z <= 0.3;
    if (
      (state.localAction === "sit" || state.localAction === "bow") &&
      !state.navigationTarget &&
      (pos.z > 8.6 ||
        pos.z < -2.8 ||
        Math.abs(pos.x) > 8.5 ||
        (Math.abs(pos.x) < 1.1 && !inIncenseZone) ||
        Math.abs(pos.y - 0.76) > 0.25)
    ) {
      rb.setTranslation({ x: 1.95, y: 0.76, z: 1.13 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      positionRef.current.set(1.95, 0.76, 1.13);
      return;
    }

    // Giữ nhân vật luôn vững vàng trên mặt sàn đá chánh điện (tâm CapsuleCollider 0.42+0.34 = 0.76m)
    if (pos.y < 0.55 || pos.y > 2.5) {
      rb.setTranslation({ x: pos.x, y: 0.76, z: pos.z }, true);
      rb.setLinvel({ x: vel.x, y: 0, z: vel.z }, true);
    }

    // Khi đang tọa thiền hoặc đảnh lễ (Lạy Phật): luôn hướng thẳng lên Bảo Tượng Đức Phật ở trên (rotation.y = 0, hướng -Z)
    if (state.localAction === "sit" || state.localAction === "bow") {
      const targetKneelAngle = 0;
      playerRotRef.current = targetKneelAngle;
      if (meshRef.current) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y,
          targetKneelAngle,
          0.25
        );
      }
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      positionRef.current.set(pos.x, pos.y, pos.z);
      return;
    }

    // Đồng bộ góc xoay khi di chuyển
    if (meshRef.current) {
      meshRef.current.rotation.y = playerRotRef.current;
    }

    const { jump } = getKeys() as Record<string, boolean>;
    const modalActive =
      !state.onboardingCompleted ||
      state.prayerModalOpen ||
      state.sutraModalOpen ||
      state.malaModalOpen;

    if (
      !modalActive &&
      jump &&
      canJump.current &&
      !state.navigationTarget &&
      Math.abs(vel.y) < 0.3
    ) {
      rb.setLinvel({ x: vel.x, y: 7.5, z: vel.z }, true);
      canJump.current = false;
      setTimeout(() => {
        canJump.current = true;
      }, 600);
    }

    positionRef.current.set(pos.x, pos.y, pos.z);
  });

  const { avatarColor, vietnameseName, gender } = localPlayer;

  const badgeLabel =
    localAction === "bow"
      ? `Đảnh Lễ Tam Bảo · ${vietnameseName}`
      : localAction === "walk" || localAction === "run"
      ? `Thiền Hành · ${vietnameseName}`
      : localAction === "sit" || isMeditating
      ? `Thiền Lễ · ${vietnameseName}`
      : vietnameseName || "Phật Tử";

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[1.95, 0.76, 1.13]}
      enabledRotations={[false, false, false]}
      friction={0.85}
      restitution={0}
    >
      <CapsuleCollider args={[0.42, 0.34]} />

      <group ref={meshRef} rotation={[0, 0, 0]}>
        <LittleMonkAvatar
          color={avatarColor}
          gender={gender}
          action={localAction}
          isMeditating={isMeditating}
        />

        {/* Nhãn Pháp Danh tinh tế đặt cao hẳn phía trên búi tóc / đỉnh đầu */}
        <Html
          position={[0, localAction === "sit" || localAction === "bow" ? 0.78 : 0.92, 0]}
          center
          distanceFactor={5.2}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(180deg, rgba(36, 18, 10, 0.78) 0%, rgba(20, 9, 5, 0.84) 100%)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(235, 192, 109, 0.65)",
              color: "#FFF4D8",
              padding: "3px 11px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)",
              userSelect: "none",
            }}
          >
            {/* Icon Hoa Sen SVG tinh xảo */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M12 3C10.2 6.2 9 9.2 9 12C9 14.2 10.3 16 12 16C13.7 16 15 14.2 15 12C15 9.2 13.8 6.2 12 3Z"
                fill="#E879F9"
                stroke="#F6D58A"
                strokeWidth="1.2"
              />
              <path
                d="M12 16C9.2 16 6.2 14.2 4.5 10.5C7 10.2 9.2 11.2 10.5 13.2"
                fill="#C084FC"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M12 16C14.8 16 17.8 14.2 19.5 10.5C17 10.2 14.8 11.2 13.5 13.2"
                fill="#C084FC"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M7 18.5C9.8 19.8 14.2 19.8 17 18.5"
                stroke="#D9A441"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{badgeLabel}</span>
          </div>
        </Html>

        {/* Nút "Mở Sách Đọc Kinh" nổi ngay trên kệ kinh trước mặt khi Phật tử đang ngồi trên tấm thảm */}
        {localAction === "sit" && !sutraModalOpen && (
          <Html
            position={[0, -0.32, -0.44]}
            center
            distanceFactor={5.2}
            zIndexRange={[15, 0]}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useTempleStore.getState().setSutraModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background:
                  "linear-gradient(180deg, rgba(168, 118, 38, 0.96) 0%, rgba(102, 66, 18, 0.98) 100%)",
                border: "1.5px solid #FFE299",
                color: "#FFFDF5",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "11.5px",
                fontWeight: 700,
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.65), 0 0 12px rgba(246, 213, 138, 0.55)",
                transition: "transform 0.15s ease",
              }}
              title="Nhấn để mở sách kinh trên kệ trước mặt"
            >
              <span>📖</span>
              <span>Mở Sách Đọc Kinh</span>
            </button>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}
