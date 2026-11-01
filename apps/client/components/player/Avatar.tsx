"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PilgrimGender } from "@/stores/templeStore";

export interface AvatarProps {
  color?: string;
  gender?: PilgrimGender;
  action?: string; // idle | walk | run | sit | bow
  isMeditating?: boolean;
}

const SKIN_COLOR = "#FFE5D0";
const SKIN_CREVICE = "#D99B7E";
const HAIR_COLOR = "#2D1810";

const faceTexCache = new Map<string, THREE.CanvasTexture>();
const robeTexCache = new Map<string, THREE.CanvasTexture>();
let cachedHairTex: THREE.CanvasTexture | null = null;

/**
 * Texture sợi tóc 3D mềm mượt theo phong cách hoạt hình Pixar
 */
function getHairStrandTexture(): THREE.CanvasTexture {
  if (cachedHairTex) return cachedHairTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#24120B");
  grad.addColorStop(0.45, "#3B2115");
  grad.addColorStop(0.75, "#2E190F");
  grad.addColorStop(1.0, "#1E0F09");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 120; i++) {
    const x = (i / 120) * 256;
    ctx.strokeStyle =
      i % 3 === 0 ? "rgba(110, 68, 44, 0.38)" : "rgba(22, 10, 5, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 4, 85, x - 4, 170, x, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedHairTex = tex;
  return tex;
}

/**
 * Texture khuôn mặt Mascot 3D Pixar-style độ phân giải cao (1024x512)
 * Tâm khuôn mặt tại u = 0.5, v = 0.5 (hướng về -Z khi mesh xoay Y = +PI/2).
 * Vùng sau gáy (u < 0.24 hoặc u > 0.76) và đỉnh đầu (y < 110) được phủ màu tóc nâu trầm
 * để khi nhìn từ phía sau lưng tuyệt đối không bao giờ lộ mảng đầu hói.
 */
function getPixarFaceTexture(
  gender: PilgrimGender,
  eyesClosed: boolean
): THREE.CanvasTexture {
  const key = `${gender}-${eyesClosed ? "closed" : "open"}`;
  const existing = faceTexCache.get(key);
  if (existing) return existing;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // 1. Nền toàn bộ hộp sọ (đỉnh đầu, thái dương, sau gáy) phủ màu tóc nâu trầm ấm
  // để từ mọi góc nhìn 360 độ tuyệt đối không bao giờ lộ vệt trắng hay mảng hói sau đầu
  const hairBg = ctx.createLinearGradient(0, 0, 0, 512);
  hairBg.addColorStop(0.0, "#24120B");
  hairBg.addColorStop(0.5, "#361D12");
  hairBg.addColorStop(1.0, "#24120B");
  ctx.fillStyle = hairBg;
  ctx.fillRect(0, 0, 1024, 512);

  const cx = 512;
  const cy = 264;

  // Vùng khuôn mặt hồng hào mịn màng ở chính giữa mặt trước (u = 0.33..0.67)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 28, 178, 176, 0, 0, Math.PI * 2);
  ctx.clip();

  const skinGrad = ctx.createLinearGradient(0, 100, 0, 480);
  skinGrad.addColorStop(0.0, "#F9DAC2");
  skinGrad.addColorStop(0.45, "#FFE5D0");
  skinGrad.addColorStop(0.75, "#FAD8BF");
  skinGrad.addColorStop(1.0, "#ECC2A6");
  ctx.fillStyle = skinGrad;
  ctx.fillRect(cx - 190, 90, 380, 410);
  ctx.restore();

  // 2. Má hồng ấm áp hai bên (Soft Pixar blush)
  [-74, 74].forEach((offsetX) => {
    const blush = ctx.createRadialGradient(
      cx + offsetX,
      cy + 26,
      2,
      cx + offsetX,
      cy + 26,
      42
    );
    blush.addColorStop(
      0.0,
      gender === "female"
        ? "rgba(244, 128, 128, 0.46)"
        : "rgba(238, 136, 122, 0.28)"
    );
    blush.addColorStop(1.0, "rgba(244, 128, 128, 0.0)");
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx + offsetX, cy + 26, 42, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Hàng lông mày nâu trầm biểu cảm
  [-54, 54].forEach((offsetX, idx) => {
    const dir = idx === 0 ? -1 : 1;
    ctx.save();
    ctx.translate(cx + offsetX, cy - 52);
    ctx.rotate(dir * (gender === "female" ? -0.06 : -0.03));
    ctx.fillStyle = "#2E180E";
    ctx.beginPath();
    const bw = gender === "female" ? 30 : 33;
    const bh = gender === "female" ? 7.5 : 10.5;
    ctx.roundRect(-bw, -bh * 0.5, bw * 2, bh, bh * 0.5);
    ctx.fill();
    ctx.restore();
  });

  // 4. Đôi mắt Pixar 3D to tròn có hồn (hoặc nhắm mắt thanh tịnh khi lạy Phật)
  [-54, 54].forEach((offsetX, idx) => {
    const dir = idx === 0 ? -1 : 1;
    const ex = cx + offsetX;
    const ey = cy - 8;

    if (eyesClosed) {
      ctx.strokeStyle = "#2B160C";
      ctx.lineWidth = 6.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(ex, ey - 4, 24, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.fillStyle = "rgba(186, 118, 88, 0.28)";
      ctx.beginPath();
      ctx.ellipse(ex, ey - 2, 31, 29, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 28, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.clip();

      const irisX = ex - dir * 2;
      const irisY = ey + 1;
      const irisGrad = ctx.createRadialGradient(
        irisX,
        irisY + 6,
        3,
        irisX,
        irisY,
        22
      );
      irisGrad.addColorStop(0.0, "#7C4728");
      irisGrad.addColorStop(0.55, "#4E2A16");
      irisGrad.addColorStop(0.88, "#2A150A");
      irisGrad.addColorStop(1.0, "#1A0C05");
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(irisX, irisY, 21.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0F0704";
      ctx.beginPath();
      ctx.arc(irisX, irisY, 10.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(irisX - 6.5, irisY - 7.5, 5.5, 4.8, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(irisX + 6.5, irisY + 7.5, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.strokeStyle = "#1E0E07";
      ctx.lineWidth = gender === "female" ? 6.5 : 5.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 27.5, 1.08 * Math.PI, 1.92 * Math.PI);
      ctx.stroke();

      if (gender === "female") {
        ctx.beginPath();
        ctx.moveTo(ex + dir * 25, ey - 8);
        ctx.quadraticCurveTo(
          ex + dir * 32,
          ey - 12,
          ex + dir * 34,
          ey - 17
        );
        ctx.stroke();
      }
    }
  });

  // 5. Bóng sống mũi & đầu mũi hồng nhẹ
  const noseShadow = ctx.createRadialGradient(cx, cy + 20, 1, cx, cy + 20, 18);
  noseShadow.addColorStop(0.0, "rgba(218, 138, 108, 0.35)");
  noseShadow.addColorStop(1.0, "rgba(218, 138, 108, 0.0)");
  ctx.fillStyle = noseShadow;
  ctx.beginPath();
  ctx.arc(cx, cy + 20, 18, 0, Math.PI * 2);
  ctx.fill();

  // 6. Khuôn miệng cười hàm tiếu dịu dàng
  const my = cy + 52;
  const lipGrad = ctx.createRadialGradient(cx, my + 3, 2, cx, my + 3, 26);
  lipGrad.addColorStop(
    0.0,
    gender === "female" ? "rgba(232, 112, 108, 0.75)" : "rgba(214, 118, 104, 0.55)"
  );
  lipGrad.addColorStop(1.0, "rgba(232, 112, 108, 0.0)");
  ctx.fillStyle = lipGrad;
  ctx.beginPath();
  ctx.ellipse(cx, my + 3, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = gender === "female" ? "#B84A44" : "#A64E42";
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 24, my - 2);
  ctx.quadraticCurveTo(cx, my + 11, cx + 24, my - 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  faceTexCache.set(key, tex);
  return tex;
}

/**
 * Texture Áo Tràng Phật Tử Cổ Giao Lĩnh Chữ Y (512x512)
 */
function getRobeTunicTexture(baseColorHex: string): THREE.CanvasTexture {
  const existing = robeTexCache.get(baseColorHex);
  if (existing) return existing;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex || "#7A8B9E");
  const mainHex = `#${base.getHexString()}`;
  const lightCollar = `#${base.clone().offsetHSL(0, -0.02, 0.1).getHexString()}`;
  const darkFold = `#${base.clone().offsetHSL(0, 0.03, -0.14).getHexString()}`;

  ctx.fillStyle = mainHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 16; i++) {
    const x = (i / 16) * 512;
    const foldGrad = ctx.createLinearGradient(x, 0, x + 32, 0);
    foldGrad.addColorStop(0, "rgba(0,0,0,0)");
    foldGrad.addColorStop(0.5, "rgba(0,0,0,0.08)");
    foldGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = foldGrad;
    ctx.fillRect(x, 0, 32, 512);
  }

  const cx = 256;

  ctx.fillStyle = "#F7EFE4";
  ctx.beginPath();
  ctx.moveTo(cx - 42, 0);
  ctx.lineTo(cx + 42, 0);
  ctx.lineTo(cx, 88);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = darkFold;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 44, 4);
  ctx.lineTo(cx - 4, 108);
  ctx.stroke();

  ctx.strokeStyle = lightCollar;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(cx + 44, 4);
  ctx.lineTo(cx - 4, 108);
  ctx.stroke();

  ctx.strokeStyle = darkFold;
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(cx - 44, 4);
  ctx.lineTo(cx + 22, 145);
  ctx.lineTo(cx + 30, 512);
  ctx.stroke();

  ctx.strokeStyle = lightCollar;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(cx - 44, 4);
  ctx.lineTo(cx + 20, 145);
  ctx.lineTo(cx + 28, 512);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  robeTexCache.set(baseColorHex, tex);
  return tex;
}

/**
 * Bàn tay 3D đủ 5 ngón rõ ràng (ngón cái + 4 ngón tay chắp búp sen Anjali Mudra)
 */
function HandWithFiveFingers({ side }: { side: "left" | "right" }) {
  const s = side === "left" ? -1 : 1;
  const fingerOffsets = [-0.018, -0.006, 0.006, 0.018];
  const fingerLengths = [0.042, 0.052, 0.048, 0.038];

  return (
    <group>
      <mesh position={[0, -0.028, 0.008]} castShadow>
        <cylinderGeometry args={[0.021, 0.024, 0.034, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.0, 0]} scale={[0.72, 1.05, 1.02]} castShadow>
        <boxGeometry args={[0.032, 0.044, 0.048]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.42} />
      </mesh>
      {fingerOffsets.map((zOff, idx) => {
        const len = fingerLengths[idx];
        return (
          <group key={idx} position={[0, 0.022 + len * 0.5, zOff]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.0054, len, 4, 8]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.4} />
            </mesh>
            {idx < 3 && (
              <mesh position={[s * 0.003, 0, 0.006]}>
                <boxGeometry args={[0.008, len * 0.85, 0.0018]} />
                <meshBasicMaterial color={SKIN_CREVICE} />
              </mesh>
            )}
          </group>
        );
      })}
      <group
        position={[s * 0.008, 0.014, -0.026]}
        rotation={[-0.35, 0, -s * 0.22]}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.0062, 0.028, 4, 8]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Bàn chân trần 3D đủ 5 ngón chân rõ ràng
 */
function FootWithFiveToes({
  side,
  kneeling = false,
}: {
  side: "left" | "right";
  kneeling?: boolean;
}) {
  const s = side === "left" ? -1 : 1;
  const toeOffsets = [-0.024, -0.012, 0.0, 0.011, 0.022];
  const toeRadii = [0.0086, 0.0072, 0.0066, 0.006, 0.0054];

  return (
    <group rotation={kneeling ? [Math.PI * 0.44, 0, 0] : [0, 0, 0]}>
      <mesh position={[0, 0.025, 0.02]} castShadow>
        <cylinderGeometry args={[0.026, 0.029, 0.052, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.0, -0.014]} scale={[0.96, 0.58, 1.54]} castShadow>
        <sphereGeometry args={[0.035, 14, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.45} />
      </mesh>
      {toeOffsets.map((tx, idx) => {
        const orderedX = s > 0 ? -tx : tx;
        const r = toeRadii[idx];
        return (
          <mesh
            key={idx}
            position={[orderedX, -0.004, -0.062 + idx * 0.002]}
            scale={[0.92, 0.86, 1.38]}
            castShadow
          >
            <sphereGeometry args={[r, 8, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.42} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Đóa Hoa Sen Hồng 3D Nhiều Cánh & Trâm Cài Tóc Cho Nữ Phật Tử
 */
function PinkLotusHairpin() {
  return (
    <group position={[-0.105, 0.275, -0.04]} rotation={[0.18, 0.25, 0.38]}>
      <mesh position={[-0.03, -0.01, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.005, 0.24, 10]} />
        <meshStandardMaterial color="#F48FB1" roughness={0.32} />
      </mesh>
      {[...Array(8)].map((_, idx) => {
        const ang = (idx / 8) * Math.PI * 2;
        return (
          <group key={idx} rotation={[0, ang, 0]}>
            <mesh
              position={[0, 0.012, 0.032]}
              rotation={[0.55, 0, 0]}
              scale={[0.62, 1.25, 0.35]}
            >
              <sphereGeometry args={[0.028, 10, 8]} />
              <meshStandardMaterial
                color="#F472B6"
                emissive="#EC4899"
                emissiveIntensity={0.22}
                roughness={0.32}
              />
            </mesh>
          </group>
        );
      })}
      {[...Array(6)].map((_, idx) => {
        const ang = ((idx + 0.5) / 6) * Math.PI * 2;
        return (
          <group key={`inner-${idx}`} rotation={[0, ang, 0]}>
            <mesh
              position={[0, 0.024, 0.018]}
              rotation={[0.32, 0, 0]}
              scale={[0.55, 1.1, 0.32]}
            >
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#FBCFE8" roughness={0.3} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.028, 0]}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshStandardMaterial color="#FDE047" roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Nhân Vật Phật Tử Hoạt Hình 3D (Pixar-Style 3D Mascot Pilgrim — Nam & Nữ)
 * Khớp xương chuẩn (Hierarchical Rigging):
 * - Đầu (headGroupRef), Cổ, Vai và Tay đều là CON TRỰC TIẾP của Thân Trên (torsoGroupRef có tâm xoay tại hông y = 0.22).
 * - Khi cúi lạy Đức Phật (action === "bow"), toàn bộ thân trên + cổ + đầu nghiêng về phía trước (-Z, rotation.x âm)
 *   như một cơ thể liền khối — cổ không bao giờ bị tách hay lìa khỏi thân!
 */
export function LittleMonkAvatar({
  color = "#7A8B9E",
  gender = "male",
  action = "sit",
  isMeditating = true,
}: AvatarProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const handsPrayerRef = useRef<THREE.Group>(null);
  const standingLegsRef = useRef<THREE.Group>(null);
  const seatedBaseRef = useRef<THREE.Group>(null);
  const leftFootStepRef = useRef<THREE.Group>(null);
  const rightFootStepRef = useRef<THREE.Group>(null);
  const headMeshOpenRef = useRef<THREE.Mesh>(null);
  const headMeshClosedRef = useRef<THREE.Mesh>(null);

  const hairTex = useMemo(() => getHairStrandTexture(), []);
  const faceOpenTex = useMemo(() => getPixarFaceTexture(gender, false), [gender]);
  const faceClosedTex = useMemo(() => getPixarFaceTexture(gender, true), [gender]);
  const robeTunicTex = useMemo(() => getRobeTunicTexture(color), [color]);

  const { robeMain, robeDark } = useMemo(() => {
    const base = new THREE.Color(color || "#7A8B9E");
    const dark = base.clone().offsetHSL(0, 0.02, -0.14);
    return {
      robeMain: `#${base.getHexString()}`,
      robeDark: `#${dark.getHexString()}`,
    };
  }, [color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!rootRef.current || !headGroupRef.current || !torsoGroupRef.current) return;

    const isSitting = action === "sit" || isMeditating;
    const isBowing = action === "bow";
    const isWalking = action === "walk" || action === "run";

    if (seatedBaseRef.current) {
      seatedBaseRef.current.visible = isSitting || isBowing;
    }
    if (standingLegsRef.current) {
      standingLegsRef.current.visible = !isSitting && !isBowing;
    }

    const blinkCycle = t % 4.2;
    const eyesClosed = isBowing || blinkCycle > 4.05;
    if (headMeshOpenRef.current) {
      headMeshOpenRef.current.visible = !eyesClosed;
    }
    if (headMeshClosedRef.current) {
      headMeshClosedRef.current.visible = eyesClosed;
    }

    // Lưu ý quan trọng:
    // Tâm RigidBody (CapsuleCollider 0.42 + 0.34) nằm ở độ cao y = 0.76m so với mặt sàn (y = 0.0).
    // Mặt trên của tấm bồ đoàn nằm ở y = 0.06m (tức là local y = -0.70 so với tâm RigidBody).
    // Đáy đầu gối & mũi bàn chân trong rootRef nằm ở y = 0.0, nên khi quỳ lễ rootRef.position.y = -0.70
    // giúp đầu gối, vạt áo và bàn chân nhân vật đặt sát khít ngay trên mặt tấm thảm (không bị lơ lửng)!
    if (isBowing) {
      const bowCycle = (Math.sin(t * 2.4) + 1) * 0.5;
      rootRef.current.position.y = -0.7;
      torsoGroupRef.current.position.set(0, 0.16, 0);
      torsoGroupRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.04, -0.85, bowCycle),
        0,
        0
      );

      // Đầu gắn chặt trên cổ tại [0, 0.76, 0], chỉ cúi nhẹ cổ theo nhịp lạy
      headGroupRef.current.position.set(0, 0.76, 0);
      headGroupRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.02, -0.16, bowCycle),
        0,
        0
      );

      if (handsPrayerRef.current) {
        handsPrayerRef.current.position.set(
          0,
          THREE.MathUtils.lerp(0.36, 0.46, bowCycle),
          THREE.MathUtils.lerp(-0.25, -0.32, bowCycle)
        );
        handsPrayerRef.current.rotation.x = THREE.MathUtils.lerp(0.18, -0.35, bowCycle);
      }
    } else if (isSitting) {
      const breath = Math.sin(t * 1.8) * 0.006;
      rootRef.current.position.y = -0.7 + breath;
      torsoGroupRef.current.position.set(0, 0.16, 0);
      torsoGroupRef.current.rotation.set(-0.02, 0, 0);

      headGroupRef.current.position.set(0, 0.76 + breath * 0.3, 0);
      headGroupRef.current.rotation.set(0, 0, Math.sin(t * 0.9) * 0.008);

      if (handsPrayerRef.current) {
        handsPrayerRef.current.position.set(0, 0.36 + breath * 0.4, -0.25);
        handsPrayerRef.current.rotation.x = 0.18;
      }
    } else if (isWalking) {
      const speed = action === "run" ? 11 : 7.5;
      const stride = Math.sin(t * speed);
      const bob = Math.abs(Math.cos(t * speed)) * 0.032;

      rootRef.current.position.y = -0.74 + bob;
      torsoGroupRef.current.position.set(0, 0.32, 0);
      torsoGroupRef.current.rotation.set(-0.03, 0, stride * 0.025);

      headGroupRef.current.position.set(0, 0.76, 0);
      headGroupRef.current.rotation.set(0, 0, -stride * 0.018);

      if (handsPrayerRef.current) {
        handsPrayerRef.current.position.set(0, 0.36, -0.25);
        handsPrayerRef.current.rotation.x = 0.18;
      }
      if (leftFootStepRef.current && rightFootStepRef.current) {
        leftFootStepRef.current.position.z = stride * 0.12;
        leftFootStepRef.current.position.y = Math.max(0, -stride * 0.045);
        rightFootStepRef.current.position.z = -stride * 0.12;
        rightFootStepRef.current.position.y = Math.max(0, stride * 0.045);
      }
    } else {
      const breath = Math.sin(t * 1.8) * 0.008;
      rootRef.current.position.y = -0.74 + breath;
      torsoGroupRef.current.position.set(0, 0.32, 0);
      torsoGroupRef.current.rotation.set(0, 0, 0);

      headGroupRef.current.position.set(0, 0.76 + breath * 0.3, 0);
      headGroupRef.current.rotation.set(0, 0, 0);

      if (handsPrayerRef.current) {
        handsPrayerRef.current.position.set(0, 0.36 + breath * 0.3, -0.25);
        handsPrayerRef.current.rotation.x = 0.18;
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.7, 0]}>
      {/* ── 1. KHỐI THÂN TRÊN + CỔ + ĐẦU + TAY LIỀN KHỐI (TÂM XOAY TẠI HÔNG Y = 0.16) ── */}
      <group ref={torsoGroupRef} position={[0, 0.16, 0]}>
        {/* Thân áo tràng cổ giao lĩnh chữ Y (local y = 0.26 -> world y = 0.48) */}
        <mesh
          position={[0, 0.26, 0.0]}
          rotation={[0, Math.PI, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.172, 0.258, 0.56, 28]} />
          <meshStandardMaterial map={robeTunicTex} roughness={0.58} />
        </mesh>

        {/* Bờ vai tròn mềm mại (local y = 0.50 -> world y = 0.72) */}
        <mesh
          position={[0, 0.5, 0.0]}
          scale={[1.24, 0.48, 0.92]}
          castShadow
        >
          <sphereGeometry args={[0.178, 20, 14]} />
          <meshStandardMaterial color={robeMain} roughness={0.58} />
        </mesh>

        {/* Trụ cổ dài cắm sâu từ ngực (local y = 0.44) lên giữa đầu (local y = 0.72) đảm bảo không bao giờ hở cổ */}
        <mesh position={[0, 0.56, 0.01]} castShadow>
          <cylinderGeometry args={[0.076, 0.092, 0.24, 16]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.42} />
        </mesh>

        {/* Hai cánh tay & ống tay áo tràng rộng chắp trước ngực */}
        {[-1, 1].map((side) => (
          <group key={`arm-${side}`}>
            <mesh
              position={[side * 0.195, 0.36, -0.04]}
              rotation={[0.35, 0, side * -0.18]}
              castShadow
            >
              <capsuleGeometry args={[0.062, 0.16, 6, 12]} />
              <meshStandardMaterial color={robeMain} roughness={0.58} />
            </mesh>
            <group
              position={[side * 0.125, 0.28, -0.145]}
              rotation={[1.18, side * -0.48, side * -0.42]}
            >
              <mesh castShadow>
                <cylinderGeometry args={[0.068, 0.102, 0.24, 16]} />
                <meshStandardMaterial color={robeMain} roughness={0.58} />
              </mesh>
              <mesh position={[0, -0.118, 0]}>
                <cylinderGeometry args={[0.096, 0.096, 0.016, 16]} />
                <meshStandardMaterial color="#1E110A" roughness={0.85} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Hai bàn tay 5 ngón chắp búp sen trước ngực (Anjali Mudra) */}
        <group
          ref={handsPrayerRef}
          position={[0, 0.36, -0.25]}
          rotation={[0.18, 0, 0]}
          scale={[1.18, 1.18, 1.18]}
        >
          <group position={[-0.017, 0, 0]} rotation={[0, 0, -0.07]}>
            <HandWithFiveFingers side="left" />
          </group>
          <group position={[0.017, 0, 0]} rotation={[0, 0, 0.07]}>
            <HandWithFiveFingers side="right" />
          </group>
        </group>

        {/* ── ĐẦU MASCOT 3D PIXAR-STYLE GẮN TRỰC TIẾP TRÊN THÂN TRÊN (LOCAL Y = 0.76) ── */}
        <group ref={headGroupRef} position={[0, 0.76, 0]}>
          {/* Khuôn mặt Pixar 3D mở mắt */}
          <mesh
            ref={headMeshOpenRef}
            castShadow
            receiveShadow
            rotation={[0, Math.PI / 2, 0]}
            scale={[0.98, 1.03, 0.96]}
          >
            <sphereGeometry args={[0.26, 32, 28]} />
            <meshStandardMaterial
              map={faceOpenTex}
              roughness={0.38}
              metalness={0.02}
            />
          </mesh>

          {/* Khuôn mặt Pixar 3D nhắm mắt khi chớp mắt / cúi lạy */}
          <mesh
            ref={headMeshClosedRef}
            visible={false}
            castShadow
            receiveShadow
            rotation={[0, Math.PI / 2, 0]}
            scale={[0.98, 1.03, 0.96]}
          >
            <sphereGeometry args={[0.26, 32, 28]} />
            <meshStandardMaterial
              map={faceClosedTex}
              roughness={0.38}
              metalness={0.02}
            />
          </mesh>

          {/* Sống mũi & đầu mũi 3D tròn xinh nổi khối */}
          <mesh
            position={[0, -0.018, -0.252]}
            scale={[1.08, 0.88, 0.92]}
            castShadow
          >
            <sphereGeometry args={[0.024, 14, 12]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.36} />
          </mesh>

          {/* Đôi tai 3D tròn trịa hai bên đầu */}
          {[-1, 1].map((side) => (
            <group
              key={`ear-${side}`}
              position={[side * 0.248, -0.012, 0.01]}
              rotation={[0, side * -0.18, side * -0.06]}
            >
              <mesh scale={[0.48, 0.88, 0.65]} castShadow>
                <sphereGeometry args={[0.072, 14, 12]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.4} />
              </mesh>
              <mesh
                position={[side * 0.012, 0, -0.018]}
                scale={[0.35, 0.62, 0.42]}
              >
                <sphereGeometry args={[0.052, 10, 10]} />
                <meshStandardMaterial color={SKIN_CREVICE} roughness={0.48} />
              </mesh>
            </group>
          ))}

          {/* ── TÓC SỢI 3D PIXAR ẤM ÁP THEO GIỚI TÍNH (rotation.x = +0.62 PHỦ KÍN ĐỈNH ĐẦU & SAU GÁY +Z) ── */}
          {gender === "male" ? (
            <group>
              {/* Mũ tóc chính nghiêng về phía sau (+Z, rotation.x = +0.62) ôm kín đỉnh đầu & toàn bộ sau gáy */}
              <mesh
                position={[0, 0.025, 0.02]}
                rotation={[0.62, 0, 0]}
                scale={[1.05, 1.06, 1.07]}
                castShadow
              >
                <sphereGeometry
                  args={[0.266, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.72]}
                />
                <meshStandardMaterial
                  map={hairTex}
                  color="#4A2C1D"
                  roughness={0.72}
                />
              </mesh>

              {/* Khối tóc mái chính uốn phồng liền mạch ngang trán */}
              <mesh
                position={[0.018, 0.182, -0.152]}
                rotation={[0.22, -0.08, -0.12]}
                scale={[1.78, 0.62, 0.96]}
                castShadow
              >
                <sphereGeometry args={[0.118, 20, 16]} />
                <meshStandardMaterial
                  map={hairTex}
                  color="#563422"
                  roughness={0.68}
                />
              </mesh>

              {/* Nếp tóc rẽ ngôi bên trái mềm mại */}
              <mesh
                position={[-0.125, 0.162, -0.145]}
                rotation={[0.24, 0.22, 0.28]}
                scale={[1.22, 0.56, 0.88]}
                castShadow
              >
                <sphereGeometry args={[0.095, 16, 14]} />
                <meshStandardMaterial
                  map={hairTex}
                  color="#4A2C1D"
                  roughness={0.7}
                />
              </mesh>

              {/* Mai tóc gọn gàng hai bên thái dương */}
              {[-1, 1].map((side) => (
                <mesh
                  key={`male-sideburn-${side}`}
                  position={[side * 0.236, 0.042, -0.058]}
                  rotation={[0.15, 0, side * -0.1]}
                  scale={[0.36, 0.95, 0.68]}
                  castShadow
                >
                  <sphereGeometry args={[0.092, 12, 10]} />
                  <meshStandardMaterial color={HAIR_COLOR} roughness={0.72} />
                </mesh>
              ))}
            </group>
          ) : (
            <group>
              {/* Mũ tóc nữ nghiêng về phía sau (+Z, rotation.x = +0.62) ôm trọn đỉnh đầu & sau gáy */}
              <mesh
                position={[0, 0.025, 0.02]}
                rotation={[0.62, 0, 0]}
                scale={[1.06, 1.06, 1.08]}
                castShadow
              >
                <sphereGeometry
                  args={[0.268, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.72]}
                />
                <meshStandardMaterial
                  map={hairTex}
                  color="#4A2C1D"
                  roughness={0.72}
                />
              </mesh>

              {/* Mái tóc nữ uốn chéo liền mạch phủ kín vầng trán */}
              <mesh
                position={[0.024, 0.172, -0.156]}
                rotation={[0.2, -0.08, -0.16]}
                scale={[1.76, 0.58, 0.92]}
                castShadow
              >
                <sphereGeometry args={[0.116, 20, 16]} />
                <meshStandardMaterial
                  map={hairTex}
                  color="#583523"
                  roughness={0.68}
                />
              </mesh>

              {/* Lọn mái phụ bên trái giao nhau mượt mà */}
              <mesh
                position={[-0.122, 0.158, -0.148]}
                rotation={[0.22, 0.2, 0.32]}
                scale={[1.25, 0.54, 0.86]}
                castShadow
              >
                <sphereGeometry args={[0.096, 16, 14]} />
                <meshStandardMaterial
                  map={hairTex}
                  color="#4A2C1D"
                  roughness={0.7}
                />
              </mesh>

              {/* Tóc mai ôm nhẹ thái dương phía trên tai */}
              {[-1, 1].map((side) => (
                <mesh
                  key={`fem-temple-${side}`}
                  position={[side * 0.238, 0.036, -0.062]}
                  rotation={[0.14, 0, side * -0.08]}
                  scale={[0.35, 0.92, 0.66]}
                  castShadow
                >
                  <sphereGeometry args={[0.09, 12, 10]} />
                  <meshStandardMaterial color={HAIR_COLOR} roughness={0.72} />
                </mesh>
              ))}

              {/* Búi tóc tròn đầy đặn trên đỉnh đầu */}
              <mesh
                position={[0, 0.305, 0.025]}
                scale={[1.18, 0.92, 1.1]}
                castShadow
              >
                <sphereGeometry args={[0.126, 22, 18]} />
                <meshStandardMaterial
                  map={hairTex}
                  color="#583523"
                  roughness={0.68}
                />
              </mesh>

              {/* Trâm cài tóc & Đóa Hoa Sen Hồng 3D bên búi tóc */}
              <PinkLotusHairpin />
            </group>
          )}
        </group>
      </group>

      {/* ── 2. TƯ THẾ QUỲ LỄ ĐẶT SÁT KHÍT TRÊN MẶT THẢM (ĐÁY ĐẦU GỐI & BÀN CHÂN TẠI Y = 0.0) ──── */}
      <group ref={seatedBaseRef} position={[0, 0.06, 0.02]}>
        <mesh
          position={[0, 0.09, -0.01]}
          scale={[1.14, 0.62, 1.12]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.265, 20, 14]} />
          <meshStandardMaterial color={robeMain} roughness={0.62} />
        </mesh>

        {[-0.125, 0.125].map((kx, idx) => (
          <mesh
            key={idx}
            position={[kx, 0.0, 0.03]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.88, 1.38, 0.68]}
            castShadow
          >
            <capsuleGeometry args={[0.082, 0.2, 6, 12]} />
            <meshStandardMaterial color={robeDark} roughness={0.65} />
          </mesh>
        ))}

        <group position={[-0.095, -0.01, 0.29]}>
          <FootWithFiveToes side="left" kneeling />
        </group>
        <group position={[0.095, -0.01, 0.29]}>
          <FootWithFiveToes side="right" kneeling />
        </group>
      </group>

      {/* ── 3. ĐÔI CHÂN, ỐNG QUẦN & BÀN CHÂN 5 NGÓN KHI ĐỨNG / ĐI BỘ (ĐÁY BÀN CHÂN TẠI Y = 0.0) ─── */}
      <group ref={standingLegsRef} position={[0, 0.07, 0]} visible={false}>
        <mesh position={[0, 0.24, 0]} rotation={[0, Math.PI, 0]} castShadow>
          <cylinderGeometry args={[0.235, 0.268, 0.32, 22]} />
          <meshStandardMaterial map={robeTunicTex} roughness={0.6} />
        </mesh>
        <group ref={leftFootStepRef} position={[-0.09, -0.05, 0]}>
          <mesh position={[0, 0.09, 0.01]} castShadow>
            <cylinderGeometry args={[0.058, 0.068, 0.16, 12]} />
            <meshStandardMaterial color={robeDark} roughness={0.65} />
          </mesh>
          <FootWithFiveToes side="left" />
        </group>
        <group ref={rightFootStepRef} position={[0.09, -0.05, 0]}>
          <mesh position={[0, 0.09, 0.01]} castShadow>
            <cylinderGeometry args={[0.058, 0.068, 0.16, 12]} />
            <meshStandardMaterial color={robeDark} roughness={0.65} />
          </mesh>
          <FootWithFiveToes side="right" />
        </group>
      </group>
    </group>
  );
}
