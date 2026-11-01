"use client";
import { useRef, useCallback } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sendRoomMessage } from "./useMultiplayer";
import { useTempleStore } from "@/stores/templeStore";

const WALK_SPEED = 4.0;
const SPRINT_SPEED = 7.0;
const TICK_RATE = 1 / 12;

export function usePlayerController(
  rigidBodyRef: React.RefObject<any>,
  cameraRef: React.RefObject<THREE.PerspectiveCamera>
) {
  const tickAccum = useRef(0);
  const cameraAngle = useRef({ azimuth: 0, elevation: 0.11 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);
  const playerRotRef = useRef(0);
  const lastResetTrigger = useRef(0);
  const lastSentState = useRef({ x: 0, y: 0, z: 0, rotY: 0, action: "" });

  const [, getKeys] = useKeyboardControls();
  const { gl } = useThree();

  const setupPointerLock = useCallback(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      // Người dùng tự xoay camera thì hủy chế độ tự xoay
      useTempleStore.getState().setCameraAzimuthTarget(null);
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // Cho phép xoay 360 độ tự do quanh Chánh Điện & Khuôn Viên Chùa
      cameraAngle.current.azimuth -= dx * 0.0045;
      cameraAngle.current.elevation = THREE.MathUtils.clamp(
        cameraAngle.current.elevation + dy * 0.0035,
        0.02,
        1.15
      );
    };

    // Cuộn chuột (Mouse Wheel / Trackpad) phóng to - thu nhỏ mượt mà từ cận cảnh (1.8m) tới toàn cảnh Chánh Điện (30m)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const store = useTempleStore.getState();
      const delta = e.deltaY * 0.015;
      store.setCameraZoom(store.cameraZoom + delta);
    };

    // Hỗ trợ cảm ứng 2 ngón tay (Pinch-to-Zoom)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDistRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = pinchDistRef.current - dist;
        pinchDistRef.current = dist;
        const store = useTempleStore.getState();
        store.setCameraZoom(store.cameraZoom + diff * 0.05);
      }
    };

    const onTouchEnd = () => {
      pinchDistRef.current = null;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl]);

  const direction = useRef(new THREE.Vector3());
  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const camTargetVec = useRef(new THREE.Vector3());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0));

  useFrame(({ camera }, dt) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const pos = rb.translation();
    const store = useTempleStore.getState();
    const { localAction } = store;

    store.setLocalPlayerPos(pos.x, pos.y, pos.z);

    const modalActive =
      !store.onboardingCompleted ||
      store.prayerModalOpen ||
      store.sutraModalOpen ||
      store.malaModalOpen;

    // Khi đang mở hộp thoại (gõ lời nguyện, đọc kinh...) thì phím WASD không được làm nhân vật di chuyển
    const rawKeys = getKeys() as Record<string, boolean>;
    const forward = !modalActive && !!rawKeys.forward;
    const backward = !modalActive && !!rawKeys.backward;
    const left = !modalActive && !!rawKeys.left;
    const right = !modalActive && !!rawKeys.right;
    const sprint = !modalActive && !!rawKeys.sprint;
    const isMoving = forward || backward || left || right;

    // Camera tự xoay mượt tới góc nhìn mục tiêu (ví dụ nhìn ra hồ sen khi thả hoa đăng)
    if (store.cameraAzimuthTarget !== null) {
      const diff = store.cameraAzimuthTarget - cameraAngle.current.azimuth;
      if (Math.abs(diff) < 0.012) {
        cameraAngle.current.azimuth = store.cameraAzimuthTarget;
        store.setCameraAzimuthTarget(null);
      } else {
        cameraAngle.current.azimuth += diff * Math.min(1, dt * 3.2);
      }
    }

    if (isMoving) {
      if (store.navigationTarget) {
        store.cancelNavigation();
      }
      if (localAction === "sit" || localAction === "bow") {
        store.setLocalAction("idle");
        store.setIsMeditating(false);
        store.setStatusNotice(null);
      }
    }

    if (store.navigationTarget) {
      const target = store.navigationTarget;
      // Nếu mục đích là thắp hương trước Phật đài ("incense") và nhân vật đang ở hai bên thảm quỳ,
      // ưu tiên bước vào lối đi Thảm Đỏ Trung Tâm (x = 0) trước rồi mới tiến thẳng lên lư hương
      const stepOntoCentralAisle =
        store.navigationPurpose === "incense" &&
        Math.abs(pos.x) > 0.35 &&
        Math.abs(pos.z - target.z) > 0.6;

      const waypointX = stepOntoCentralAisle ? 0 : target.x;
      const waypointZ = stepOntoCentralAisle ? pos.z : target.z;

      const dx = waypointX - pos.x;
      const dz = waypointZ - pos.z;
      const dist = Math.hypot(dx, dz);
      const finalDist = Math.hypot(target.x - pos.x, target.z - pos.z);

      if (finalDist > 0.22) {
        const safeDist = Math.max(0.001, dist);
        const dirX = dx / safeDist;
        const dirZ = dz / safeDist;
        const autoWalkSpeed = 3.8;

        rb.setLinvel(
          {
            x: dirX * autoWalkSpeed,
            y: rb.linvel().y,
            z: dirZ * autoWalkSpeed,
          },
          true
        );

        const moveAngle = Math.atan2(-dirX, -dirZ);
        playerRotRef.current = THREE.MathUtils.lerp(
          playerRotRef.current,
          moveAngle,
          0.22
        );

        if (localAction !== "walk") {
          store.setLocalAction("walk");
        }
      } else {
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: target.x, y: pos.y, z: target.z }, true);
        playerRotRef.current = 0;

        const purpose = store.navigationPurpose;
        if (purpose === "bow") {
          store.triggerBowDirectly();
        } else if (purpose === "incense") {
          // Đã tới trước lư hương: thắp nén nhang rồi chắp tay đảnh lễ
          playerRotRef.current = 0;
          store.setLocalAction("idle");
          store.setIsMeditating(false);
          store.cancelNavigation();
          store.offerIncense();
        } else if (purpose === "lantern") {
          // Đã tới sát hiên chùa: quay mặt ra hồ sen, xoay camera nhìn ra hồ rồi mở sớ cầu nguyện
          const pondSide = target.x < 0 ? -1 : 1;
          playerRotRef.current = -pondSide * (Math.PI / 2);
          store.setLocalAction("idle");
          store.setIsMeditating(false);
          store.cancelNavigation();
          store.setCameraAzimuthTarget(-pondSide * 0.85);
          store.setPrayerModalOpen(true);
        } else if (purpose === "sit") {
          store.setLocalAction("sit");
          store.setIsMeditating(true);
          store.setStatusNotice(
            "Đang quỳ lễ trước Tam Bảo · Tâm tĩnh lặng, an trú hiện tại"
          );
          store.cancelNavigation();
        }
      }
    } else if (localAction === "sit" || localAction === "bow") {
      rb.setLinvel({ x: 0, y: rb.linvel().y, z: 0 }, true);
      playerRotRef.current = 0;
    } else {
      const speed = sprint ? SPRINT_SPEED : WALK_SPEED;

      frontVector.current.set(0, 0, Number(backward) - Number(forward));
      sideVector.current.set(Number(right) - Number(left), 0, 0);
      eulerRef.current.set(0, cameraAngle.current.azimuth, 0);

      direction.current
        .subVectors(frontVector.current, sideVector.current)
        .normalize()
        .multiplyScalar(speed)
        .applyEuler(eulerRef.current);

      const currentVel = rb.linvel();
      rb.setLinvel(
        {
          x: direction.current.x,
          y: currentVel.y,
          z: direction.current.z,
        },
        true
      );

      if (isMoving) {
        const targetAngle = Math.atan2(
          -direction.current.x,
          -direction.current.z
        );
        playerRotRef.current = THREE.MathUtils.lerp(
          playerRotRef.current,
          targetAngle,
          0.18
        );
        const movingAction = sprint ? "run" : "walk";
        if (localAction !== movingAction) store.setLocalAction(movingAction);
      } else if (localAction === "walk" || localAction === "run") {
        store.setLocalAction("idle");
      }
    }

    if (store.cameraResetTrigger !== lastResetTrigger.current) {
      lastResetTrigger.current = store.cameraResetTrigger;
      cameraAngle.current.azimuth = 0;
      cameraAngle.current.elevation = store.cameraZoom > 8.5 ? 0.2 : 0.13;
    }

    const camDistance = store.cameraZoom || 5.4;
    const overviewFactor = THREE.MathUtils.clamp(
      (camDistance - 4.8) / 8.4,
      0,
      1
    );
    const camElevation =
      cameraAngle.current.elevation + overviewFactor * 0.1;
    const camAzimuth = cameraAngle.current.azimuth;

    // Ống kính góc rộng kiến trúc (58° ở góc nhìn hành lễ -> 74° khi thu nhỏ toàn cảnh)
    // giúp nhìn bao quát trọn vẹn toàn bộ Chánh Điện, 100 tấm thảm & 100 kệ sách kinh rất dễ dàng
    if ("fov" in camera) {
      const perspCam = camera as THREE.PerspectiveCamera;
      const targetFov = THREE.MathUtils.lerp(58, 74, overviewFactor);
      if (Math.abs(perspCam.fov - targetFov) > 0.05) {
        perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, 0.2);
        perspCam.updateProjectionMatrix();
      }
    }

    const orbitBlend = THREE.MathUtils.clamp(
      Math.abs(Math.sin(camAzimuth)) * 1.5 + (isMoving ? 0.65 : 0),
      0,
      1
    );
    const anchorX = THREE.MathUtils.lerp(
      pos.x * 0.14,
      pos.x * 0.72,
      orbitBlend * (1 - overviewFactor * 0.85)
    );
    const anchorZ = THREE.MathUtils.lerp(pos.z, 2.2, overviewFactor);

    const rawCamX =
      anchorX + camDistance * Math.sin(camAzimuth) * Math.cos(camElevation);
    const rawCamY =
      1.15 + camDistance * Math.sin(camElevation) * 0.72 + overviewFactor * 0.65;
    const rawCamZ =
      anchorZ + camDistance * Math.cos(camAzimuth) * Math.cos(camElevation);

    // Giữ Camera trong lòng Đại Hùng Bảo Điện rộng lớn
    const safeCamX = THREE.MathUtils.clamp(rawCamX, -10.5, 10.5);
    const safeCamY = THREE.MathUtils.clamp(rawCamY, 1.08, 4.85);
    const safeCamZ = THREE.MathUtils.clamp(rawCamZ, -2.6, 17.8);

    camTargetVec.current.set(safeCamX, safeCamY, safeCamZ);
    camera.position.lerp(camTargetVec.current, 0.18);

    // Điểm hội tụ: hướng về Bảo Tượng Phật & trung tâm 100 tấm thảm
    const lookAnchorX = THREE.MathUtils.lerp(0, pos.x * 0.45, orbitBlend);
    const closeLookX = lookAnchorX - Math.sin(camAzimuth) * 3.8;
    const closeLookY = 1.62;
    const closeLookZ = pos.z - Math.cos(camAzimuth) * 4.6;

    const overviewLookX = -Math.sin(camAzimuth) * 2.5;
    const overviewLookY = 1.65;
    const overviewLookZ = 0.6 - Math.cos(camAzimuth) * 2.4;

    const lookTargetX = THREE.MathUtils.lerp(
      closeLookX,
      overviewLookX,
      overviewFactor
    );
    const lookTargetY = THREE.MathUtils.lerp(
      closeLookY,
      overviewLookY,
      overviewFactor
    );
    const lookTargetZ = THREE.MathUtils.lerp(
      closeLookZ,
      overviewLookZ,
      overviewFactor
    );
    camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

    tickAccum.current += dt;
    if (tickAccum.current >= TICK_RATE) {
      tickAccum.current = 0;
      const prev = lastSentState.current;
      const moved =
        Math.abs(pos.x - prev.x) > 0.01 ||
        Math.abs(pos.z - prev.z) > 0.01 ||
        Math.abs(playerRotRef.current - prev.rotY) > 0.02 ||
        store.localAction !== prev.action;

      if (moved) {
        prev.x = pos.x;
        prev.y = pos.y;
        prev.z = pos.z;
        prev.rotY = playerRotRef.current;
        prev.action = store.localAction;
        sendRoomMessage("playerUpdate", {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          rotY: playerRotRef.current,
          action: store.localAction,
        });
      }
    }

    return playerRotRef.current;
  });

  return { setupPointerLock, playerRotRef };
}
