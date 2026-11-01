"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTempleStore } from "@/stores/templeStore";

// ── BỘ TỔNG HỢP ÂM THANH TIẾNG HẠT GỖ TRẦM HƯƠNG & CHUÔNG VIÊN MÃN (WEB AUDIO API) ──
class MalaAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Tiếng lách cách hai hạt gỗ va vào nhau (gỗ trầm hương ấm áp, đanh giòn, tự nhiên)
  playBeadClack() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;

      // 1. Xung va chạm âm cao đầu tiên (Click transient ~1300Hz)
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = "sine";
      const freq = 1260 + (Math.random() - 0.5) * 160;
      oscClick.frequency.setValueAtTime(freq, t);
      oscClick.frequency.exponentialRampToValueAtTime(340, t + 0.032);

      gainClick.gain.setValueAtTime(0.42, t);
      gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);
      oscClick.start(t);
      oscClick.stop(t + 0.038);

      // 2. Độ cộng hưởng thớ gỗ trầm đầm ấm (Body resonance 650Hz -> 200Hz)
      const oscBody = ctx.createOscillator();
      const gainBody = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.value = 720 + (Math.random() - 0.5) * 90;
      filter.Q.value = 3.8;

      oscBody.type = "triangle";
      oscBody.frequency.setValueAtTime(760, t);
      oscBody.frequency.exponentialRampToValueAtTime(210, t + 0.065);

      gainBody.gain.setValueAtTime(0.32, t);
      gainBody.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      oscBody.connect(filter);
      filter.connect(gainBody);
      gainBody.connect(ctx.destination);

      oscBody.start(t);
      oscBody.stop(t + 0.075);
    } catch {}
  }

  // Tiếng chuông khánh ngân vang khi viên mãn 108 hạt
  playCompletionBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;

      const freqs = [587.33, 880, 1174.66, 1760]; // Hợp âm thanh tịnh D5, A5, D6, A6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);

        const duration = 2.8 - i * 0.35;
        gain.gain.setValueAtTime(0.18 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {}
  }
}

const malaSoundEngine = new MalaAudioEngine();

const MANTRAS = [
  { id: "adidaphat", text: "Nam Mô A Di Đà Phật", sub: "Vô Lượng Quang · Vô Lượng Thọ" },
  { id: "quantheam", text: "Nam Mô Quán Thế Âm Bồ Tát", sub: "Đại Bi Cứu Khổ Cứu Nạn" },
  { id: "lucmon", text: "Án Ma Ni Bát Mê Hồng", sub: "Lục Tự Đại Minh Chân Ngôn" },
  { id: "bonthich", text: "Nam Mô Bổn Sư Thích Ca Mâu Ni Phật", sub: "Bậc Giác Ngộ Tối Thượng" },
];

export function MalaModal() {
  const malaModalOpen    = useTempleStore((s) => s.malaModalOpen);
  const setMalaModalOpen = useTempleStore((s) => s.setMalaModalOpen);
  const malaCount        = useTempleStore((s) => s.malaCount);
  const incrementMala    = useTempleStore((s) => s.incrementMala);
  const decrementMala    = useTempleStore((s) => s.decrementMala);
  const resetMala        = useTempleStore((s) => s.resetMala);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mantraIdx, setMantraIdx] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0); // Offset chuyển động hạt khi scroll/drag
  const [isAnimating, setIsAnimating] = useState(false);

  // Throttling để mỗi lần cuộn chuột/lướt ngón tay trượt đúng 1 hạt ("từng 1 hạt")
  const lastScrollTime = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Thực hiện lần 1 hạt (tiến tới)
  const advanceOneBead = useCallback(() => {
    if (malaCount >= 108) return; // Đủ 108 hạt thì dừng lại, không tăng nữa

    if (soundEnabled) {
      malaSoundEngine.playBeadClack();
    }
    // Rung phản hồi cảm ứng trên di động (haptic feedback)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(22);
      } catch {}
    }

    setSlideOffset(-32);
    setIsAnimating(true);
    incrementMala();

    setTimeout(() => {
      setSlideOffset(0);
      setIsAnimating(false);
    }, 140);
  }, [malaCount, soundEnabled, incrementMala]);

  // Thực hiện lùi 1 hạt
  const stepBackOneBead = useCallback(() => {
    if (malaCount <= 0) return;

    if (soundEnabled) {
      malaSoundEngine.playBeadClack();
    }
    setSlideOffset(32);
    setIsAnimating(true);
    decrementMala();

    setTimeout(() => {
      setSlideOffset(0);
      setIsAnimating(false);
    }, 140);
  }, [malaCount, soundEnabled, decrementMala]);

  // Xử lý khi đạt 108 hạt
  useEffect(() => {
    if (malaCount === 108 && soundEnabled) {
      malaSoundEngine.playCompletionBell();
    }
  }, [malaCount, soundEnabled]);

  // ── XỬ LÝ SCROLL TRÊN DESKTOP (CHUỘT / TRACKPAD CUỘN TỪNG 1 HẠT) ──
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const now = Date.now();
      // Ngăn chặn scroll quá nhanh: mỗi nấc cuộn cách nhau tối thiểu 110ms để trượt rõ từng hạt
      if (now - lastScrollTime.current < 110) return;
      lastScrollTime.current = now;

      if (e.deltaY > 0) {
        advanceOneBead();
      } else if (e.deltaY < 0) {
        stepBackOneBead();
      }
    },
    [advanceOneBead, stepBackOneBead]
  );

  // ── XỬ LÝ VUỐT TRÊN MOBILE (TOUCH SWIPE TRƯỢT TỪNG 1 HẠT) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    touchCurrentY.current = e.touches[0].clientY;
    const dy = touchCurrentY.current - touchStartY.current;

    // Khi ngón tay kéo trượt được ~32px, thực hiện lần đúng 1 hạt rồi reset anchor
    if (dy < -32) {
      advanceOneBead();
      touchStartY.current = touchCurrentY.current;
    } else if (dy > 32) {
      stepBackOneBead();
      touchStartY.current = touchCurrentY.current;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  // Hỗ trợ phím mũi tên và Spacebar trên Desktop
  useEffect(() => {
    if (!malaModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advanceOneBead();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepBackOneBead();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [malaModalOpen, advanceOneBead, stepBackOneBead]);

  if (!malaModalOpen) return null;

  const currentMantra = MANTRAS[mantraIdx];
  const isCompleted = malaCount >= 108;

  // Tính toán 7 hạt trên dòng tràng hạt (3 hạt phía trước, 1 hạt trung tâm, 3 hạt phía sau)
  const currentBeadNum = malaCount === 0 ? 1 : malaCount;
  const beadIndices = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "radial-gradient(circle at 50% 50%, rgba(26, 12, 6, 0.82) 0%, rgba(8, 4, 2, 0.94) 100%)",
        backdropFilter: "blur(16px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={() => setMalaModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          background:
            "linear-gradient(180deg, rgba(62, 44, 30, 0.96) 0%, rgba(32, 20, 12, 0.98) 100%)",
          backdropFilter: "blur(24px)",
          border: "2px solid rgba(235, 195, 112, 0.8)",
          borderRadius: "26px",
          padding: "24px 20px 20px",
          boxShadow:
            "0 28px 75px rgba(0, 0, 0, 0.9), 0 0 45px rgba(217, 164, 65, 0.3), inset 0 1px 0 rgba(255, 244, 210, 0.45)",
          color: "#F7EBD5",
          position: "relative",
          boxSizing: "border-box",
          userSelect: "none",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => setMalaModalOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-[#D9A441]/45 text-[#F6D58A] flex items-center justify-center text-sm transition-all"
        >
          ✕
        </button>

        {/* Nút Bật/Tắt Tiếng Lách Cách Của Hạt Gỗ */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${
            soundEnabled
              ? "bg-[#D9A441]/25 border-[#F6D58A] text-[#FFF4D2]"
              : "bg-black/40 border-white/20 text-[#F7EBD5]/60"
          }`}
          title={soundEnabled ? "Tắt tiếng hạt" : "Bật tiếng hạt"}
        >
          <span>{soundEnabled ? "🔊" : "🔇"}</span>
          <span className="hidden sm:inline font-medium">
            {soundEnabled ? "Tiếng hạt: Bật" : "Tiếng hạt: Tắt"}
          </span>
        </button>

        {/* Tiêu đề & Chọn Câu Niệm Phật */}
        <div className="text-center mt-2 mb-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#F8DFA1] tracking-wide flex items-center justify-center gap-2">
            <span>📿</span>
            <span>LẦN TRÀNG HẠT 108 HẠT</span>
          </h2>

          {/* Chọn Danh Hiệu Niệm Phật */}
          <div className="mt-2 inline-flex items-center gap-2 bg-[#26150D]/90 border border-[#D9A441]/40 rounded-full px-3 py-1 shadow-inner">
            <button
              type="button"
              onClick={() => setMantraIdx((mantraIdx + MANTRAS.length - 1) % MANTRAS.length)}
              className="text-[#F6D58A] hover:scale-125 px-1 font-bold text-xs"
            >
              ◀
            </button>
            <div className="text-center min-w-[170px] sm:min-w-[200px]">
              <div className="text-xs sm:text-[13px] font-bold text-[#FFF3D6] leading-tight">
                {currentMantra.text}
              </div>
              <div className="text-[9.5px] text-[#F6D58A]/75">{currentMantra.sub}</div>
            </div>
            <button
              type="button"
              onClick={() => setMantraIdx((mantraIdx + 1) % MANTRAS.length)}
              className="text-[#F6D58A] hover:scale-125 px-1 font-bold text-xs"
            >
              ▶
            </button>
          </div>
        </div>

        {/* ── VÒNG TRÒN TIẾN TRÌNH 108 HẠT TRÀNG TOÀN CẢNH ── */}
        <div className="relative flex items-center justify-center py-1">
          <svg width="220" height="48" viewBox="0 0 220 48" className="overflow-visible">
            {/* Vòng cong chuỗi hạt */}
            <path
              d="M 15,24 Q 110,4 205,24"
              fill="none"
              stroke="#8B5A2B"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              opacity="0.65"
            />
            {/* Hiển thị các chấm biểu tượng cho tiến trình 108 hạt */}
            {Array.from({ length: 36 }).map((_, i) => {
              const progressRatio = (i + 1) / 36;
              const isChanted = malaCount / 108 >= progressRatio;
              const t = i / 35;
              // Điểm trên đường cong Bezier
              const px = 15 + t * 190;
              const py = (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * 4 + t * t * 24;

              return (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={isChanted ? 3.2 : 2.2}
                  fill={isChanted ? "#F6D58A" : "#4A2B15"}
                  stroke={isChanted ? "#FFEBA6" : "#724722"}
                  strokeWidth={0.8}
                  style={{
                    filter: isChanted ? "drop-shadow(0 0 4px #F6D58A)" : "none",
                    transition: "all 0.2s ease",
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* ── DÒNG HẠT THẬT (TƯƠNG TÁC SCROLL / TOUCH VUỐT TỪNG 1 HẠT) ── */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative my-2 py-4 flex flex-col items-center justify-center cursor-ns-resize touch-none select-none overflow-hidden rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(45, 28, 18, 0.75) 0%, rgba(20, 10, 6, 0.95) 100%)",
            border: "1.5px solid rgba(217, 164, 65, 0.4)",
            boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.75)",
            height: "230px",
          }}
          title="Cuộn chuột hoặc vuốt ngón tay lên/xuống để lần từng hạt"
        >
          {/* Sợi dây tơ vàng xỏ xuyên suốt qua tâm các hạt chuỗi */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: "4px",
              transform: "translateX(-50%)",
              background: "linear-gradient(180deg, #A87625 0%, #F6D58A 50%, #8C5815 100%)",
              boxShadow: "0 0 8px rgba(246, 213, 138, 0.6)",
              borderRadius: "999px",
              zIndex: 1,
            }}
          />

          {/* Khung tiêu điểm Hoàng Kim đánh dấu Hạt Chuỗi Đang Lần */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "106px",
              height: "106px",
              borderRadius: "999px",
              border: "1.8px dashed rgba(246, 213, 138, 0.8)",
              boxShadow: "0 0 24px rgba(246, 213, 138, 0.35), inset 0 0 16px rgba(246, 213, 138, 0.2)",
              pointerEvents: "none",
              zIndex: 2,
              animation: "pulse 2.2s infinite",
            }}
          />

          {/* Dòng hạt di chuyển mượt mà */}
          <div
            className="flex flex-col items-center justify-center relative w-full h-full"
            style={{
              transform: `translateY(${slideOffset}px)`,
              transition: isAnimating ? "transform 0.12s ease-out" : "none",
              zIndex: 3,
            }}
          >
            {beadIndices.map((relIdx) => {
              const beadNum = currentBeadNum + relIdx;
              if (beadNum < 1 || beadNum > 108) return null;

              const isCenter = relIdx === 0;
              const isGuruBead = beadNum === 108; // Hạt Mẹ / Hồ Lô Phật Đầu

              // Kích thước hạt co giãn theo khoảng cách từ tâm (hiệu ứng 3D sâu)
              const absDist = Math.abs(relIdx);
              const beadSize = isCenter ? 84 : absDist === 1 ? 58 : absDist === 2 ? 44 : 32;
              const beadOpacity = isCenter ? 1 : absDist === 1 ? 0.82 : absDist === 2 ? 0.55 : 0.25;

              return (
                <div
                  key={beadNum}
                  onClick={() => {
                    if (isCenter) advanceOneBead();
                    else if (relIdx > 0) advanceOneBead();
                    else stepBackOneBead();
                  }}
                  className="flex items-center justify-center relative my-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    width: `${beadSize}px`,
                    height: `${beadSize}px`,
                    borderRadius: "999px",
                    opacity: beadOpacity,
                    // Kết cấu khối cầu gỗ trầm hương 3D chân thực
                    background: isGuruBead
                      ? "radial-gradient(circle at 35% 32%, #FFE5A3 0%, #D99B26 40%, #8C5512 75%, #3E1E05 100%)"
                      : "radial-gradient(circle at 35% 32%, #FBE3B5 0%, #9C6332 38%, #5A3315 72%, #2A1406 100%)",
                    border: isCenter
                      ? "2.5px solid #FFF3D6"
                      : "1.4px solid rgba(246, 213, 138, 0.45)",
                    boxShadow: isCenter
                      ? "0 10px 28px rgba(0, 0, 0, 0.8), 0 0 20px rgba(246, 213, 138, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.6)"
                      : "0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  {/* Lỗ xỏ chỉ tâm hạt */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#180A04] opacity-80" />

                  {/* Số thứ tự hạt hiển thị trang nhã bằng màu vàng kim */}
                  <div className="relative text-center pointer-events-none">
                    <span
                      style={{
                        fontSize: isCenter ? "21px" : absDist === 1 ? "13px" : "10px",
                        fontWeight: 800,
                        fontFamily: "serif",
                        color: isGuruBead ? "#FFF8E7" : "#FFF4D2",
                        textShadow: "0 2px 6px rgba(0, 0, 0, 0.85)",
                        lineHeight: 1,
                      }}
                    >
                      {beadNum}
                    </span>
                    {isCenter && (
                      <span className="block text-[9px] uppercase tracking-wider text-[#FCE6A9] font-semibold mt-0.5">
                        {isGuruBead ? "Hạt Mẹ" : "Hạt Tràng"}
                      </span>
                    )}
                  </div>

                  {/* Tua rua tơ lụa đỏ vàng treo ở Hạt Mẹ (#108) */}
                  {isGuruBead && isCenter && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "16px",
                        height: "22px",
                        background: "linear-gradient(180deg, #DC2626 0%, #B91C1C 70%, #D97706 100%)",
                        borderRadius: "2px 2px 6px 6px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Gợi ý thao tác cuộn */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 text-[10px] text-[#F7EBD5]/75 pointer-events-none">
            <span>🖱️ Cuộn chuột</span>
            <span>·</span>
            <span>👆 Vuốt ngón tay</span>
            <span>·</span>
            <span>Chạm hạt để lần</span>
          </div>
        </div>

        {/* ── BẢNG THÔNG BÁO VIÊN MÃN 108 HẠT ── */}
        {isCompleted ? (
          <div className="my-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#946820]/45 via-[#D9A441]/35 to-[#946820]/45 border border-[#F6D58A] text-center shadow-xl animate-in zoom-in-95">
            <div className="text-sm sm:text-base font-bold text-[#FFF6DB] flex items-center justify-center gap-1.5">
              <span>🪷</span>
              <span>ĐÃ VIÊN MÃN 108 HẠT TRÀNG</span>
              <span>🪷</span>
            </div>
            <p className="text-[11px] text-[#F7EBD5]/90 mt-1 leading-snug">
              Công đức vô lượng · Tịnh hóa 108 phiền não thế gian, tâm an lạc tự tại.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-1.5 my-1 bg-[#23140C]/75 rounded-xl border border-[#D9A441]/25 text-xs">
            <span className="text-[#F7EBD5]/75">Tiến độ lần chuỗi:</span>
            <span className="font-bold text-[#F6D58A] text-sm">
              {malaCount} <span className="text-xs text-[#F7EBD5]/60">/ 108 Hạt</span>
            </span>
          </div>
        )}

        {/* ── NÚT ĐIỀU KHIỂN & LẦN TIẾP ── */}
        <div className="flex items-center gap-2 mt-3 text-xs">
          {/* Nút Lùi 1 hạt */}
          <button
            type="button"
            onClick={stepBackOneBead}
            disabled={malaCount <= 0}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F7EBD5]/80 font-medium border border-[#D9A441]/30 disabled:opacity-30 active:scale-95 transition-all"
            title="Lùi lại 1 hạt"
          >
            ◀ Lùi
          </button>

          {/* Nút Lần 1 Hạt (Nút chính to nổi bật) */}
          <button
            type="button"
            onClick={advanceOneBead}
            disabled={isCompleted}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-center flex items-center justify-center gap-2 ${
              isCompleted
                ? "bg-stone-700/60 border border-stone-500 text-stone-300 opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-[#F6D58A] via-[#E2AC43] to-[#B87D1E] text-[#1B0D09] hover:brightness-105"
            }`}
          >
            <span>📿</span>
            <span>{isCompleted ? "Đã Đủ 108 Hạt (Dừng)" : "Lần 1 Hạt (+1)"}</span>
          </button>

          {/* Nút Làm Lại Từ Đầu */}
          <button
            type="button"
            onClick={() => {
              resetMala();
              if (soundEnabled) malaSoundEngine.playBeadClack();
            }}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F7EBD5]/80 font-medium border border-[#D9A441]/30 active:scale-95 transition-all"
            title="Đặt lại về hạt số 0"
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
