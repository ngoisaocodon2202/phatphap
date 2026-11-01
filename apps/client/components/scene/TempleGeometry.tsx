"use client";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useTempleStore, CUSHION_GRID } from "@/stores/templeStore";

useTexture.preload("/textures/buddha_statue_pure.png");

// ── 1. CACHED PROCEDURAL TEXTURES & GEOMETRIES (KHỞI TẠO 1 LẦN DUY NHẤT ĐỂ ĐẠT 60FPS) ──

let cachedFloorTex: THREE.CanvasTexture | null = null;
let cachedCarpetTex: THREE.CanvasTexture | null = null;
let cachedKneelingMatTex: THREE.CanvasTexture | null = null;
let cachedCoupletTex: THREE.CanvasTexture | null = null;
let cachedHorizontalPlaqueTex: THREE.CanvasTexture | null = null;
let cachedSidePlaqueTex: THREE.CanvasTexture | null = null;
let cachedShrineTapestryTex: THREE.CanvasTexture | null = null;
let cachedMandalaHaloTex: THREE.CanvasTexture | null = null;
let cachedWarmGlowTex: THREE.CanvasTexture | null = null;
let cachedSunbeamTex: THREE.CanvasTexture | null = null;
let cachedGoldenBuddhaTex: THREE.CanvasTexture | null = null;
let cachedSutraDeskTex: THREE.CanvasTexture | null = null;
let cachedSutraBookTex: THREE.CanvasTexture | null = null;

// ── TEXTURE KỆ KINH GỖ LIM CHẠM VIỀN VÀNG KIM (ĐẶT PHÍA TRÊN MỖI TẤM THẢM) ──
function createSutraDeskTexture(): THREE.CanvasTexture {
  if (cachedSutraDeskTex) return cachedSutraDeskTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;

  const woodGrad = ctx.createLinearGradient(0, 0, 256, 160);
  woodGrad.addColorStop(0, "#38180B");
  woodGrad.addColorStop(0.5, "#4E2412");
  woodGrad.addColorStop(1, "#2E1308");
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 0, 256, 160);

  // Viền chỉ vàng kim chạm nổi quanh mặt kệ kinh
  ctx.strokeStyle = "#E5B546";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 144);
  ctx.strokeStyle = "#FFF1BE";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, 228, 132);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSutraDeskTex = tex;
  return tex;
}

// ── TEXTURE CUỐN SÁCH KINH PHẬT MỞ TRÊN KỆ (TRANG GIẤY NGÀ + VIỀN GẤM VÀNG + CHỮ KINH) ──
function createSutraBookTexture(): THREE.CanvasTexture {
  if (cachedSutraBookTex) return cachedSutraBookTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 176;
  const ctx = canvas.getContext("2d")!;

  // Bìa gấm vàng hoàng kim & đỏ son bao ngoài cuốn sách kinh
  ctx.fillStyle = "#8C1A11";
  ctx.fillRect(0, 0, 256, 176);
  ctx.strokeStyle = "#F6D58A";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 168);

  // Hai trang giấy kinh màu trắng ngà cổ truyền mở đôi
  ctx.fillStyle = "#FBF3DF";
  ctx.fillRect(14, 12, 110, 152);
  ctx.fillRect(132, 12, 110, 152);

  // Khung viền đỏ son truyền thống của trang sách kinh Phật giáo
  ctx.strokeStyle = "#A62419";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(20, 18, 98, 140);
  ctx.strokeRect(138, 18, 98, 140);

  // Gáy sách ở chính giữa
  const spineGrad = ctx.createLinearGradient(120, 0, 136, 0);
  spineGrad.addColorStop(0, "rgba(60, 28, 12, 0.25)");
  spineGrad.addColorStop(0.5, "rgba(38, 16, 6, 0.72)");
  spineGrad.addColorStop(1, "rgba(60, 28, 12, 0.25)");
  ctx.fillStyle = spineGrad;
  ctx.fillRect(120, 10, 16, 156);

  // Hoa sen vàng ở trang trái & các dòng chữ kinh ở cả 2 trang
  ctx.fillStyle = "#D99B26";
  ctx.beginPath();
  ctx.arc(69, 44, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3A1C0E";
  for (let row = 0; row < 6; row++) {
    const yLeft = 68 + row * 13;
    ctx.fillRect(28, yLeft, 82, 3.2);
  }
  for (let row = 0; row < 8; row++) {
    const yRight = 32 + row * 14;
    ctx.fillRect(146, yRight, 82, 3.2);
  }

  // Dải lụa đỏ đánh dấu trang kinh
  ctx.fillStyle = "#C81E1E";
  ctx.fillRect(126, 12, 4, 158);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSutraBookTex = tex;
  return tex;
}

function createSunbeamTexture(): THREE.CanvasTexture {
  if (cachedSunbeamTex) return cachedSunbeamTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "rgba(255, 244, 206, 0.24)");
  grad.addColorStop(0.45, "rgba(246, 213, 138, 0.12)");
  grad.addColorStop(0.85, "rgba(217, 164, 65, 0.04)");
  grad.addColorStop(1.0, "rgba(217, 164, 65, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSunbeamTex = tex;
  return tex;
}

// ── TEXTURE 100 TẤM THẢM QUỲ: VIỀN GẤM VÀNG KIM BẢN RỘNG + LÕI NHUNG ĐỎ THẫM (CHUẨN ẢNH PREVIEW) ──
function createKneelingMatTexture(): THREE.CanvasTexture {
  if (cachedKneelingMatTex) return cachedKneelingMatTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // 1. Mép nhung đỏ sẫm ngoài cùng
  ctx.fillStyle = "#6E110C";
  ctx.fillRect(0, 0, 256, 256);

  // 2. Bản viền gấm hoàng kim rộng (từ 10px đến 64px mỗi cạnh - đúng chuẩn ảnh Preview)
  const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
  goldGrad.addColorStop(0, "#E5B546");
  goldGrad.addColorStop(0.5, "#F8DC82");
  goldGrad.addColorStop(1, "#D49B2A");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(10, 10, 236, 236);

  // Đường chỉ viền ngoài & trong của bản gấm vàng
  ctx.strokeStyle = "#FFF4C8";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(13, 13, 230, 230);
  ctx.strokeStyle = "#8C5810";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 220, 220);

  // Họa tiết dây hoa văn cổ truyền dệt chìm trên bản viền vàng kim
  ctx.strokeStyle = "rgba(138, 82, 14, 0.58)";
  ctx.lineWidth = 2;
  for (let i = 28; i <= 228; i += 20) {
    ctx.strokeRect(i - 5, 24, 10, 28);
    ctx.strokeRect(i - 5, 204, 10, 28);
    ctx.strokeRect(24, i - 5, 28, 10);
    ctx.strokeRect(204, i - 5, 28, 10);
  }

  // 3. Lõi nhung đỏ son trầm ở trung tâm (từ 62px đến 194px)
  const centerGrad = ctx.createRadialGradient(128, 128, 12, 128, 128, 92);
  centerGrad.addColorStop(0, "#A61C14");
  centerGrad.addColorStop(0.7, "#8A140E");
  centerGrad.addColorStop(1, "#680E09");
  ctx.fillStyle = centerGrad;
  ctx.fillRect(62, 62, 132, 132);

  // Khung chỉ vàng mảnh bao quanh lõi đỏ trung tâm
  ctx.strokeStyle = "#F6D58A";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(62, 62, 132, 132);
  ctx.strokeStyle = "rgba(246, 213, 138, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(68, 68, 120, 120);

  // 4 góc hoa văn kỷ hà vàng kim trong lõi đỏ
  const corners = [
    [78, 78],
    [178, 78],
    [78, 178],
    [178, 178],
  ];
  ctx.fillStyle = "#E8BC52";
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Hoa thị sen vàng nhỏ tinh tế ở tâm lõi đỏ
  ctx.save();
  ctx.translate(128, 128);
  ctx.fillStyle = "rgba(246, 213, 138, 0.42)";
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 8);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6, 12, 0, 22);
    ctx.quadraticCurveTo(-6, 12, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#F6D58A";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedKneelingMatTex = tex;
  return tex;
}

function createWarmGlowTexture(): THREE.CanvasTexture {
  if (cachedWarmGlowTex) return cachedWarmGlowTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0.0, "rgba(255, 246, 205, 0.85)");
  grad.addColorStop(0.35, "rgba(246, 213, 138, 0.42)");
  grad.addColorStop(0.7, "rgba(217, 164, 65, 0.12)");
  grad.addColorStop(1.0, "rgba(217, 164, 65, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedWarmGlowTex = tex;
  return tex;
}

// ── SÀN GỖ ĐÁ NÂU TRẦM ĐÁNH BÓNG (CHUẨN TÔNG MÀU SÀN CHÁNH ĐIỆN TRONG ẢNH PREVIEW) ──
function createStoneFloorTexture(): THREE.CanvasTexture {
  if (cachedFloorTex) return cachedFloorTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "#382014");
  grad.addColorStop(0.5, "#442819");
  grad.addColorStop(1, "#311B10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(246, 213, 138, 0.06)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    const y = (i * 26) % 512;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + 10, 340, y - 10, 512, y + 4);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(18, 8, 4, 0.45)";
  ctx.lineWidth = 2;
  const step = 128;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedFloorTex = tex;
  return tex;
}

// ── THẢM ĐỎ HÀNH LỄ TRUNG TÂM: VIỀN GẤM VÀNG RỘNG + CHUỖI HOA THỊ BÁT GIÁC VÀNG KIM ──
function createCarpetTexture(): THREE.CanvasTexture {
  if (cachedCarpetTex) return cachedCarpetTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Nền nhung đỏ thẫm hoàng gia
  ctx.fillStyle = "#7D140E";
  ctx.fillRect(0, 0, 512, 1024);

  // Hai dải viền gấm vàng kim bản rộng dọc hai bên mép thảm (x: 16..86 và 426..496)
  const goldBorderGrad = ctx.createLinearGradient(0, 0, 512, 0);
  goldBorderGrad.addColorStop(0, "#D9A441");
  goldBorderGrad.addColorStop(0.15, "#F7D980");
  goldBorderGrad.addColorStop(0.5, "#E5B546");
  goldBorderGrad.addColorStop(0.85, "#F7D980");
  goldBorderGrad.addColorStop(1, "#D9A441");
  ctx.fillStyle = goldBorderGrad;
  ctx.fillRect(16, 0, 68, 1024);
  ctx.fillRect(512 - 84, 0, 68, 1024);

  // Đường kẻ chỉ đỏ & vàng sắc nét dọc hai dải biên
  ctx.strokeStyle = "#6E110C";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 0, 52, 1024);
  ctx.strokeRect(512 - 76, 0, 52, 1024);

  ctx.strokeStyle = "#FFF4C8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(92, 0);
  ctx.lineTo(92, 1024);
  ctx.moveTo(512 - 92, 0);
  ctx.lineTo(512 - 92, 1024);
  ctx.stroke();

  // Họa tiết kỷ hà chữ Vạn trên hai dải biên vàng
  ctx.strokeStyle = "rgba(120, 65, 10, 0.65)";
  ctx.lineWidth = 2;
  for (let y = 16; y < 1024; y += 32) {
    ctx.strokeRect(32, y, 36, 20);
    ctx.strokeRect(512 - 68, y, 36, 20);
  }

  // Lõi thảm nhung đỏ trung tâm chia thành 3 ô hoa thị bát giác vàng kim liên tiếp
  const medallionCentersY = [170, 512, 854];
  medallionCentersY.forEach((cy) => {
    // Khung viền góc vàng của mỗi khoang thảm
    ctx.strokeStyle = "rgba(246, 213, 138, 0.72)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(108, cy - 148, 296, 296);

    // Góc triện vàng ở 4 góc khoang
    const boxCorners = [
      [108, cy - 148],
      [380, cy - 148],
      [108, cy + 124],
      [380, cy + 124],
    ];
    ctx.fillStyle = "#E8BC52";
    boxCorners.forEach(([bx, by]) => {
      ctx.fillRect(bx, by, 24, 24);
      ctx.fillStyle = "#7D140E";
      ctx.fillRect(bx + 6, by + 6, 12, 12);
      ctx.fillStyle = "#E8BC52";
    });

    // Hoa thị bát giác thêu vàng kim nổi bật chính giữa (giống hệt ảnh Preview)
    ctx.save();
    ctx.translate(256, cy);

    // Bát giác vàng ngoài
    ctx.fillStyle = "#E5B546";
    ctx.strokeStyle = "#FFF3C4";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const rx = 108;
    const ry = 92;
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / 8;
      const px = Math.cos(a) * rx;
      const py = Math.sin(a) * ry;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lớp viền đỏ mảnh bên trong bát giác
    ctx.strokeStyle = "#7D140E";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / 8;
      const px = Math.cos(a) * (rx * 0.82);
      const py = Math.sin(a) * (ry * 0.82);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 12 cánh sen vàng rực ở tâm hoa thị
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 12);
      ctx.fillStyle = "#FFF0B5";
      ctx.strokeStyle = "#9A6212";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(14, 30, 0, 58);
      ctx.quadraticCurveTo(-14, 30, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#8A140E";
    ctx.strokeStyle = "#FFF3C4";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedCarpetTex = texture;
  return texture;
}

// ── CÂU ĐỐI SƠN ĐEN CHỮ VIỆT VÀNG HOÀNG KIM TRÊN ĐẠI TRỤ GỖ LIM ──
function createCoupletTexture(): THREE.CanvasTexture {
  if (cachedCoupletTex) return cachedCoupletTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d")!;

  // Nền sơn mài đen tuyền ánh nâu cổ điển
  const bg = ctx.createLinearGradient(0, 0, 512, 0);
  bg.addColorStop(0, "#120A06");
  bg.addColorStop(0.5, "#1F120B");
  bg.addColorStop(1, "#120A06");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 2048);

  // Đầu & đuôi câu đối chạm hoa văn khánh vàng
  ctx.fillStyle = "#D9A441";
  ctx.fillRect(16, 16, 480, 136);
  ctx.fillRect(16, 2048 - 184, 480, 168);

  ctx.fillStyle = "#180D08";
  ctx.fillRect(44, 44, 424, 84);

  // Khung viền vàng kim kép
  ctx.strokeStyle = "#D9A441";
  ctx.lineWidth = 18;
  ctx.strokeRect(20, 20, 512 - 40, 2048 - 40);

  ctx.strokeStyle = "#F6D58A";
  ctx.lineWidth = 5;
  ctx.strokeRect(44, 44, 512 - 88, 2048 - 88);

  const words = ["PHẬT", "NHẬT", "TĂNG", "HUY", "PHÁP", "LUÂN", "THƯỜNG", "CHUYỂN"];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  words.forEach((word, idx) => {
    const y = 275 + idx * 196;
    ctx.font = "bold 66px 'Georgia', 'Times New Roman', serif";
    ctx.fillStyle = "#F6D58A";
    ctx.fillText(word, 256, y);

    ctx.strokeStyle = "#B87D1E";
    ctx.lineWidth = 2;
    ctx.strokeText(word, 256, y);
  });

  // Đài sen vàng chạm nổi dưới chân câu đối
  ctx.save();
  ctx.translate(256, 1910);
  ctx.fillStyle = "#F6D58A";
  ctx.strokeStyle = "#8C5410";
  ctx.lineWidth = 4;
  [-0.75, -0.38, 0, 0.38, 0.75].forEach((ang) => {
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(36, -44, 0, -104);
    ctx.quadraticCurveTo(-36, -44, 0, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedCoupletTex = texture;
  return texture;
}

// ── BỨC HOÀNH PHI VÀNG KIM CHỮ VIỆT ĐEN TREO THẲNG HAI BÊN & CHÍNH GIỮA ──
function createHorizontalPlaqueTexture(isSide = false): THREE.CanvasTexture {
  if (!isSide && cachedHorizontalPlaqueTex) return cachedHorizontalPlaqueTex;
  if (isSide && cachedSidePlaqueTex) return cachedSidePlaqueTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;

  // Khung gỗ chạm rồng bên ngoài
  ctx.fillStyle = "#4A2210";
  ctx.fillRect(0, 0, 1024, 384);

  // Nền thếp vàng rực rỡ bên trong
  const goldGrad = ctx.createLinearGradient(0, 0, 1024, 384);
  goldGrad.addColorStop(0, "#C88E26");
  goldGrad.addColorStop(0.5, "#F5CD68");
  goldGrad.addColorStop(1, "#BA7E1C");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(36, 36, 1024 - 72, 384 - 72);

  ctx.strokeStyle = "#FFF2BE";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, 1024 - 80, 384 - 80);

  ctx.strokeStyle = "#5C2C12";
  ctx.lineWidth = 6;
  ctx.strokeRect(56, 56, 1024 - 112, 384 - 112);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = isSide
    ? "bold 104px 'Georgia', 'Times New Roman', serif"
    : "bold 82px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "#1E0E07";
  const text = isSide ? "TỪ BI HỶ XẢ" : "ĐẠI HÙNG BẢO ĐIỆN";
  ctx.fillText(text, 512, 196);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (isSide) cachedSidePlaqueTex = tex;
  else cachedHorizontalPlaqueTex = tex;
  return tex;
}

// ── TRANH GẤM ĐỎ THÊU VÀNG TRONG KHÁM THỜ PHỤ HAI BÊN (TẢ - HỮU) ──
function createShrineTapestryTexture(): THREE.CanvasTexture {
  if (cachedShrineTapestryTex) return cachedShrineTapestryTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, "#7A1610");
  bg.addColorStop(0.5, "#961E16");
  bg.addColorStop(1, "#5E0E09");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 512);

  // Viền gấm vàng kim chạm trổ
  ctx.strokeStyle = "#E5B546";
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 232, 488);

  ctx.strokeStyle = "#FFF3C4";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 208, 464);

  // Họa tiết mây rồng & hoa sen vàng ở tâm khám thờ phụ
  ctx.save();
  ctx.translate(128, 240);
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 95);
  glow.addColorStop(0, "rgba(255, 242, 190, 0.85)");
  glow.addColorStop(0.6, "rgba(229, 181, 70, 0.45)");
  glow.addColorStop(1, "rgba(150, 30, 22, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 95, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 16; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 16);
    ctx.fillStyle = "#F6D58A";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, 38, 0, 76);
    ctx.quadraticCurveTo(-10, 38, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedShrineTapestryTex = tex;
  return tex;
}

function createMandalaHaloTexture(): THREE.CanvasTexture {
  if (cachedMandalaHaloTex) return cachedMandalaHaloTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const cx = 256;
  const cy = 256;

  const bgGlow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 250);
  bgGlow.addColorStop(0.0, "rgba(255, 248, 210, 1.0)");
  bgGlow.addColorStop(0.45, "rgba(246, 213, 138, 0.95)");
  bgGlow.addColorStop(0.76, "rgba(217, 164, 65, 0.88)");
  bgGlow.addColorStop(0.9, "rgba(180, 115, 28, 0.45)");
  bgGlow.addColorStop(1.0, "rgba(180, 115, 28, 0.0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(cx, cy);

  const rings = [70, 105, 142, 182, 208, 220];
  rings.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? "#8C5410" : "#FFF3C4";
    ctx.lineWidth = idx === 3 || idx === 4 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let i = 0; i < 24; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 24);
    ctx.strokeStyle = "rgba(130, 72, 12, 0.65)";
    ctx.fillStyle = "rgba(255, 242, 190, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.quadraticCurveTo(14, 125, 0, 180);
    ctx.quadraticCurveTo(-14, 125, 0, 70);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 36; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 36);
    ctx.strokeStyle = "#7A460A";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 195, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedMandalaHaloTex = tex;
  return tex;
}

let sharedStatuePetalGeo: THREE.ExtrudeGeometry | null = null;
function getSharedStatuePetalGeo(): THREE.ExtrudeGeometry {
  if (sharedStatuePetalGeo) return sharedStatuePetalGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.22, 0.18, 0.15, 0.45);
  shape.quadraticCurveTo(0, 0.58, 0, 0.62);
  shape.quadraticCurveTo(0, 0.58, -0.15, 0.45);
  shape.quadraticCurveTo(-0.22, 0.18, 0, 0);
  sharedStatuePetalGeo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.035,
    bevelEnabled: false,
  });
  return sharedStatuePetalGeo;
}

// ── 2. BẢO TƯỢNG PHẬT THÍCH CA MÂU NI HOÀNG KIM 24K & ĐÀI SEN 3D ───────────────
function GoldenBuddha({ position }: { position: [number, number, number] }) {
  const rawStatueTexture = useTexture("/textures/buddha_statue_pure.png");
  const haloRef = useRef<THREE.Group>(null);
  const [goldenStatueTex, setGoldenStatueTex] = useState<THREE.Texture>(
    cachedGoldenBuddhaTex || rawStatueTexture
  );

  useEffect(() => {
    if (cachedGoldenBuddhaTex) {
      setGoldenStatueTex(cachedGoldenBuddhaTex);
      return;
    }
    const img = rawStatueTexture.image as HTMLImageElement | undefined;
    if (!img || typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    const w = 512;
    const h = 682;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      const ny = y / h;
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a < 12) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        const isHairRegion = ny < 0.23 && lum < 0.26 && b >= r * 0.65;
        if (isHairRegion) {
          data[idx] = Math.round(45 + lum * 90);
          data[idx + 1] = Math.round(32 + lum * 70);
          data[idx + 2] = Math.round(22 + lum * 50);
          continue;
        }

        if (ny > 0.7) {
          lum = Math.min(1.0, Math.pow(lum, 0.62) * 1.28 + 0.08);
        } else {
          lum = Math.min(1.0, Math.pow(lum, 0.74) * 1.15 + 0.05);
        }

        let gr: number, gg: number, gb: number;
        if (lum < 0.45) {
          const t = lum / 0.45;
          gr = 88 + t * (205 - 88);
          gg = 48 + t * (142 - 48);
          gb = 12 + t * (42 - 12);
        } else if (lum < 0.82) {
          const t = (lum - 0.45) / 0.37;
          gr = 205 + t * (248 - 205);
          gg = 142 + t * (215 - 142);
          gb = 42 + t * (128 - 42);
        } else {
          const t = (lum - 0.82) / 0.18;
          gr = 248 + t * (255 - 248);
          gg = 215 + t * (248 - 215);
          gb = 128 + t * (215 - 128);
        }

        data[idx] = Math.min(255, Math.round(gr));
        data[idx + 1] = Math.min(255, Math.round(gg));
        data[idx + 2] = Math.min(255, Math.round(gb));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const processedTex = new THREE.CanvasTexture(canvas);
    processedTex.colorSpace = THREE.SRGBColorSpace;
    processedTex.needsUpdate = true;
    cachedGoldenBuddhaTex = processedTex;
    setGoldenStatueTex(processedTex);
  }, [rawStatueTexture]);

  const mandalaHaloTex = useMemo(() => createMandalaHaloTexture(), []);
  const lotusPetal3D = useMemo(() => getSharedStatuePetalGeo(), []);

  useFrame(({ clock }) => {
    if (haloRef.current) {
      haloRef.current.rotation.z =
        Math.sin(clock.getElapsedTime() * 0.18) * 0.015;
    }
  });

  return (
    <group position={position} scale={[1.22, 1.22, 1.22]}>
      {/* Đài sen vàng kim 3D đa tầng */}
      <group position={[0, 0.25, 0.12]}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[1.65, 1.88, 0.32, 16]} />
          <meshStandardMaterial color="#9A6818" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.52, 1.62, 0.24, 20]} />
          <meshStandardMaterial color="#D9A441" metalness={0.82} roughness={0.22} />
        </mesh>
        {[...Array(16)].map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh
                geometry={lotusPetal3D}
                position={[0, -0.05, 1.48]}
                rotation={[0.38, 0, 0]}
              >
                <meshStandardMaterial
                  color="#E5B44B"
                  emissive="#8C5812"
                  emissiveIntensity={0.35}
                  metalness={0.75}
                  roughness={0.25}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Bảo tượng Đức Phật Thích Ca Mâu Ni hoàng kim */}
      <mesh position={[0, 2.28, 0.22]}>
        <planeGeometry args={[3.55, 4.85]} />
        <meshStandardMaterial
          map={goldenStatueTex}
          transparent
          alphaTest={0.03}
          roughness={0.24}
          metalness={0.45}
          emissive="#B87D1E"
          emissiveIntensity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Đại Hào Quang Mạn Đà La Pháp Luân */}
      <group ref={haloRef} position={[0, 2.85, -0.05]}>
        <mesh>
          <planeGeometry args={[4.45, 4.45]} />
          <meshBasicMaterial
            map={mandalaHaloTex}
            transparent
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <torusGeometry args={[1.76, 0.055, 12, 48]} />
          <meshStandardMaterial
            color="#F6D58A"
            emissive="#D9A441"
            emissiveIntensity={0.75}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── 3. LÀN KHÓI HƯƠNG TRẦM UYỂN CHUYỂN (VOLUMETRIC INCENSE SMOKE) ───────────────
let cachedSmokeTex: THREE.CanvasTexture | null = null;
function getSmokeTexture(): THREE.CanvasTexture | null {
  if (cachedSmokeTex) return cachedSmokeTex;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 250, 240, 0.65)");
  grad.addColorStop(0.5, "rgba(235, 225, 215, 0.28)");
  grad.addColorStop(1, "rgba(235, 225, 215, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  cachedSmokeTex = new THREE.CanvasTexture(canvas);
  return cachedSmokeTex;
}

function IncenseSmoke({ position }: { position: [number, number, number] }) {
  const count = 32;
  const smokeRef = useRef<THREE.Points>(null);
  const smokeTexture = useMemo(() => getSmokeTexture(), []);

  const [geo, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = (i / count) * 1.45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      spd[i] = 0.22 + Math.random() * 0.14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return [g, spd];
  }, []);

  useFrame(({ clock }, dt) => {
    if (!smokeRef.current) return;
    const attr = smokeRef.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx + 1] += speeds[i] * dt;
      const h = arr[idx + 1];
      arr[idx + 0] = Math.sin(t * 1.4 + h * 3.5 + i) * (0.02 + h * 0.065);
      arr[idx + 2] = Math.cos(t * 1.2 + h * 2.8 + i) * (0.02 + h * 0.045);

      if (arr[idx + 1] > 1.45) {
        arr[idx + 1] = 0;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <group position={position}>
      <points ref={smokeRef} geometry={geo}>
        <pointsMaterial
          map={smokeTexture ?? undefined}
          color="#F5EFE6"
          size={0.32}
          transparent
          opacity={0.52}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}

// ── 4. BÀN THỜ TAM BẢO CHẠM RỒNG THẾP VÀNG, ĐÔN MÕ GỖ & ĐÔN CHUÔNG GIA TRÌ (CHUẨN ẢNH PREVIEW) ──
function AltarTable({ position }: { position: [number, number, number] }) {
  const moktakRinging = useTempleStore((s) => s.moktakRinging);
  const bellRinging = useTempleStore((s) => s.bellRinging);

  return (
    <group position={position} scale={[1.22, 1.12, 1.15]}>
      {/* Bệ tam cấp đá nâu đỡ bàn thờ */}
      <mesh receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[5.4, 0.2, 1.72]} />
        <meshStandardMaterial color="#26130A" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Thân bàn thờ chính chạm khắc gỗ sơn son thếp vàng rực rỡ */}
      <mesh receiveShadow castShadow position={[0, 0.64, 0]}>
        <boxGeometry args={[2.85, 0.88, 1.38]} />
        <meshStandardMaterial color="#4A2210" roughness={0.38} metalness={0.28} />
      </mesh>
      {/* Khung diềm vàng kim mặt trước bàn thờ */}
      <mesh position={[0, 0.66, 0.7]}>
        <boxGeometry args={[2.76, 0.76, 0.04]} />
        <meshStandardMaterial
          color="#D9A441"
          emissive="#8C5410"
          emissiveIntensity={0.28}
          metalness={0.82}
          roughness={0.24}
        />
      </mesh>
      {/* 3 Ô chạm nổi Cửu Long vàng kim trước bàn thờ */}
      {[-0.86, 0, 0.86].map((px, idx) => (
        <group key={idx} position={[px, 0.66, 0.73]}>
          <mesh>
            <boxGeometry args={[0.74, 0.56, 0.03]} />
            <meshStandardMaterial color="#5E1912" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.64, 0.44, 0.025]} />
            <meshStandardMaterial
              color="#F6D58A"
              emissive="#B87D1E"
              emissiveIntensity={0.35}
              metalness={0.86}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      {/* 4 Chân quỳ dạ cá thếp vàng */}
      {[
        [-1.34, 0.38, 0.66],
        [1.34, 0.38, 0.66],
        [-1.34, 0.38, -0.66],
        [1.34, 0.38, -0.66],
      ].map((lp, idx) => (
        <mesh key={`leg-${idx}`} position={lp as [number, number, number]}>
          <cylinderGeometry args={[0.09, 0.07, 0.76, 10]} />
          <meshStandardMaterial color="#E5B546" metalness={0.85} roughness={0.22} />
        </mesh>
      ))}

      {/* Mặt bàn thờ gỗ lim viền vàng */}
      <mesh receiveShadow position={[0, 1.12, 0]}>
        <boxGeometry args={[3.05, 0.09, 1.52]} />
        <meshStandardMaterial color="#3B1A0C" roughness={0.32} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.12, 0.77]}>
        <boxGeometry args={[3.08, 0.055, 0.04]} />
        <meshStandardMaterial color="#F6D58A" metalness={0.88} roughness={0.18} />
      </mesh>

      {/* Án thượng tầng 2 đỡ bình hoa, đèn thờ và lư hương */}
      <mesh receiveShadow position={[0, 1.36, -0.22]}>
        <boxGeometry args={[4.4, 0.4, 0.92]} />
        <meshStandardMaterial color="#34160A" roughness={0.38} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.56, 0.25]}>
        <boxGeometry args={[4.44, 0.05, 0.04]} />
        <meshStandardMaterial color="#E5B546" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* ĐÔN GỖ TẢ (X = -1.92): ĐỠ ĐẠI MÕ GỖ CHẠM RỒNG TRÊN ĐỆM GẤM ĐỎ (CHUẨN ẢNH PREVIEW) */}
      <group position={[-1.92, 0, 0.18]}>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.72, 0.88, 0.72]} />
          <meshStandardMaterial color="#381A0E" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.78, 0.06, 0.78]} />
          <meshStandardMaterial color="#D9A441" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Đệm gấm đỏ thêu vàng đỡ Mõ */}
        <mesh position={[0, 0.96, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.12, 16]} />
          <meshStandardMaterial color="#9E1B14" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.96, 0]}>
          <torusGeometry args={[0.31, 0.025, 8, 20]} />
          <meshStandardMaterial color="#F6D58A" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Đại Mõ Gỗ Điêu Khắc */}
        <mesh
          position={[0, 1.18, 0]}
          scale={[1.15, 0.92, 0.95]}
          rotation={[0, 0, moktakRinging ? 0.14 : 0]}
        >
          <sphereGeometry args={[0.25, 16, 14]} />
          <meshStandardMaterial color="#7C3A18" roughness={0.35} metalness={0.15} />
        </mesh>
      </group>

      {/* ĐÔN GỖ HỮU (X = +1.92): ĐỠ ĐẠI HỒNG CHUNG GIA TRÌ ĐỒNG ĐEN TRÊN ĐỆM GẤM ĐỎ (CHUẨN ẢNH PREVIEW) */}
      <group position={[1.92, 0, 0.18]}>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.72, 0.88, 0.72]} />
          <meshStandardMaterial color="#381A0E" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.78, 0.06, 0.78]} />
          <meshStandardMaterial color="#D9A441" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Đệm gấm đỏ thêu vàng đỡ Chuông Gia Trì */}
        <mesh position={[0, 0.96, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.12, 16]} />
          <meshStandardMaterial color="#9E1B14" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.96, 0]}>
          <torusGeometry args={[0.31, 0.025, 8, 20]} />
          <meshStandardMaterial color="#F6D58A" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Bát Chuông Gia Trì Đồng Đen Ánh Vàng */}
        <mesh
          position={[0, 1.2, 0]}
          rotation={[0, 0, bellRinging ? 0.08 : 0]}
        >
          <cylinderGeometry args={[0.28, 0.2, 0.38, 20]} />
          <meshStandardMaterial color="#2B2118" roughness={0.25} metalness={0.78} />
        </mesh>
        <mesh position={[0, 1.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.022, 8, 24]} />
          <meshStandardMaterial color="#D9A441" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Lư Hương Đồng Tai Rồng Chính Giữa & Hai Làn Khói Hương Trầm Đối Xứng */}
      <group position={[0, 1.18, 0.28]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 0.16, 14]} />
          <meshStandardMaterial color="#7A4B14" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.25, 0]} scale={[1, 0.78, 1]}>
          <sphereGeometry args={[0.26, 16, 14]} />
          <meshStandardMaterial color="#C8922E" metalness={0.84} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <torusGeometry args={[0.21, 0.03, 8, 18]} />
          <meshStandardMaterial color="#F6D58A" metalness={0.88} roughness={0.18} />
        </mesh>
        <IncenseSmoke position={[0, 0.58, 0]} />
      </group>

      {/* Hai Đỉnh Hương Trầm Tỏa Khói Hai Bên Bảo Tượng (giống hệt 2 làn khói trắng trong ảnh Preview) */}
      {[-1.45, 1.45].map((sx, idx) => (
        <group key={`side-smoke-${idx}`} position={[sx, 1.58, -0.18]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 0.32, 12]} />
            <meshStandardMaterial color="#D9A441" metalness={0.85} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial color="#FFF3C4" />
          </mesh>
          <IncenseSmoke position={[0, 0.45, 0]} />
        </group>
      ))}

      {/* Cặp Nến Đỏ Thắp Sáng & Mâm Ngũ Quả */}
      {[-0.48, 0.48].map((cx, idx) => (
        <group key={`candle-${idx}`} position={[cx, 1.18, 0.32]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.04, 0.08, 0.24, 10]} />
            <meshStandardMaterial color="#D9A441" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.24, 8]} />
            <meshStandardMaterial color="#DC2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.49, 0]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshBasicMaterial color="#FFF5C0" />
          </mesh>
        </group>
      ))}

      {[-0.95, 0.95].map((fx, sideIdx) => (
        <group key={sideIdx} position={[fx, 1.18, 0.24]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#B88228" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.3, 0.14, 0.06, 14]} />
            <meshStandardMaterial color="#D9A441" metalness={0.82} roughness={0.22} />
          </mesh>
          {[
            { pos: [0, 0.23, 0], color: "#EAB308", r: 0.072 },
            { pos: [-0.11, 0.21, 0.06], color: "#EA580C", r: 0.065 },
            { pos: [0.11, 0.21, 0.06], color: "#DC2626", r: 0.065 },
            { pos: [-0.08, 0.21, -0.08], color: "#65A30D", r: 0.064 },
            { pos: [0.08, 0.21, -0.08], color: "#22C55E", r: 0.064 },
            { pos: [0, 0.32, 0], color: "#F97316", r: 0.064 },
          ].map((fr, k) => (
            <mesh key={k} position={fr.pos as [number, number, number]}>
              <sphereGeometry args={[fr.r, 10, 10]} />
              <meshStandardMaterial color={fr.color} roughness={0.38} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── 5. KHÁM THỜ CHẠM RỒNG PHƯỢNG VÀNG KIM CHÍNH GIỮA & HAI KHÁM THỜ PHỤ TẢ - HỮU (CHUẨN ẢNH PREVIEW) ──
function OrnateGoldenShrineBackwall() {
  const mainPlaqueTex = useMemo(() => createHorizontalPlaqueTexture(false), []);
  const sidePlaqueTex = useMemo(() => createHorizontalPlaqueTexture(true), []);
  const shrineTapestryTex = useMemo(() => createShrineTapestryTexture(), []);

  return (
    <group position={[0, 0, -5.35]}>
      {/* Bức vách gỗ lim hậu cung khép kín toàn bộ chiều ngang Chánh Điện rộng 23.2m */}
      <mesh receiveShadow position={[0, 4.6, -0.35]}>
        <boxGeometry args={[23.2, 9.4, 0.32]} />
        <meshStandardMaterial color="#2C150C" roughness={0.55} />
      </mesh>

      {/* ── KHÁM THỜ TRUNG TÂM ĐỠ BẢO TƯỢNG PHẬT THÍCH CA ── */}
      <group position={[0, 3.85, 0]} scale={[1.24, 1.2, 1.15]}>
        {/* Phông gỗ trầm ấm phía sau Hào Quang */}
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[4.5, 5.4, 0.12]} />
          <meshStandardMaterial color="#4A2512" roughness={0.48} />
        </mesh>

        {/* Hai cột khám thờ chạm rồng vàng kim hai bên Tượng Phật */}
        {[-2.15, 2.15].map((cx, i) => (
          <group key={`arch-col-${i}`} position={[cx, 0, 0.06]}>
            <mesh>
              <boxGeometry args={[0.34, 5.4, 0.22]} />
              <meshStandardMaterial
                color="#D9A441"
                emissive="#8C5410"
                emissiveIntensity={0.32}
                metalness={0.84}
                roughness={0.24}
              />
            </mesh>
            {/* Dải chạm lọng rồng mây vàng rực rỡ */}
            <mesh position={[i === 0 ? 0.22 : -0.22, 0.4, 0.05]}>
              <boxGeometry args={[0.24, 4.2, 0.12]} />
              <meshStandardMaterial
                color="#F6D58A"
                emissive="#B87D1E"
                emissiveIntensity={0.4}
                metalness={0.86}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}

        {/* Vòm cửa võng chạm Cửu Long vàng kim phía trên đầu Tượng Phật */}
        <mesh position={[0, 2.52, 0.08]}>
          <boxGeometry args={[4.68, 0.56, 0.26]} />
          <meshStandardMaterial
            color="#E5B546"
            emissive="#9A6212"
            emissiveIntensity={0.38}
            metalness={0.86}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0, 2.12, 0.12]}>
          <boxGeometry args={[3.9, 0.36, 0.18]} />
          <meshStandardMaterial
            color="#F6D58A"
            emissive="#B87D1E"
            emissiveIntensity={0.42}
            metalness={0.88}
            roughness={0.18}
          />
        </mesh>

        {/* Bức Hoành Phi Trung Tâm "ĐẠI HÙNG BẢO ĐIỆN" trên đỉnh khám thờ */}
        <group position={[0, 3.22, 0.22]}>
          <mesh>
            <boxGeometry args={[2.95, 0.92, 0.1]} />
            <meshStandardMaterial color="#3B1A0E" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <planeGeometry args={[2.86, 0.84]} />
            <meshStandardMaterial
              map={mainPlaqueTex}
              roughness={0.28}
              metalness={0.5}
              emissive="#D9A441"
              emissiveIntensity={0.28}
            />
          </mesh>
        </group>
      </group>

      {/* ── HAI KHÁM THỜ PHỤ TẢ - HỮU (X = ±5.65) MỞ RỘNG KHOÁNG ĐẠT VỚI TRANH GẤM ĐỎ VÀNG ── */}
      {[-5.65, 5.65].map((sx, idx) => (
        <group
          key={`side-shrine-${idx}`}
          position={[sx, 0, -0.05]}
          scale={[1.38, 1.22, 1.15]}
        >
          {/* Khung khám thờ phụ thếp vàng */}
          <mesh position={[0, 2.75, 0.02]}>
            <boxGeometry args={[2.25, 3.8, 0.16]} />
            <meshStandardMaterial
              color="#D9A441"
              emissive="#7A480C"
              emissiveIntensity={0.28}
              metalness={0.82}
              roughness={0.26}
            />
          </mesh>
          {/* Tranh gấm đỏ thêu hoa văn vàng kim bên trong khám thờ phụ */}
          <mesh position={[0, 2.72, 0.11]}>
            <planeGeometry args={[1.92, 3.35]} />
            <meshStandardMaterial
              map={shrineTapestryTex}
              roughness={0.35}
              metalness={0.3}
              emissive="#B87D1E"
              emissiveIntensity={0.25}
            />
          </mesh>
          {/* Hoành phi đỏ chữ vàng phía trên khám thờ phụ */}
          <group position={[0, 5.05, 0.1]}>
            <mesh>
              <boxGeometry args={[2.35, 0.78, 0.08]} />
              <meshStandardMaterial color="#6E140E" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[2.24, 0.68]} />
              <meshStandardMaterial
                map={sidePlaqueTex}
                roughness={0.3}
                metalness={0.45}
                emissive="#D9A441"
                emissiveIntensity={0.22}
              />
            </mesh>
          </group>
          {/* Bàn thờ gỗ lim & đèn lưu ly ấm dưới khám thờ phụ */}
          <mesh position={[0, 0.55, 0.35]}>
            <boxGeometry args={[2.3, 1.1, 0.76]} />
            <meshStandardMaterial color="#2B140A" roughness={0.48} />
          </mesh>
          {[-0.65, 0.65].map((lx, lIdx) => (
            <group key={lIdx} position={[lx, 1.25, 0.42]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.07, 0.1, 0.24, 10]} />
                <meshStandardMaterial color="#D9A441" metalness={0.85} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.11, 12, 12]} />
                <meshBasicMaterial color="#FFF0B8" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── 6. HỆ THỐNG 100 TẤM THẢM QUỲ LỄ + 100 KỆ KINH GỖ & 100 CUỐN SÁCH KINH NẰM TRÊN KỆ (INSTANCED MESH 60FPS) ──
function InstancedKneelingMats({ targetId }: { targetId?: number }) {
  const matMeshRef = useRef<THREE.InstancedMesh>(null);
  const trimMeshRef = useRef<THREE.InstancedMesh>(null);
  const deskLegsMeshRef = useRef<THREE.InstancedMesh>(null);
  const deskTopMeshRef = useRef<THREE.InstancedMesh>(null);
  const sutraBookMeshRef = useRef<THREE.InstancedMesh>(null);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const kneelingMatTex = useMemo(() => createKneelingMatTexture(), []);
  const sutraDeskTex = useMemo(() => createSutraDeskTexture(), []);
  const sutraBookTex = useMemo(() => createSutraBookTexture(), []);

  useEffect(() => {
    const matMesh = matMeshRef.current;
    const trimMesh = trimMeshRef.current;
    const deskLegsMesh = deskLegsMeshRef.current;
    const deskTopMesh = deskTopMeshRef.current;
    const sutraBookMesh = sutraBookMeshRef.current;
    if (!matMesh || !trimMesh || !deskLegsMesh || !deskTopMesh || !sutraBookMesh)
      return;

    const dummy = new THREE.Object3D();
    CUSHION_GRID.forEach((c, idx) => {
      // 1. Đế nhung đỏ trầm phía dưới tấm thảm quỳ
      dummy.position.set(c.x, 0.018, c.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trimMesh.setMatrixAt(idx, dummy.matrix);

      // 2. Mặt thảm gấm viền vàng kim bản rộng + lõi đỏ thẫm bên trên
      dummy.position.set(c.x, 0.042, c.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      matMesh.setMatrixAt(idx, dummy.matrix);

      // 3. Kệ Kinh Gỗ (Án kinh thấp đặt ngay ở phía trên / trước mặt mỗi tấm thảm tại c.z - 0.44)
      const deskZ = c.z - 0.44;
      // Chân kệ bên trái
      dummy.position.set(c.x - 0.21, 0.115, deskZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      deskLegsMesh.setMatrixAt(idx * 2, dummy.matrix);
      // Chân kệ bên phải
      dummy.position.set(c.x + 0.21, 0.115, deskZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      deskLegsMesh.setMatrixAt(idx * 2 + 1, dummy.matrix);

      // Mặt kệ kinh gỗ lim viền vàng hơi nghiêng về phía Phật tử ngồi quỳ
      dummy.position.set(c.x, 0.23, deskZ);
      dummy.rotation.set(0.2, 0, 0);
      dummy.updateMatrix();
      deskTopMesh.setMatrixAt(idx, dummy.matrix);

      // 4. Cuốn Sách Kinh Phật mở sẵn nằm trang nghiêm trên mặt kệ kinh
      dummy.position.set(c.x, 0.256, deskZ + 0.006);
      dummy.rotation.set(0.2, 0, 0);
      dummy.updateMatrix();
      sutraBookMesh.setMatrixAt(idx, dummy.matrix);
    });

    trimMesh.instanceMatrix.needsUpdate = true;
    matMesh.instanceMatrix.needsUpdate = true;
    deskLegsMesh.instanceMatrix.needsUpdate = true;
    deskTopMesh.instanceMatrix.needsUpdate = true;
    sutraBookMesh.instanceMatrix.needsUpdate = true;
  }, []);

  const handleSelectOrOpenBook = (idx: number | undefined) => {
    if (idx === undefined || !CUSHION_GRID[idx]) return;
    const cushion = CUSHION_GRID[idx];
    const store = useTempleStore.getState();
    const dst = Math.hypot(
      cushion.x - store.localPlayerPos.x,
      cushion.z - store.localPlayerPos.z
    );
    // Nếu đang ngồi ngay tại tấm thảm đó thì mở luôn cuốn Sách Kinh để đọc
    if (dst <= 0.65 && (store.localAction === "sit" || store.isMeditating)) {
      store.setSutraModalOpen(true);
    } else {
      store.navigateToSpecificCushion(cushion, "sit");
    }
  };

  const activeMat =
    hoveredIdx !== null && CUSHION_GRID[hoveredIdx]
      ? CUSHION_GRID[hoveredIdx]
      : targetId !== undefined
      ? CUSHION_GRID.find((c) => c.id === targetId) ?? null
      : null;

  return (
    <group>
      {/* Đế thành nệm nhung đỏ sẫm (100 tấm trong 1 draw call) */}
      <instancedMesh
        ref={trimMeshRef}
        args={[undefined, undefined, CUSHION_GRID.length]}
        receiveShadow
      >
        <boxGeometry args={[1.04, 0.038, 0.74]} />
        <meshStandardMaterial color="#6E110C" roughness={0.78} />
      </instancedMesh>

      {/* Mặt thảm gấm viền vàng kim bản rộng (100 tấm trong 1 draw call) */}
      <instancedMesh
        ref={matMeshRef}
        args={[undefined, undefined, CUSHION_GRID.length]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && CUSHION_GRID[e.instanceId]) {
            useTempleStore
              .getState()
              .navigateToSpecificCushion(CUSHION_GRID[e.instanceId], "sit");
          }
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
            setHoveredIdx(e.instanceId);
          }
        }}
        onPointerOut={() => setHoveredIdx(null)}
      >
        <boxGeometry args={[1.0, 0.034, 0.7]} />
        <meshStandardMaterial
          map={kneelingMatTex}
          roughness={0.48}
          metalness={0.22}
        />
      </instancedMesh>

      {/* 200 Chân kệ kinh gỗ lim (cho 100 kệ kinh đặt phía trên 100 tấm thảm) */}
      <instancedMesh
        ref={deskLegsMeshRef}
        args={[undefined, undefined, CUSHION_GRID.length * 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.042, 0.22, 0.24]} />
        <meshStandardMaterial color="#36170A" roughness={0.52} />
      </instancedMesh>

      {/* 100 Mặt kệ kinh gỗ lim viền vàng đặt ở phía trên mỗi tấm thảm */}
      <instancedMesh
        ref={deskTopMeshRef}
        args={[undefined, undefined, CUSHION_GRID.length]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          handleSelectOrOpenBook(e.instanceId);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
            setHoveredIdx(e.instanceId);
          }
        }}
        onPointerOut={() => setHoveredIdx(null)}
      >
        <boxGeometry args={[0.52, 0.026, 0.29]} />
        <meshStandardMaterial
          map={sutraDeskTex}
          roughness={0.38}
          metalness={0.2}
        />
      </instancedMesh>

      {/* 100 Cuốn Sách Kinh Phật nằm trên 100 kệ kinh */}
      <instancedMesh
        ref={sutraBookMeshRef}
        args={[undefined, undefined, CUSHION_GRID.length]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          handleSelectOrOpenBook(e.instanceId);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
            setHoveredIdx(e.instanceId);
          }
        }}
        onPointerOut={() => setHoveredIdx(null)}
      >
        <boxGeometry args={[0.36, 0.024, 0.22]} />
        <meshStandardMaterial
          map={sutraBookTex}
          roughness={0.42}
          metalness={0.12}
        />
      </instancedMesh>

      {/* Khung sáng vàng kim khi di chuột hoặc chọn tấm thảm */}
      {activeMat && (
        <mesh
          position={[activeMat.x, 0.066, activeMat.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.52, 0.6, 4]} />
          <meshBasicMaterial
            color="#F6D58A"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ── 7. HÀNH LANG CHÁNH ĐIỆN MỞ TOANG HAI BÊN (X = ±10.85): BẢNG HOÀNH PHI TREO THẲNG NGAY NGẮN & LAN CAN ĐÁ THẤP ──
function OpenSanctuaryVerandaSide({ side }: { side: "left" | "right" }) {
  const s = side === "left" ? -1 : 1;
  const timeOfDay = useTempleStore((st) => st.timeOfDay);
  const weatherCondition = useTempleStore((st) => st.weatherCondition);
  const sunbeamTex = useMemo(() => createSunbeamTexture(), []);
  const sidePlaqueTex = useMemo(() => createHorizontalPlaqueTexture(true), []);

  const showSunbeams =
    weatherCondition !== "rain" &&
    ((timeOfDay === "morning" && side === "right") ||
      (timeOfDay === "afternoon" && side === "left") ||
      timeOfDay === "noon");

  return (
    <group position={[s * 10.85, 0, 0]}>
      {/* Bậc thềm đá xanh & lan can đá thấp chạm sen (cao 0.36m) mở toang tầm nhìn ra hồ sen & cây Bồ Đề hai bên */}
      <mesh receiveShadow position={[s * 0.25, 0.08, 5.5]}>
        <boxGeometry args={[0.75, 0.16, 26.0]} />
        <meshStandardMaterial color="#7C756B" roughness={0.65} />
      </mesh>
      <mesh receiveShadow position={[0, 0.24, 5.5]}>
        <boxGeometry args={[0.22, 0.16, 25.2]} />
        <meshStandardMaterial color="#948D82" roughness={0.58} />
      </mesh>

      {/* Hàng trụ đá búp sen thấp dọc hiên mở thoáng */}
      {[-3.8, -1.5, 0.8, 3.1, 5.4, 7.7, 10.0, 12.3, 14.6].map((pz, idx) => (
        <group key={`low-post-${idx}`} position={[0, 0.42, pz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.36, 12]} />
            <meshStandardMaterial color="#A8A096" roughness={0.52} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#D9A441" metalness={0.55} roughness={0.32} />
          </mesh>
        </group>
      ))}

      {/* Mái đao hiên chùa uốn cong vươn ra hai bên che mưa nắng (Y = 8.75) */}
      <mesh
        position={[s * 0.95, 8.75, 5.5]}
        rotation={[0, 0, -s * 0.26]}
        castShadow
      >
        <boxGeometry args={[2.3, 0.18, 27.5]} />
        <meshStandardMaterial color="#3B1A0E" roughness={0.55} />
      </mesh>
      <mesh position={[s * 1.95, 8.52, 5.5]}>
        <boxGeometry args={[0.18, 0.22, 27.6]} />
        <meshStandardMaterial color="#D9A441" metalness={0.65} roughness={0.3} />
      </mesh>

      {/* Luồng tia nắng tự nhiên chiếu xiên từ thiên nhiên bên ngoài vào Chánh Điện */}
      {showSunbeams &&
        [0.8, 4.2, 7.6].map((wz, idx) => (
          <mesh
            key={`open-sunbeam-${idx}`}
            position={[-s * 2.35, 2.35, wz]}
            rotation={[0, 0, s * 0.54]}
          >
            <planeGeometry args={[5.4, 2.35]} />
            <meshBasicMaterial
              map={sunbeamTex}
              transparent
              opacity={timeOfDay === "noon" ? 0.26 : 0.42}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

      {/* Bức Hoành Phi vàng chữ đen (天大慈慶) treo THẲNG NGANG NGAY NGẮN 100% dưới xà thượng lương hai bên */}
      {[3.1, 7.7].map((pz, pIdx) => (
        <group
          key={`straight-plaque-${pIdx}`}
          position={[-s * 0.36, 6.45, pz]}
          rotation={[0, -s * (Math.PI / 2), 0]}
          scale={[1.28, 1.28, 1.15]}
        >
          {/* Hai thanh đồng treo thẳng từ bảng Hoành Phi lên xà gỗ phía trên */}
          {[-0.95, 0.95].map((rx, rIdx) => (
            <mesh key={rIdx} position={[rx, 1.1, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 1.35, 8]} />
              <meshStandardMaterial color="#D9A441" metalness={0.78} roughness={0.25} />
            </mesh>
          ))}
          {/* Khung gỗ lim chạm viền vàng nằm ngang phẳng phiu */}
          <mesh castShadow>
            <boxGeometry args={[2.85, 1.02, 0.09]} />
            <meshStandardMaterial color="#3B1A0E" roughness={0.45} />
          </mesh>
          <mesh>
            <boxGeometry args={[2.91, 1.08, 0.06]} />
            <meshStandardMaterial color="#D9A441" metalness={0.72} roughness={0.28} />
          </mesh>
          {/* Mặt bảng sơn vàng chữ Hán đen sắc nét */}
          <mesh position={[0, 0, 0.052]}>
            <planeGeometry args={[2.72, 0.9]} />
            <meshStandardMaterial
              map={sidePlaqueTex}
              roughness={0.28}
              metalness={0.42}
              emissive="#D9A441"
              emissiveIntensity={0.28}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── 7B. TEXTURE NƯỚC HỒ THẬT, LÁ SEN THẬT, VỎ CÂY BỒ ĐỀ SẦN & TÁN LÁ BỒ ĐỀ HÌNH TIM ──
let cachedRealWaterTex: THREE.CanvasTexture | null = null;
let cachedRealWaterBumpTex: THREE.CanvasTexture | null = null;
let cachedLotusLeafTex: THREE.CanvasTexture | null = null;
let cachedBodhiBarkTex: THREE.CanvasTexture | null = null;
let cachedBodhiCanopyTex: THREE.CanvasTexture | null = null;
let cachedCarvedPotTex: THREE.CanvasTexture | null = null;

function createRealisticWaterTexture(): THREE.CanvasTexture {
  if (cachedRealWaterTex) return cachedRealWaterTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0.0, "#0E4A52");
  grad.addColorStop(0.35, "#156970");
  grad.addColorStop(0.65, "#1D7F85");
  grad.addColorStop(1.0, "#0E4E57");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Vẽ vân sóng nước giao thoa & ánh sáng khúc xạ (caustics) dưới mặt hồ
  for (let i = 0; i < 95; i++) {
    const x = (Math.sin(i * 73.1) * 0.5 + 0.5) * 512;
    const y = (Math.cos(i * 119.7) * 0.5 + 0.5) * 512;
    const rx = 28 + (i % 6) * 14;
    const ry = 6 + (i % 4) * 3;
    ctx.strokeStyle =
      i % 3 === 0
        ? "rgba(180, 250, 255, 0.24)"
        : "rgba(110, 225, 230, 0.16)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (i % 5) * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedRealWaterTex = tex;
  return tex;
}

function createRealisticWaterBumpTexture(): THREE.CanvasTexture {
  if (cachedRealWaterBumpTex) return cachedRealWaterBumpTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 16) {
      const v = Math.floor(
        128 +
          48 * Math.sin((x / 256) * Math.PI * 6) * Math.cos((y / 256) * Math.PI * 8)
      );
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 6);
  cachedRealWaterBumpTex = tex;
  return tex;
}

function createRealisticLotusLeafTexture(): THREE.CanvasTexture {
  if (cachedLotusLeafTex) return cachedLotusLeafTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
  grad.addColorStop(0.0, "#76BA6B");
  grad.addColorStop(0.25, "#3E8E4C");
  grad.addColorStop(0.78, "#266B36");
  grad.addColorStop(1.0, "#1B4F27");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Gân lá sen tỏa tròn chân thực từ tâm ra mép lá
  ctx.strokeStyle = "rgba(168, 228, 152, 0.55)";
  ctx.lineWidth = 1.8;
  for (let a = 0; a < 18; a++) {
    const angle = (a / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(angle) * 122, 128 + Math.sin(angle) * 122);
    ctx.stroke();
  }
  // Giọt sương long lanh ở tâm lá sen
  ctx.fillStyle = "rgba(235, 255, 245, 0.85)";
  ctx.beginPath();
  ctx.arc(128, 128, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedLotusLeafTex = tex;
  return tex;
}

function createBodhiBarkTexture(): THREE.CanvasTexture {
  if (cachedBodhiBarkTex) return cachedBodhiBarkTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#5B402B";
  ctx.fillRect(0, 0, 256, 256);

  // Vân vỏ cây Bồ Đề cổ thụ sần sùi tự nhiên
  for (let i = 0; i < 140; i++) {
    const x = (i * 19) % 256;
    const y = (i * 37) % 256;
    ctx.fillStyle = i % 2 === 0 ? "#46301F" : "#6E5038";
    ctx.fillRect(x, y, 5, 28 + (i % 24));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedBodhiBarkTex = tex;
  return tex;
}

function createBodhiFoliageCanopyTexture(): THREE.CanvasTexture {
  if (cachedBodhiCanopyTex) return cachedBodhiCanopyTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#245830";
  ctx.fillRect(0, 0, 512, 512);

  const leafPalette = ["#2D6B3B", "#3A8248", "#489856", "#58AD64", "#21522B"];
  // Vẽ hàng trăm chiếc lá Bồ Đề hình trái tim đuôi nhọn xếp chồng tự nhiên
  for (let i = 0; i < 420; i++) {
    const lx = (Math.sin(i * 91.3) * 0.5 + 0.5) * 512;
    const ly = (Math.cos(i * 157.9) * 0.5 + 0.5) * 512;
    const rot = (i % 12) * 0.52;
    const sc = 0.75 + (i % 5) * 0.14;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.scale(sc, sc);

    ctx.fillStyle = leafPalette[i % leafPalette.length];
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(16, -18, 18, 4, 0, 22);
    ctx.bezierCurveTo(-18, 4, -16, -18, 0, -18);
    ctx.fill();

    ctx.strokeStyle = "rgba(165, 230, 155, 0.35)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedBodhiCanopyTex = tex;
  return tex;
}

function createCarvedPlanterPotTexture(): THREE.CanvasTexture {
  if (cachedCarvedPotTex) return cachedCarvedPotTex;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#5C3A24");
  grad.addColorStop(0.25, "#784D31");
  grad.addColorStop(0.75, "#5A3822");
  grad.addColorStop(1.0, "#3D2415");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Đường diềm vàng kim & họa tiết cánh sen cổ chạm nổi quanh thân chậu
  ctx.strokeStyle = "#E5B85B";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 24, 504, 208);
  ctx.lineWidth = 3;
  for (let x = 32; x < 512; x += 64) {
    ctx.beginPath();
    ctx.arc(x, 128, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(246, 213, 138, 0.25)";
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedCarvedPotTex = tex;
  return tex;
}

// ── 7C. HOA SEN THẬT 3D NHIỀU LỚP CÁNH & HỒ NƯỚC THẬT CÓ SÓNG + CÁ KOI BƠI LỘI ──
function Realistic3DLotusFlower({
  position,
  isPink = true,
  scale = 1,
  stemHeight = 0.28,
}: {
  position: [number, number, number];
  isPink?: boolean;
  scale?: number;
  stemHeight?: number;
}) {
  const outerColor = isPink ? "#EC4899" : "#F8FAFC";
  const midColor = isPink ? "#F472B6" : "#FFFFFF";
  const innerColor = isPink ? "#FBCFE8" : "#FFFBEB";
  const emissiveColor = isPink ? "#BE185D" : "#F6D58A";

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Vòng gợn sóng nước lan tỏa quanh cuống sen */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.24, 20]} />
        <meshBasicMaterial
          color="#B8F4F8"
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cuống sen xanh vươn lên khỏi mặt nước */}
      <mesh castShadow position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.028, stemHeight, 8]} />
        <meshStandardMaterial color="#347844" roughness={0.55} />
      </mesh>

      {/* Đài hoa sen 3 tầng cánh 3D (24 cánh sen uốn cong tự nhiên) */}
      <group position={[0, stemHeight, 0]}>
        {/* Tầng cánh ngoài cùng (8 cánh xòe rộng) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <group key={`outer-${i}`} rotation={[0, angle, 0]}>
              <mesh
                position={[0, 0.03, 0.14]}
                rotation={[0.98, 0, 0]}
                scale={[0.46, 1.0, 0.22]}
              >
                <sphereGeometry args={[0.14, 10, 10]} />
                <meshStandardMaterial
                  color={outerColor}
                  emissive={emissiveColor}
                  emissiveIntensity={0.22}
                  roughness={0.32}
                />
              </mesh>
            </group>
          );
        })}

        {/* Tầng cánh giữa (8 cánh khum nâng đỡ) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = ((i + 0.5) / 8) * Math.PI * 2;
          return (
            <group key={`mid-${i}`} rotation={[0, angle, 0]}>
              <mesh
                position={[0, 0.075, 0.1]}
                rotation={[0.58, 0, 0]}
                scale={[0.42, 0.96, 0.2]}
              >
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshStandardMaterial
                  color={midColor}
                  emissive={emissiveColor}
                  emissiveIntensity={0.28}
                  roughness={0.28}
                />
              </mesh>
            </group>
          );
        })}

        {/* Tầng cánh trong cùng (8 cánh ôm sát gương sen) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <group key={`inner-${i}`} rotation={[0, angle, 0]}>
              <mesh
                position={[0, 0.11, 0.06]}
                rotation={[0.26, 0, 0]}
                scale={[0.36, 0.88, 0.18]}
              >
                <sphereGeometry args={[0.11, 8, 8]} />
                <meshStandardMaterial
                  color={innerColor}
                  emissive={emissiveColor}
                  emissiveIntensity={0.32}
                  roughness={0.25}
                />
              </mesh>
            </group>
          );
        })}

        {/* Gương sen vàng & nhụy sen ở chính giữa */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.065, 0.035, 0.09, 14]} />
          <meshStandardMaterial
            color="#FACC15"
            emissive="#D97706"
            emissiveIntensity={0.4}
            roughness={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}

function SacredLotusPond({ side }: { side: "left" | "right" }) {
  const s = side === "left" ? -1 : 1;
  const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const koiGroupRef = useRef<THREE.Group>(null);

  const waterTex = useMemo(() => createRealisticWaterTexture(), []);
  const waterBumpTex = useMemo(() => createRealisticWaterBumpTexture(), []);
  const lotusLeafTex = useMemo(() => createRealisticLotusLeafTexture(), []);

  // Chuyển động sóng nước thật & đàn cá Koi bơi lượn mềm mại
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    waterTex.offset.x = Math.sin(t * 0.25) * 0.08;
    waterTex.offset.y = (t * 0.045) % 1;
    waterBumpTex.offset.x = Math.cos(t * 0.32) * 0.06;
    waterBumpTex.offset.y = -(t * 0.055) % 1;

    if (koiGroupRef.current) {
      koiGroupRef.current.children.forEach((koi, idx) => {
        const speed = 0.55 + idx * 0.12;
        const phase = idx * 1.7 + (side === "left" ? 0 : 1.2);
        const kx = Math.sin(t * speed + phase) * 1.25;
        const kz = Math.sin(t * speed * 0.5 + phase) * 3.8;
        const dx = Math.cos(t * speed + phase) * speed * 1.25;
        const dz = Math.cos(t * speed * 0.5 + phase) * speed * 0.5 * 3.8;
        koi.position.set(kx, 0.17, kz);
        koi.rotation.y = Math.atan2(dx, dz);
      });
    }
  });

  const lotusClusters: {
    x: number;
    z: number;
    isPink: boolean;
    scale: number;
    stemH: number;
  }[] = [
    { x: -1.15, z: -4.1, isPink: true, scale: 1.18, stemH: 0.34 },
    { x: 0.85, z: -3.1, isPink: false, scale: 1.12, stemH: 0.28 },
    { x: -0.65, z: -1.6, isPink: true, scale: 1.25, stemH: 0.38 },
    { x: 1.05, z: -0.2, isPink: true, scale: 1.15, stemH: 0.3 },
    { x: -0.95, z: 1.35, isPink: false, scale: 1.22, stemH: 0.35 },
    { x: 0.72, z: 2.75, isPink: true, scale: 1.2, stemH: 0.32 },
    { x: -0.45, z: 4.15, isPink: true, scale: 1.16, stemH: 0.29 },
  ];

  const extraPads: [number, number, number, number][] = [
    [-0.2, -4.6, 0.48, 0.4],
    [1.2, -1.8, 0.52, 1.8],
    [-1.25, -0.1, 0.45, 2.9],
    [0.15, 1.1, 0.54, 0.9],
    [-1.1, 3.1, 0.46, 4.1],
    [1.1, 4.3, 0.5, 5.2],
  ];

  return (
    <group position={[s * 14.3, -0.02, 4.5]}>
      {/* Đáy hồ sâu xanh thẫm */}
      <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 11.8]} />
        <meshStandardMaterial color="#07282C" roughness={0.85} />
      </mesh>

      {/* Thành hồ đá xanh chạm khắc viền vàng kim cổ kính */}
      <mesh receiveShadow position={[-2.35, 0.16, 0]}>
        <boxGeometry args={[0.28, 0.32, 12.2]} />
        <meshStandardMaterial color="#8A8378" roughness={0.62} />
      </mesh>
      <mesh receiveShadow position={[2.35, 0.16, 0]}>
        <boxGeometry args={[0.28, 0.32, 12.2]} />
        <meshStandardMaterial color="#8A8378" roughness={0.62} />
      </mesh>
      <mesh receiveShadow position={[0, 0.16, -5.95]}>
        <boxGeometry args={[4.98, 0.32, 0.28]} />
        <meshStandardMaterial color="#8A8378" roughness={0.62} />
      </mesh>
      <mesh receiveShadow position={[0, 0.16, 5.95]}>
        <boxGeometry args={[4.98, 0.32, 0.28]} />
        <meshStandardMaterial color="#8A8378" roughness={0.62} />
      </mesh>

      {/* Mặt nước hồ thật óng ánh gợn sóng liên tục & phản chiếu bầu trời */}
      <mesh receiveShadow position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.44, 11.65, 24, 48]} />
        <meshStandardMaterial
          ref={waterMatRef}
          map={waterTex}
          bumpMap={waterBumpTex}
          bumpScale={0.035}
          color="#24969E"
          emissive="#0C444A"
          emissiveIntensity={0.35}
          roughness={0.09}
          metalness={0.58}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Đàn cá chép Koi vàng cam & đỏ trắng bơi lội dưới làn nước trong */}
      <group ref={koiGroupRef}>
        {["#FF5E1A", "#FFB82E", "#FF3B30", "#FFA024", "#FFF2D6"].map(
          (koiColor, kIdx) => (
            <group key={`koi-${kIdx}`}>
              {/* Thân cá Koi */}
              <mesh scale={[0.55, 0.45, 1.65]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial
                  color={koiColor}
                  emissive={koiColor}
                  emissiveIntensity={0.28}
                  roughness={0.25}
                />
              </mesh>
              {/* Đuôi cá Koi mềm mại */}
              <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.35, 1, 0.8]}>
                <coneGeometry args={[0.09, 0.16, 6]} />
                <meshStandardMaterial color="#FFF5E1" roughness={0.3} />
              </mesh>
            </group>
          )
        )}
      </group>

      {/* Các lá sen thật có khía chữ V & đường gân lá nổi trên mặt nước */}
      {extraPads.map(([px, pz, radius, rot], idx) => (
        <mesh
          key={`pad-${idx}`}
          position={[px, 0.232, pz]}
          rotation={[-Math.PI / 2, 0, rot]}
          receiveShadow
        >
          <circleGeometry args={[radius, 24, 0, Math.PI * 1.88]} />
          <meshStandardMaterial
            map={lotusLeafTex}
            roughness={0.48}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Quần thể Hoa Sen Thật 24 cánh 3D, Lá Sen Lớn & Nụ Sen Hồng vươn cao */}
      {lotusClusters.map((item, idx) => (
        <group key={`lotus-cluster-${idx}`} position={[item.x, 0.225, item.z]}>
          {/* Lá sen lớn có khía chữ V nằm dưới chân đóa sen */}
          <mesh
            position={[-0.12, 0.008, 0.08]}
            rotation={[-Math.PI / 2, 0, idx * 1.1]}
            receiveShadow
          >
            <circleGeometry args={[0.48, 24, 0, Math.PI * 1.88]} />
            <meshStandardMaterial
              map={lotusLeafTex}
              roughness={0.46}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Đóa hoa sen thật 3 tầng cánh 3D */}
          <Realistic3DLotusFlower
            position={[0.06, 0, -0.04]}
            isPink={item.isPink}
            scale={item.scale}
            stemHeight={item.stemH}
          />

          {/* Nụ sen hồng thon nhọn vươn cao bên cạnh hoa sen */}
          {idx % 2 === 0 && (
            <group position={[-0.18, 0, -0.14]} rotation={[0.08, 0, -0.12]}>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.016, 0.022, 0.44, 8]} />
                <meshStandardMaterial color="#347844" roughness={0.55} />
              </mesh>
              <mesh position={[0, 0.47, 0]} scale={[0.62, 1.25, 0.62]}>
                <sphereGeometry args={[0.095, 12, 12]} />
                <meshStandardMaterial
                  color="#F472B6"
                  emissive="#DB2777"
                  emissiveIntensity={0.3}
                  roughness={0.3}
                />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

// ── 7D. CÂY BỒ ĐỀ THẬT TRỒNG TRONG CHẬU CỔ CỠ LỚN (POTTED REALISTIC BODHI TREE) ──
function PottedRealisticBodhiTree({
  position,
  scale = 1,
  isNight = false,
}: {
  position: [number, number, number];
  scale?: number;
  isNight?: boolean;
}) {
  const barkTex = useMemo(() => createBodhiBarkTexture(), []);
  const canopyTex = useMemo(() => createBodhiFoliageCanopyTexture(), []);
  const potTex = useMemo(() => createCarvedPlanterPotTexture(), []);

  // Các cụm tán lá Bồ Đề đa tầng tạo dáng bonsai cổ thụ uy nghi như cây thật
  const canopyCrowns: {
    pos: [number, number, number];
    sc: [number, number, number];
    tint: string;
  }[] = [
    // Tầng tán dưới trải rộng hai bên
    { pos: [-1.45, 3.85, 0.25], sc: [1.35, 0.62, 1.2], tint: "#2E6F3E" },
    { pos: [1.45, 3.92, -0.2], sc: [1.35, 0.62, 1.2], tint: "#2E6F3E" },
    { pos: [-0.85, 3.65, -1.15], sc: [1.2, 0.58, 1.15], tint: "#275E34" },
    { pos: [0.92, 3.72, 1.15], sc: [1.2, 0.58, 1.15], tint: "#275E34" },
    // Tầng tán giữa dày dặn
    { pos: [-0.95, 4.55, 0.45], sc: [1.42, 0.68, 1.28], tint: "#3B854C" },
    { pos: [0.98, 4.6, -0.35], sc: [1.42, 0.68, 1.28], tint: "#3B854C" },
    { pos: [0.0, 4.42, 0.85], sc: [1.3, 0.64, 1.22], tint: "#347844" },
    { pos: [0.0, 4.48, -0.82], sc: [1.3, 0.64, 1.22], tint: "#347844" },
    // Tầng tán trên & đỉnh vòm Bồ Đề đón nắng
    { pos: [-0.48, 5.22, 0.12], sc: [1.28, 0.65, 1.18], tint: "#489A58" },
    { pos: [0.52, 5.26, -0.12], sc: [1.28, 0.65, 1.18], tint: "#489A58" },
    { pos: [0.0, 5.68, 0.0], sc: [1.45, 0.72, 1.35], tint: "#56AD66" },
  ];

  // Các nhánh gỗ lớn vươn ra từ thân chính
  const branches: {
    pos: [number, number, number];
    rot: [number, number, number];
    rTop: number;
    rBot: number;
    len: number;
  }[] = [
    { pos: [-0.68, 2.95, 0.14], rot: [0.14, 0, 0.62], rTop: 0.14, rBot: 0.25, len: 1.75 },
    { pos: [0.72, 3.02, -0.12], rot: [-0.12, 0, -0.58], rTop: 0.14, rBot: 0.25, len: 1.75 },
    { pos: [-0.42, 3.15, -0.58], rot: [-0.52, 0, 0.34], rTop: 0.12, rBot: 0.21, len: 1.55 },
    { pos: [0.45, 3.18, 0.58], rot: [0.52, 0, -0.34], rTop: 0.12, rBot: 0.21, len: 1.55 },
    { pos: [-0.28, 3.85, 0.08], rot: [0.08, 0, 0.32], rTop: 0.11, rBot: 0.18, len: 1.45 },
    { pos: [0.3, 3.9, -0.08], rot: [-0.08, 0, -0.3], rTop: 0.11, rBot: 0.18, len: 1.45 },
  ];

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. CHẬU ĐÁ / GỐM CỔ CỠ LỚN CHẠM HOA VĂN VÀNG KIM (ĐƯỜNG KÍNH 2.3M) */}
      {/* Đế đá bát giác nâng chậu */}
      <mesh receiveShadow castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.08, 1.18, 0.24, 12]} />
        <meshStandardMaterial color="#7C756B" roughness={0.68} />
      </mesh>
      {/* Thân chậu lớn chạm nổi hoa văn sen vàng */}
      <mesh receiveShadow castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.18, 0.88, 0.82, 16]} />
        <meshStandardMaterial
          map={potTex}
          roughness={0.42}
          metalness={0.22}
        />
      </mesh>
      {/* Vành miệng chậu loe dày viền vàng hoàng kim */}
      <mesh receiveShadow castShadow position={[0, 1.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.16, 0.11, 12, 24]} />
        <meshStandardMaterial color="#6B4228" roughness={0.38} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.032, 8, 24]} />
        <meshStandardMaterial color="#E5B85B" metalness={0.78} roughness={0.24} />
      </mesh>
      {/* Lớp đất nâu & thảm rêu xanh mướt bên trong miệng chậu */}
      <mesh receiveShadow position={[0, 1.02, 0]}>
        <cylinderGeometry args={[1.1, 1.05, 0.12, 16]} />
        <meshStandardMaterial color="#2D4F28" roughness={0.88} />
      </mesh>

      {/* 2. BỘ RỄ BỒ ĐỀ NỔI UỐN LƯỢN TRÊN MẶT CHẬU & THÂN CÂY VỎ SẦN THẬT */}
      {[0, 1, 2, 3, 4, 5].map((rIdx) => {
        const angle = (rIdx / 6) * Math.PI * 2 + 0.2;
        return (
          <group key={`root-${rIdx}`} position={[0, 1.12, 0]} rotation={[0, angle, 0]}>
            <mesh
              castShadow
              position={[0, 0.12, 0.46]}
              rotation={[1.12, 0, 0]}
            >
              <cylinderGeometry args={[0.11, 0.2, 0.88, 8]} />
              <meshStandardMaterial map={barkTex} roughness={0.85} />
            </mesh>
          </group>
        );
      })}

      {/* Gốc cổ thụ & Thân chính cây Bồ Đề */}
      <mesh castShadow receiveShadow position={[0, 1.65, 0]} rotation={[0.04, 0, -0.05]}>
        <cylinderGeometry args={[0.38, 0.58, 1.25, 12]} />
        <meshStandardMaterial map={barkTex} roughness={0.84} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.04, 2.55, 0.02]} rotation={[-0.03, 0, 0.06]}>
        <cylinderGeometry args={[0.28, 0.4, 1.35, 12]} />
        <meshStandardMaterial map={barkTex} roughness={0.84} />
      </mesh>

      {/* Hệ cành nhánh vươn rộng & rễ khí sinh Bồ Đề rủ xuống */}
      {branches.map((br, bIdx) => (
        <mesh
          key={`branch-${bIdx}`}
          castShadow
          position={br.pos}
          rotation={br.rot}
        >
          <cylinderGeometry args={[br.rTop, br.rBot, br.len, 8]} />
          <meshStandardMaterial map={barkTex} roughness={0.82} />
        </mesh>
      ))}
      {[
        [-0.88, 2.65, 0.22, 1.15],
        [0.92, 2.72, -0.18, 1.2],
        [-0.52, 2.8, -0.62, 1.05],
      ].map(([ax, ay, az, ah], aIdx) => (
        <mesh key={`aerial-root-${aIdx}`} position={[ax, ay, az]}>
          <cylinderGeometry args={[0.018, 0.012, ah, 6]} />
          <meshStandardMaterial color="#4B3321" roughness={0.85} />
        </mesh>
      ))}

      {/* 3. TÁN LÁ BỒ ĐỀ HÌNH TIM ĐUÔI NHỌN NHIỀU TẦNG CHI TIẾT */}
      {canopyCrowns.map((crown, cIdx) => (
        <mesh
          key={`canopy-${cIdx}`}
          castShadow
          receiveShadow
          position={crown.pos}
          scale={crown.sc}
        >
          <dodecahedronGeometry args={[1.08, 2]} />
          <meshStandardMaterial
            map={canopyTex}
            bumpMap={canopyTex}
            bumpScale={0.04}
            color={crown.tint}
            roughness={0.58}
          />
        </mesh>
      ))}

      {/* 4. ĐÈN LỒNG HOÀNG KIM TREO TRÊN CÀNH CÂY BỒ ĐỀ */}
      {[-1.15, 1.15].map((lx, lIdx) => (
        <group
          key={`tree-lantern-${lIdx}`}
          position={[lx, 3.05, lIdx === 0 ? 0.28 : -0.22]}
        >
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
            <meshBasicMaterial color="#3B2313" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.04, 10]} />
            <meshStandardMaterial color="#D9A441" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial
              color="#FFF2C6"
              emissive="#FFA834"
              emissiveIntensity={isNight ? 2.8 : 1.35}
              roughness={0.22}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StoneGardenLantern({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  return (
    <group position={position}>
      {/* Đế đèn đá */}
      <mesh receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.26, 0.34, 0.24, 6]} />
        <meshStandardMaterial color="#8A8379" roughness={0.72} />
      </mesh>
      {/* Trụ đèn đá */}
      <mesh castShadow position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.72, 6]} />
        <meshStandardMaterial color="#968F85" roughness={0.68} />
      </mesh>
      {/* Lồng đèn phát sáng */}
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.28, 6]} />
        <meshStandardMaterial
          color="#FFF3C8"
          emissive="#FFAD3B"
          emissiveIntensity={isNight ? 2.6 : 1.1}
          roughness={0.25}
        />
      </mesh>
      {/* Mái đèn đá lục giác */}
      <mesh castShadow position={[0, 1.32, 0]}>
        <coneGeometry args={[0.38, 0.26, 6]} />
        <meshStandardMaterial color="#756E65" roughness={0.72} />
      </mesh>
    </group>
  );
}

function SurroundingTempleNature() {
  const timeOfDay = useTempleStore((st) => st.timeOfDay);
  const isNight = timeOfDay === "night" || timeOfDay === "afternoon";

  const grassColor =
    timeOfDay === "night"
      ? "#162C1E"
      : timeOfDay === "afternoon"
      ? "#2E4E28"
      : "#2B5E33";

  return (
    <group>
      {/* Thảm cỏ & khuôn viên thiên nhiên chùa rộng 125m × 125m bao quanh Chánh Điện */}
      <mesh
        receiveShadow
        position={[0, -0.09, 5.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[125, 125]} />
        <meshStandardMaterial color={grassColor} roughness={0.88} />
      </mesh>

      {/* Hai Hồ Sen Nước Thật Óng Ánh & Hoa Sen Thật 24 Cánh + Cá Koi Bơi Lội Hai Bên Hiên */}
      <SacredLotusPond side="left" />
      <SacredLotusPond side="right" />

      {/* Hàng Đèn Đá Cổ dọc hai bên thềm Chánh Điện */}
      {[-1.5, 3.8, 9.2, 14.2].map((zPos, idx) => (
        <group key={`veranda-decor-${idx}`}>
          <StoneGardenLantern position={[-11.55, 0, zPos]} isNight={isNight} />
          <StoneGardenLantern position={[11.55, 0, zPos]} isNight={isNight} />
        </group>
      ))}

      {/* Hàng Cây Bồ Đề Thật Trồng Trong Chậu Cổ Cỡ Lớn Đặt Trang Nghiêm Hai Bên Sân Chùa */}
      <PottedRealisticBodhiTree position={[-18.6, 0, -2.2]} scale={1.15} isNight={isNight} />
      <PottedRealisticBodhiTree position={[18.6, 0, -2.2]} scale={1.15} isNight={isNight} />

      <PottedRealisticBodhiTree position={[-19.2, 0, 4.5]} scale={1.25} isNight={isNight} />
      <PottedRealisticBodhiTree position={[19.2, 0, 4.5]} scale={1.25} isNight={isNight} />

      <PottedRealisticBodhiTree position={[-18.6, 0, 11.4]} scale={1.18} isNight={isNight} />
      <PottedRealisticBodhiTree position={[18.6, 0, 11.4]} scale={1.18} isNight={isNight} />

      <PottedRealisticBodhiTree position={[-14.5, 0, -4.2]} scale={0.95} isNight={isNight} />
      <PottedRealisticBodhiTree position={[14.5, 0, -4.2]} scale={0.95} isNight={isNight} />

      <PottedRealisticBodhiTree position={[-14.5, 0, 13.2]} scale={0.95} isNight={isNight} />
      <PottedRealisticBodhiTree position={[14.5, 0, 13.2]} scale={0.95} isNight={isNight} />

      {/* Dãy núi non trùng điệp phía chân trời hai bên & phía sau */}
      {[
        [-42, -18, 16, 15],
        [-45, 6, 18, 17],
        [-40, 26, 15, 13],
        [42, -18, 16, 15],
        [45, 6, 18, 17],
        [40, 26, 15, 13],
        [-22, -38, 18, 18],
        [22, -38, 18, 18],
      ].map(([mx, mz, mr, mh], mIdx) => (
        <mesh key={`mountain-${mIdx}`} position={[mx, mh / 2 - 0.5, mz]}>
          <coneGeometry args={[mr, mh, 7]} />
          <meshStandardMaterial
            color={timeOfDay === "night" ? "#101E33" : "#28493A"}
            roughness={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── 8. ĐẠI TRỤ GỖ LIM NÂU TRẦM CAO 9M, CHÂN ĐẾ ĐÁ XÁM CHẠM SEN & CÂU ĐỐI SƠN ĐEN CHỮ VÀNG (CHUẨN ẢNH PREVIEW) ──
function TemplePillarWithCouplet({
  position,
  radius = 0.42,
  hasCouplet = false,
  coupletTexture,
}: {
  position: [number, number, number];
  radius?: number;
  hasCouplet?: boolean;
  coupletTexture?: THREE.CanvasTexture;
}) {
  return (
    <group position={position}>
      {/* Chân tảng đá xanh xám chạm cánh sen cổ kính (giống hệt chân cột đá trong ảnh Preview) */}
      <mesh receiveShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[radius * 1.4, radius * 1.52, 0.18, 22]} />
        <meshStandardMaterial color="#8C857B" roughness={0.68} metalness={0.12} />
      </mesh>
      <mesh receiveShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[radius * 1.14, radius * 1.36, 0.18, 22]} />
        <meshStandardMaterial color="#A69F95" roughness={0.58} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.08, 0.03, 8, 22]} />
        <meshStandardMaterial color="#78716A" roughness={0.6} />
      </mesh>

      {/* Thân đại trụ gỗ lim nâu trầm cao vút 9.0m */}
      <mesh castShadow receiveShadow position={[0, 4.75, 0]}>
        <cylinderGeometry args={[radius * 0.94, radius, 8.9, 24]} />
        <meshStandardMaterial
          color="#3A1D10"
          roughness={0.28}
          metalness={0.12}
        />
      </mesh>

      {/* Đấu củng gỗ lim đỡ xà ngang trên đỉnh cột */}
      <mesh position={[0, 9.0, 0]}>
        <boxGeometry args={[radius * 2.4, 0.4, radius * 2.4]} />
        <meshStandardMaterial color="#2E150B" roughness={0.58} />
      </mesh>

      {/* Câu đối lòng máng sơn đen chữ vàng hoàng kim treo mặt trước đại trụ */}
      {hasCouplet && coupletTexture && (
        <group position={[0, 3.65, radius + 0.028]}>
          <mesh>
            <boxGeometry args={[0.64, 4.45, 0.045]} />
            <meshStandardMaterial color="#120A06" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.026]}>
            <planeGeometry args={[0.62, 4.42]} />
            <meshStandardMaterial
              map={coupletTexture}
              emissiveMap={coupletTexture}
              emissive="#F6D58A"
              emissiveIntensity={0.42}
              roughness={0.22}
              metalness={0.35}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── 9. TỔNG HỢP KHÔNG GIAN ĐẠI HÙNG BẢO ĐIỆN RỘNG KHOÁNG ĐẠT (100% KHỚP ẢNH PREVIEW TRONG IMPLEMENTATION PLAN) ──
export function TempleGeometry() {
  const navigationTarget = useTempleStore((s) => s.navigationTarget);

  const stoneFloorTexture = useMemo(() => createStoneFloorTexture(), []);
  const carpetTexture = useMemo(() => createCarpetTexture(), []);
  const kneelingMatTex = useMemo(() => createKneelingMatTexture(), []);
  const coupletTexture = useMemo(() => createCoupletTexture(), []);
  const warmGlowTex = useMemo(() => createWarmGlowTexture(), []);

  return (
    <group>
      {/* ── 1. NỀN VẬT LÝ KIÊN CỐ & SÀN ĐÁ GỖ NÂU TRẦM ĐÁNH BÓNG RỘNG 26M ──────── */}
      <RigidBody type="fixed" position={[0, -1, 0]} colliders={false}>
        <CuboidCollider args={[30, 1, 30]} />
      </RigidBody>

      {/* Sàn Chánh Điện rộng 26m màu gỗ đá nâu trầm ấm áp làm nổi bật 100 tấm thảm đỏ vàng */}
      <mesh receiveShadow position={[0, 0.0, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 32]} />
        <meshStandardMaterial
          map={stoneFloorTexture}
          color="#825336"
          emissive="#2B160A"
          emissiveIntensity={0.28}
          roughness={0.24}
          metalness={0.18}
        />
      </mesh>

      {/* Ánh vàng phản chiếu tự nhiên trên mặt sàn phía trước Bàn Thờ Tam Bảo */}
      <mesh position={[0, 0.004, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.5, 6.8]} />
        <meshBasicMaterial
          map={warmGlowTex}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── 2. THẢM ĐỎ HÀNH LỄ LỐI GIỮA BẢN RỘNG (X = 0, RỘNG 2.32M) TRẢI DÀI TỪ CỬA LÊN BÀN THỜ PHẬT ── */}
      <group position={[0, 0.01, 4.5]}>
        {/* Nền nỉ đỏ sẫm tạo độ dày cho tấm thảm trải lối đi trung tâm */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.38, 17.6]} />
          <meshStandardMaterial color="#5E0E09" roughness={0.75} />
        </mesh>
        {/* 4 Trường đoạn thảm gấm hoa thị bát giác vàng kim bản rộng 2.32m */}
        {[-6.6, -2.2, 2.2, 6.6].map((rz, idx) => (
          <mesh
            key={idx}
            position={[0, 0.004, rz]}
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2.32, 4.4]} />
            <meshStandardMaterial
              map={carpetTexture}
              roughness={0.52}
              metalness={0.18}
            />
          </mesh>
        ))}
      </group>

      {/* Bàn Quỳ Dâng Lễ Bọc Gấm Đỏ Vàng Ở Đầu Thảm Đỏ Trung Tâm (z = -2.65, giống hệt ảnh Preview) */}
      <group
        position={[0, 0, -2.65]}
        scale={[1.18, 1.15, 1.15]}
        onClick={(e) => {
          e.stopPropagation();
          useTempleStore.getState().startWalkToIncenseBurner();
        }}
      >
        {/* 4 Chân bàn quỳ thếp vàng */}
        {[-0.36, 0.36].map((lx, i) =>
          [-0.24, 0.24].map((lz, j) => (
            <mesh key={`${i}-${j}`} position={[lx, 0.11, lz]}>
              <boxGeometry args={[0.06, 0.22, 0.06]} />
              <meshStandardMaterial color="#D9A441" metalness={0.82} roughness={0.24} />
            </mesh>
          ))
        )}
        {/* Diềm gỗ chạm vàng của bàn quỳ */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.82, 0.07, 0.58]} />
          <meshStandardMaterial color="#B87D1E" metalness={0.78} roughness={0.28} />
        </mesh>
        {/* Đệm gấm đỏ thêu vàng trên mặt bàn quỳ */}
        <mesh receiveShadow castShadow position={[0, 0.24, 0]}>
          <boxGeometry args={[0.84, 0.06, 0.6]} />
          <meshStandardMaterial
            map={kneelingMatTex}
            roughness={0.48}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* ── 3. 100 TẤM THẢM QUỲ LỄ (50 BÊN TRÁI + 50 BÊN PHẢI) TRẢI RỘNG KHẮP CHÁNH ĐIỆN ── */}
      <InstancedKneelingMats targetId={navigationTarget?.id} />

      {/* ── 4. KHÁM THỜ CHẠM RỒNG VÀNG KIM & HAI KHÁM THỜ PHỤ TẢ - HỮU ──────── */}
      <OrnateGoldenShrineBackwall />

      {/* ── 5. BẢO TƯỢNG PHẬT THÍCH CA MÂU NI & HÀO QUANG MẠN ĐÀ LA ──────── */}
      <GoldenBuddha position={[0, 1.42, -4.85]} />

      {/* ── 6. BÀN THỜ TAM BẢO CHẠM RỒNG VÀNG, ĐÔN MÕ GỖ & ĐÔN CHUÔNG ĐỒNG ── */}
      <AltarTable position={[0, 0, -3.92]} />

      {/* ── 7. HỆ THỐNG ĐẠI TRỤ GỖ LIM, CHÂN TẢNG ĐÁ SEN & CÂU ĐỐI SƠN ĐEN CHỮ VÀNG (ĐÚNG VỊ TRÍ ẢNH PREVIEW) ── */}
      {/* Cặp đại trụ tiền đường nổi bật đứng giữa cột thảm 2 và 3 (x = ±4.35, z = -0.35) */}
      <TemplePillarWithCouplet
        position={[-4.35, 0, -0.35]}
        radius={0.44}
        hasCouplet
        coupletTexture={coupletTexture}
      />
      <TemplePillarWithCouplet
        position={[4.35, 0, -0.35]}
        radius={0.44}
        hasCouplet
        coupletTexture={coupletTexture}
      />

      {/* Cặp đại trụ trung đường hai bên khám thờ chính (x = ±3.05, z = -3.65) */}
      <TemplePillarWithCouplet
        position={[-3.05, 0, -3.65]}
        radius={0.4}
        hasCouplet
        coupletTexture={coupletTexture}
      />
      <TemplePillarWithCouplet
        position={[3.05, 0, -3.65]}
        radius={0.4}
        hasCouplet
        coupletTexture={coupletTexture}
      />

      {/* Cặp trụ nội điện sát hai bên khám thờ Phật (x = ±2.18, z = -4.65) */}
      <TemplePillarWithCouplet
        position={[-2.18, 0, -4.65]}
        radius={0.35}
        hasCouplet
        coupletTexture={coupletTexture}
      />
      <TemplePillarWithCouplet
        position={[2.18, 0, -4.65]}
        radius={0.35}
        hasCouplet
        coupletTexture={coupletTexture}
      />

      {/* Hàng cột biên áp sát tường ngoài (x = ±10.45) tạo nhịp kiến trúc mà không gây hẹp không gian */}
      {[-3.8, 0.8, 5.4, 10.0, 14.6].map((pz, idx) => (
        <group key={`side-col-${idx}`}>
          <TemplePillarWithCouplet position={[-10.45, 0, pz]} radius={0.34} />
          <TemplePillarWithCouplet position={[10.45, 0, pz]} radius={0.34} />
        </group>
      ))}

      {/* ── 8. HÀNH LANG MỞ TOANG HAI BÊN & CẢNH QUAN CÂY CỐI, HỒ SEN, TRÚC XANH XUNG QUANH ── */}
      <OpenSanctuaryVerandaSide side="left" />
      <OpenSanctuaryVerandaSide side="right" />
      <SurroundingTempleNature />

      {/* ── 9. TRẦN GỖ LIM Ô HỘC CAO 9.2M & XÀ NGANG THƯỢNG LƯƠNG KHOÁNG ĐẠT ── */}
      <group position={[0, 9.15, 6.5]}>
        {/* Mặt trần gỗ lim tối màu cao 9.4m của mái Chánh Điện */}
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[23.2, 28.0]} />
          <meshStandardMaterial color="#1E0E07" roughness={0.75} />
        </mesh>
        {/* Hệ xà dọc & xà ngang gỗ lim tạo ô hộc cổ truyền trên cao */}
        {[-10.2, -4.35, 4.35, 10.2].map((bx, i) => (
          <mesh key={`roof-beam-x-${i}`} position={[bx, 0, 0]}>
            <boxGeometry args={[0.42, 0.48, 28.0]} />
            <meshStandardMaterial color="#2D140A" roughness={0.6} />
          </mesh>
        ))}
        {[-10.5, -6.5, -2.5, 1.5, 5.5, 9.5, 13.5].map((bz, i) => (
          <mesh key={`roof-beam-z-${i}`} position={[0, -0.05, bz]}>
            <boxGeometry args={[22.4, 0.44, 0.42]} />
            <meshStandardMaterial color="#36180C" roughness={0.58} />
          </mesh>
        ))}
      </group>

      {/* ── 10. TƯỜNG VẬT LÝ CHẮN AN TOÀN TRONG LÒNG CHÁNH ĐIỆN RỘNG 21.7M ───── */}
      <RigidBody type="fixed" position={[0, 3, 18.0]} colliders={false}>
        <CuboidCollider args={[11, 4, 0.4]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 3, -3.2]} colliders={false}>
        <CuboidCollider args={[11, 4, 0.4]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-10.6, 3, 6.5]} colliders={false}>
        <CuboidCollider args={[0.4, 4, 14]} />
      </RigidBody>
      <RigidBody type="fixed" position={[10.6, 3, 6.5]} colliders={false}>
        <CuboidCollider args={[0.4, 4, 14]} />
      </RigidBody>
    </group>
  );
}
