"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useTempleStore,
  TimeOfDayPhase,
  WeatherCondition,
} from "@/stores/templeStore";

const skyTextureCache = new Map<string, THREE.CanvasTexture>();

function getSkyDomeTexture(
  phase: TimeOfDayPhase,
  weather: WeatherCondition
): THREE.CanvasTexture {
  const key = `${phase}-${weather}`;
  const cached = skyTextureCache.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);

  if (weather === "rain") {
    if (phase === "night") {
      grad.addColorStop(0.0, "#060B16");
      grad.addColorStop(0.45, "#111C30");
      grad.addColorStop(0.78, "#1E2D44");
      grad.addColorStop(1.0, "#15202E");
    } else {
      grad.addColorStop(0.0, "#344456");
      grad.addColorStop(0.42, "#52667A");
      grad.addColorStop(0.76, "#7B8FA1");
      grad.addColorStop(1.0, "#4E5F6E");
    }
  } else if (phase === "morning") {
    // Bình minh / Buổi sáng trong trẻo ấm áp
    grad.addColorStop(0.0, "#2B6CB0");
    grad.addColorStop(0.35, "#63B3ED");
    grad.addColorStop(0.62, "#FBD38D");
    grad.addColorStop(0.78, "#F6AD55");
    grad.addColorStop(1.0, "#2F4F3E");
  } else if (phase === "noon") {
    // Buổi trưa trời xanh mây trắng quang đãng
    grad.addColorStop(0.0, "#1A569E");
    grad.addColorStop(0.38, "#4299E1");
    grad.addColorStop(0.68, "#90CDF4");
    grad.addColorStop(0.82, "#EBF8FF");
    grad.addColorStop(1.0, "#2E5A3C");
  } else if (phase === "afternoon") {
    // Hoàng hôn / Chiều tà rực rỡ sắc vàng cam tím
    grad.addColorStop(0.0, "#1E163B");
    grad.addColorStop(0.32, "#5B2C56");
    grad.addColorStop(0.58, "#C85A32");
    grad.addColorStop(0.76, "#F6AD3C");
    grad.addColorStop(0.86, "#FFE08A");
    grad.addColorStop(1.0, "#2B2218");
  } else {
    // Buổi tối / Đêm trăng thanh tịnh đầy sao
    grad.addColorStop(0.0, "#040711");
    grad.addColorStop(0.38, "#0B152B");
    grad.addColorStop(0.68, "#162647");
    grad.addColorStop(0.84, "#1F3154");
    grad.addColorStop(1.0, "#0D1724");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Vẽ mây bồng bềnh cho ban ngày hoặc bầu trời sao lấp lánh cho ban đêm
  if (phase === "night" && weather !== "rain") {
    for (let i = 0; i < 280; i++) {
      const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * 1024;
      const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * 320;
      const sr = (i % 3 === 0 ? 1.6 : 1.0);
      ctx.fillStyle =
        i % 5 === 0 ? "rgba(255, 240, 195, 0.92)" : "rgba(225, 238, 255, 0.82)";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Mây nhẹ nhàng phía chân trời
    const cloudColor =
      phase === "afternoon"
        ? "rgba(255, 210, 145, 0.22)"
        : phase === "morning"
        ? "rgba(255, 242, 218, 0.26)"
        : weather === "rain"
        ? "rgba(65, 80, 96, 0.32)"
        : "rgba(255, 255, 255, 0.30)";
    ctx.fillStyle = cloudColor;
    for (let c = 0; c < 18; c++) {
      const cx = ((c * 61) % 1000) + 12;
      const cy = 140 + ((c * 37) % 150);
      const rx = 55 + (c % 4) * 22;
      const ry = 14 + (c % 3) * 6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  skyTextureCache.set(key, tex);
  return tex;
}

// Hiệu ứng mưa rơi 3D ngoài hiên chùa khi thời tiết là Mưa
function CourtyardRain({ active }: { active: boolean }) {
  const rainRef = useRef<THREE.Points>(null);
  const count = 900;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Mưa rơi xung quanh sân vườn hai bên hiên Chánh Điện (x ngoài ±10.5m)
      const side = i % 2 === 0 ? -1 : 1;
      arr[i * 3] = side * (11.0 + Math.random() * 24.0);
      arr[i * 3 + 1] = Math.random() * 14.0;
      arr[i * 3 + 2] = -10.0 + Math.random() * 34.0;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!active || !rainRef.current) return;
    const pos = rainRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= dt * 13.5;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 13.5 + Math.random() * 2.0;
      }
    }
    rainRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#CFE8FF"
        size={0.14}
        transparent
        opacity={0.58}
        depthWrite={false}
      />
    </points>
  );
}

export function Environment() {
  const timeOfDay = useTempleStore((s) => s.timeOfDay);
  const weatherCondition = useTempleStore((s) => s.weatherCondition);
  const syncRealtime = useTempleStore((s) => s.syncRealtimeClockAndWeather);

  // Tự động đồng bộ giờ thực tế (Sáng, Trưa, Chiều, Tối) & Thời tiết thực tế (Open-Meteo API)
  useEffect(() => {
    syncRealtime();

    const fetchLiveWeather = async (lat = 10.8231, lon = 106.6297) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        if (!res.ok) return;
        const json = await res.json();
        const temp = json?.current?.temperature_2m;
        const code = Number(json?.current?.weather_code ?? 0);

        let condition: WeatherCondition = "clear";
        if (
          (code >= 51 && code <= 67) ||
          (code >= 80 && code <= 82) ||
          code >= 95
        ) {
          condition = "rain";
        } else if (code === 45 || code === 48) {
          condition = "mist";
        } else {
          condition = "clear";
        }

        syncRealtime({ temp, condition });
      } catch {
        syncRealtime();
      }
    };

    fetchLiveWeather();

    const clockInterval = setInterval(() => {
      syncRealtime();
    }, 20000);

    const weatherInterval = setInterval(() => {
      fetchLiveWeather();
    }, 600000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(weatherInterval);
    };
  }, [syncRealtime]);

  const domeTexture = useMemo(
    () => getSkyDomeTexture(timeOfDay, weatherCondition),
    [timeOfDay, weatherCondition]
  );

  // Thông số ánh sáng & bầu khí quyển theo thời gian thực (Sáng / Trưa / Chiều / Tối)
  const envConfig = useMemo(() => {
    const isRain = weatherCondition === "rain";
    const isMist = weatherCondition === "mist";

    if (timeOfDay === "morning") {
      return {
        bgColor: isRain ? "#445566" : "#8EC5DF",
        fogColor: isRain ? "#5B6E80" : isMist ? "#D6E4EA" : "#DFC9A6",
        fogNear: isMist ? 18 : 28,
        fogFar: isMist ? 55 : 85,
        hemiSky: "#FFF1D0",
        hemiGround: "#3B5230",
        hemiIntensity: isRain ? 1.15 : 1.55,
        ambientColor: "#FFE6BA",
        ambientIntensity: 1.05,
        sunPos: [28, 15, -14] as [number, number, number],
        sunColor: "#FFD89B",
        sunIntensity: isRain ? 0.95 : 2.15,
        orbPos: [38, 16, -24] as [number, number, number],
        orbColor: "#FFE49E",
        orbHaloColor: "#FFAE52",
      };
    }

    if (timeOfDay === "noon") {
      return {
        bgColor: isRain ? "#516578" : "#6CB4EE",
        fogColor: isRain ? "#687D91" : isMist ? "#DCE8F0" : "#BFE0F5",
        fogNear: isMist ? 20 : 32,
        fogFar: isMist ? 58 : 92,
        hemiSky: "#FFFFFF",
        hemiGround: "#3C5E34",
        hemiIntensity: isRain ? 1.25 : 1.75,
        ambientColor: "#FFF9EB",
        ambientIntensity: 1.18,
        sunPos: [8, 28, 6] as [number, number, number],
        sunColor: "#FFFDF5",
        sunIntensity: isRain ? 1.1 : 2.35,
        orbPos: [18, 36, -22] as [number, number, number],
        orbColor: "#FFFFFF",
        orbHaloColor: "#FFF2B2",
      };
    }

    if (timeOfDay === "afternoon") {
      return {
        bgColor: isRain ? "#3C384A" : "#804038",
        fogColor: isRain ? "#4E4A5C" : isMist ? "#C9A58C" : "#C97A4B",
        fogNear: isMist ? 18 : 26,
        fogFar: isMist ? 54 : 82,
        hemiSky: "#FFC285",
        hemiGround: "#3D271B",
        hemiIntensity: isRain ? 1.1 : 1.5,
        ambientColor: "#FFD199",
        ambientIntensity: 1.02,
        sunPos: [-28, 12, -10] as [number, number, number],
        sunColor: "#FFA74F",
        sunIntensity: isRain ? 0.85 : 2.1,
        orbPos: [-38, 13, -24] as [number, number, number],
        orbColor: "#FFBE55",
        orbHaloColor: "#FF6B2B",
      };
    }

    // Buổi tối / Đêm trăng ("night")
    return {
      bgColor: "#0B1326",
      fogColor: isMist ? "#1E2C47" : "#111D35",
      fogNear: 24,
      fogFar: 78,
      hemiSky: "#8AB4F8",
      hemiGround: "#1F1812",
      hemiIntensity: 1.05,
      ambientColor: "#D6C4A8",
      ambientIntensity: 0.92,
      sunPos: [-20, 22, -16] as [number, number, number],
      sunColor: "#B8D4FF",
      sunIntensity: 1.15,
      orbPos: [-32, 24, -28] as [number, number, number],
      orbColor: "#FFF8DC",
      orbHaloColor: "#90B8F8",
    };
  }, [timeOfDay, weatherCondition]);

  return (
    <>
      <color attach="background" args={[envConfig.bgColor]} />
      <fog
        attach="fog"
        args={[envConfig.fogColor, envConfig.fogNear, envConfig.fogFar]}
      />

      {/* Vòm bầu trời 360 độ thay đổi theo Sáng, Trưa, Chiều, Tối & Thời tiết */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[68, 32, 20]} />
        <meshBasicMaterial map={domeTexture} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Mặt Trời (Ban ngày) hoặc Mặt Trăng Rằm (Ban đêm) tỏa sáng trên bầu trời */}
      {weatherCondition !== "rain" && (
        <group position={envConfig.orbPos}>
          <mesh>
            <sphereGeometry args={[timeOfDay === "night" ? 2.4 : 3.2, 24, 24]} />
            <meshBasicMaterial color={envConfig.orbColor} fog={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[timeOfDay === "night" ? 4.8 : 6.4, 24, 24]} />
            <meshBasicMaterial
              color={envConfig.orbHaloColor}
              transparent
              opacity={0.26}
              fog={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Hiệu ứng mưa rơi ngoài sân vườn chùa khi thời tiết có mưa */}
      <CourtyardRain active={weatherCondition === "rain"} />

      {/* Ánh sáng Bán Cầu tự nhiên ngoài trời kết hợp ánh sáng nội điện */}
      <hemisphereLight
        args={[
          envConfig.hemiSky,
          envConfig.hemiGround,
          envConfig.hemiIntensity,
        ]}
      />
      <ambientLight
        intensity={envConfig.ambientIntensity}
        color={envConfig.ambientColor}
      />

      {/* Ánh nắng Mặt Trời / Ánh Trăng chiếu xiên qua hai bên Chánh Điện mở thoáng */}
      <directionalLight
        position={envConfig.sunPos}
        intensity={envConfig.sunIntensity}
        color={envConfig.sunColor}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0008}
      />

      {/* Hệ thống đèn Hoàng Kim ấm áp bên trong Chánh Điện (luôn giữ cho Phật Đài & 100 tấm thảm rực rỡ cả ngày lẫn đêm) */}
      <pointLight
        position={[0, 6.2, 1.8]}
        intensity={timeOfDay === "night" ? 16.5 : 12.5}
        color="#F6D58A"
        distance={38}
        decay={1.1}
      />
      <pointLight
        position={[-5.5, 5.2, 3.0]}
        intensity={timeOfDay === "night" ? 10.5 : 7.5}
        color="#FFE4B5"
        distance={30}
        decay={1.2}
      />
      <pointLight
        position={[5.5, 5.2, 3.0]}
        intensity={timeOfDay === "night" ? 10.5 : 7.5}
        color="#FFE4B5"
        distance={30}
        decay={1.2}
      />
    </>
  );
}
