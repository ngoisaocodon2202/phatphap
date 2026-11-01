"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTempleStore } from "@/stores/templeStore";

export function VirtualJoystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const setJoystickVector = useTempleStore((s) => s.setJoystickVector);
  const triggerJump        = useTempleStore((s) => s.triggerJump);
  const localAction        = useTempleStore((s) => s.localAction);
  const sutraModalOpen     = useTempleStore((s) => s.sutraModalOpen);
  const prayerModalOpen    = useTempleStore((s) => s.prayerModalOpen);
  const malaModalOpen      = useTempleStore((s) => s.malaModalOpen);

  const modalActive = sutraModalOpen || prayerModalOpen || malaModalOpen;

  const MAX_RADIUS = 40; // bán kính tối đa của joystick thumb

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (modalActive) return;

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      originRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
      if (touchIdRef.current === null) return;

      let currentTouch: React.Touch | Touch | null = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          currentTouch = e.changedTouches[i];
          break;
        }
      }
      if (!currentTouch) return;

      const dx = currentTouch.clientX - originRef.current.x;
      const dy = currentTouch.clientY - originRef.current.y;
      const distance = Math.hypot(dx, dy);

      let clampedDx = dx;
      let clampedDy = dy;
      if (distance > MAX_RADIUS) {
        clampedDx = (dx / distance) * MAX_RADIUS;
        clampedDy = (dy / distance) * MAX_RADIUS;
      }

      setKnobPos({ x: clampedDx, y: clampedDy });

      // Chuẩn hóa vector di chuyển (-1 đến 1)
      const normX = clampedDx / MAX_RADIUS;
      const normY = clampedDy / MAX_RADIUS; // -1 là tiến tới, +1 là lùi lại

      setJoystickVector({ x: normX, y: normY });
    },
    [setJoystickVector, MAX_RADIUS]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
      if (touchIdRef.current === null) return;

      let matched = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          matched = true;
          break;
        }
      }
      if (!matched) return;

      touchIdRef.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      setJoystickVector({ x: 0, y: 0 });
    },
    [setJoystickVector]
  );

  useEffect(() => {
    const onWindowTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current !== null) {
        e.preventDefault();
        handleTouchMove(e);
      }
    };
    const onWindowTouchEnd = (e: TouchEvent) => {
      handleTouchEnd(e);
    };

    window.addEventListener("touchmove", onWindowTouchMove, { passive: false });
    window.addEventListener("touchend", onWindowTouchEnd);
    window.addEventListener("touchcancel", onWindowTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onWindowTouchMove);
      window.removeEventListener("touchend", onWindowTouchEnd);
      window.removeEventListener("touchcancel", onWindowTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  if (modalActive) return null;

  return (
    <div className="pointer-events-auto md:hidden fixed left-3.5 bottom-28 z-20 flex items-end gap-3 select-none touch-none">
      {/* Vòng đế Virtual Joystick */}
      <div
        ref={baseRef}
        onTouchStart={handleTouchStart}
        className="relative w-[104px] h-[104px] rounded-full flex items-center justify-center transition-opacity"
        style={{
          background: isActive
            ? "radial-gradient(circle, rgba(65, 35, 20, 0.85) 0%, rgba(27, 13, 9, 0.92) 100%)"
            : "radial-gradient(circle, rgba(55, 30, 16, 0.65) 0%, rgba(27, 13, 9, 0.78) 100%)",
          border: isActive
            ? "2px solid #F6D58A"
            : "1.6px solid rgba(217, 164, 65, 0.65)",
          boxShadow: isActive
            ? "0 8px 24px rgba(0, 0, 0, 0.75), 0 0 16px rgba(246, 213, 138, 0.45)"
            : "0 6px 18px rgba(0, 0, 0, 0.55), 0 0 10px rgba(217, 164, 65, 0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Các vạch định hướng 4 phương: Tiến, Lùi, Trái, Phải */}
        <span className="absolute top-1.5 text-[8.5px] font-semibold text-[#F6D58A]/80 tracking-wider">▲</span>
        <span className="absolute bottom-1.5 text-[8.5px] font-semibold text-[#F6D58A]/80 tracking-wider">▼</span>
        <span className="absolute left-1.5 text-[8.5px] font-semibold text-[#F6D58A]/80 tracking-wider">◀</span>
        <span className="absolute right-1.5 text-[8.5px] font-semibold text-[#F6D58A]/80 tracking-wider">▶</span>

        {/* Nút Knob điều hướng cảm ứng */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            transition: isActive ? "none" : "transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
            background:
              "radial-gradient(circle at 35% 35%, #FFF2CF 0%, #F6D58A 45%, #D9A441 75%, #8C5B14 100%)",
            border: "2px solid #FFF8E7",
            boxShadow:
              "0 3px 10px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 0 8px rgba(246, 213, 138, 0.6)",
          }}
        >
          {/* Chấm tròn hoa sen tâm nút */}
          <div className="w-3 h-3 rounded-full bg-[#5A3810] border border-[#F6D58A]/70 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#FFE699]" />
          </div>
        </div>
      </div>

      {/* Nút Nhảy trên Mobile */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerJump();
        }}
        className="w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all active:scale-90 shadow-lg"
        style={{
          background: "linear-gradient(180deg, rgba(62, 38, 22, 0.88) 0%, rgba(32, 18, 10, 0.94) 100%)",
          border: "1.5px solid rgba(228, 184, 98, 0.75)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,242,204,0.3)",
          backdropFilter: "blur(8px)",
        }}
        title="Nhảy"
      >
        <span className="text-[13px] leading-none text-[#F6D58A]">⤒</span>
        <span className="text-[8.5px] font-bold text-[#FFF2CF] tracking-tight leading-none mt-0.5">
          Nhảy
        </span>
      </button>
    </div>
  );
}

