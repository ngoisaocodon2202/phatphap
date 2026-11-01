"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

      // 1. Xung va chạm âm cao đầu tiên (Click transient ~1250Hz)
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = "sine";
      const freq = 1260 + (Math.random() - 0.5) * 160;
      oscClick.frequency.setValueAtTime(freq, t);
      oscClick.frequency.exponentialRampToValueAtTime(340, t + 0.032);

      gainClick.gain.setValueAtTime(0.38, t);
      gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);
      oscClick.start(t);
      oscClick.stop(t + 0.038);

      // 2. Độ cộng hưởng thớ gỗ trầm đầm ấm (Body resonance)
      const oscBody = ctx.createOscillator();
      const gainBody = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.value = 720 + (Math.random() - 0.5) * 90;
      filter.Q.value = 3.8;

      oscBody.type = "triangle";
      oscBody.frequency.setValueAtTime(760, t);
      oscBody.frequency.exponentialRampToValueAtTime(210, t + 0.065);

      gainBody.gain.setValueAtTime(0.28, t);
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
  const [activeRipple, setActiveRipple] = useState(false);

  // Chống giữ nút/giữ phím đếm liên tục: mỗi lần bấm chỉ lần đúng 1 hạt
  const lastActionTime = useRef(0);

  // ── LẦN ĐÚNG 1 HẠT (CHỈ TỪNG HẠT MỘT, KHÔNG TỰ ĐỘNG LẶP) ──
  const advanceOneBead = useCallback(() => {
    const now = Date.now();
    // Ngăn chặn giữ nút hoặc spam phím: tối thiểu 160ms giữa 2 lần nhấn
    if (now - lastActionTime.current < 160) return;
    lastActionTime.current = now;

    if (malaCount >= 108) return; // Đã đủ 108 hạt thì dừng lại

    if (soundEnabled) {
      malaSoundEngine.playBeadClack();
    }
    // Rung nhẹ cảm ứng trên điện thoại
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(22);
      } catch {}
    }

    setActiveRipple(true);
    incrementMala();
    setTimeout(() => setActiveRipple(false), 200);
  }, [malaCount, soundEnabled, incrementMala]);

  // Lùi lại 1 hạt
  const stepBackOneBead = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 160) return;
    lastActionTime.current = now;

    if (malaCount <= 0) return;

    if (soundEnabled) {
      malaSoundEngine.playBeadClack();
    }
    decrementMala();
  }, [malaCount, soundEnabled, decrementMala]);

  // Ngân chuông khi viên mãn 108 hạt
  useEffect(() => {
    if (malaCount === 108 && soundEnabled) {
      malaSoundEngine.playCompletionBell();
    }
  }, [malaCount, soundEnabled]);

  // Hỗ trợ phím Space / Enter / Mũi tên: TUYỆT ĐỐI KHÔNG TỰ LẶP KHI GIỮ PHÍM (e.repeat = false)
  useEffect(() => {
    if (!malaModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua hoàn toàn sự kiện lặp khi người dùng đè giữ phím
      if (e.repeat) return;

      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        advanceOneBead();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepBackOneBead();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [malaModalOpen, advanceOneBead, stepBackOneBead]);

  // ── TÍNH TOÁN TỌA ĐỘ 108 HẠT TRÊN VÒNG TRÒN CHUỖI HẠT (HÌNH CÁI VÒNG) ──
  const TOTAL_BEADS = 108;
  const CENTER_X = 150;
  const CENTER_Y = 145;
  const RADIUS = 118;

  const beads = useMemo(() => {
    return Array.from({ length: TOTAL_BEADS }, (_, i) => {
      const beadNum = i + 1;
      // Bắt đầu từ góc 90 độ (đáy dưới là Hạt Mẹ) chạy tròn theo chiều kim đồng hồ
      const angleDeg = 90 + (beadNum / TOTAL_BEADS) * 360;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cx = CENTER_X + RADIUS * Math.cos(angleRad);
      const cy = CENTER_Y + RADIUS * Math.sin(angleRad);
      return {
        num: beadNum,
        cx,
        cy,
        isGuru: beadNum === 108,
      };
    });
  }, []);

  if (!malaModalOpen) return null;

  const currentMantra = MANTRAS[mantraIdx];
  const isCompleted = malaCount >= 108;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 85,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        background: "rgba(10, 5, 2, 0.82)",
        backdropFilter: "blur(18px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={() => setMalaModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          background:
            "linear-gradient(180deg, rgba(58, 42, 30, 0.96) 0%, rgba(28, 18, 12, 0.98) 100%)",
          backdropFilter: "blur(24px)",
          border: "1.8px solid rgba(235, 195, 112, 0.8)",
          borderRadius: "24px",
          padding: "16px 18px 18px",
          boxShadow:
            "0 28px 75px rgba(0, 0, 0, 0.9), 0 0 45px rgba(217, 164, 65, 0.28)",
          color: "#F7EBD5",
          position: "relative",
          boxSizing: "border-box",
          userSelect: "none",
        }}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={() => setMalaModalOpen(false)}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-[#D9A441]/45 text-[#F6D58A] flex items-center justify-center text-sm transition-all z-10"
        >
          ✕
        </button>

        {/* Nút Bật/Tắt Tiếng Gỗ góc trái */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`absolute top-3.5 left-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-all z-10 ${
            soundEnabled
              ? "bg-[#D9A441]/25 border-[#F6D58A] text-[#FFF4D2]"
              : "bg-black/40 border-white/20 text-[#F7EBD5]/60"
          }`}
          title={soundEnabled ? "Tắt tiếng hạt gỗ" : "Bật tiếng hạt gỗ"}
        >
          <span>{soundEnabled ? "🔊" : "🔇"}</span>
          <span className="font-medium whitespace-nowrap">
            {soundEnabled ? "Âm thanh" : "Tắt âm"}
          </span>
        </button>

        {/* Tiêu đề thanh tịnh */}
        <div className="text-center pt-1 mb-1">
          <h2 className="text-base sm:text-lg font-bold text-[#F8DFA1] tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>📿</span>
            <span>CHUỖI 108 HẠT BỒ ĐỀ</span>
          </h2>
        </div>

        {/* ── HÌNH CÁI VÒNG CHUỖI HẠT TRÒN THẬT 108 HẠT ── */}
        <div className="relative flex items-center justify-center my-1">
          <svg
            width="300"
            height="315"
            viewBox="0 0 300 315"
            className="overflow-visible select-none pointer-events-none"
          >
            <defs>
              {/* Gradient hạt đã lần niệm (Vàng hổ phách tỏa sáng) */}
              <radialGradient id="chantedBead" cx="35%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#FFF2C6" />
                <stop offset="40%" stopColor="#F6D58A" />
                <stop offset="75%" stopColor="#C98B20" />
                <stop offset="100%" stopColor="#6C410A" />
              </radialGradient>

              {/* Gradient hạt đang niệm hiện tại (Hào quang vàng rực) */}
              <radialGradient id="activeBead" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#FFF3CE" />
                <stop offset="65%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </radialGradient>

              {/* Gradient hạt gỗ trầm chưa lần (Màu gỗ mun/trầm ấm tự nhiên) */}
              <radialGradient id="unchantedBead" cx="35%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#9C6B3E" />
                <stop offset="45%" stopColor="#5E381A" />
                <stop offset="85%" stopColor="#381E0B" />
                <stop offset="100%" stopColor="#1E0D04" />
              </radialGradient>

              {/* Gradient Hạt Mẹ (Guru Bead) */}
              <radialGradient id="guruBeadGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="35%" stopColor="#FBBF24" />
                <stop offset="75%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#451A03" />
              </radialGradient>
            </defs>

            {/* Sợi dây tơ xỏ liên kết trọn vẹn thành 1 vòng tròn */}
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={RADIUS}
              fill="none"
              stroke="#8C5815"
              strokeWidth="2.2"
              opacity="0.65"
            />

            {/* Vẽ toàn bộ 108 Hạt Tràng đều đặn quanh vòng tròn */}
            {beads.map((bead) => {
              const isChanted = bead.num <= malaCount;
              const isActive = bead.num === malaCount;
              const isGuru = bead.isGuru;

              let r = 3.6;
              let fill = "url(#unchantedBead)";
              let stroke = "#542E12";
              let strokeWidth = 0.8;

              if (isGuru) {
                r = isCompleted ? 8.5 : 7.5;
                fill = isCompleted ? "url(#guruBeadGrad)" : "url(#unchantedBead)";
                stroke = isCompleted ? "#FFF0B3" : "#784419";
                strokeWidth = 1.4;
              } else if (isActive) {
                r = 6.2;
                fill = "url(#activeBead)";
                stroke = "#FFFFFF";
                strokeWidth = 1.5;
              } else if (isChanted) {
                r = 4.2;
                fill = "url(#chantedBead)";
                stroke = "#FDE68A";
                strokeWidth = 0.9;
              }

              return (
                <g key={bead.num}>
                  {/* Hiệu ứng hào quang phát sáng ở hạt hiện tại */}
                  {isActive && (
                    <circle
                      cx={bead.cx}
                      cy={bead.cy}
                      r={10.5}
                      fill="none"
                      stroke="#F6D58A"
                      strokeWidth="1.6"
                      opacity="0.75"
                      className="animate-ping"
                      style={{ animationDuration: "1.8s" }}
                    />
                  )}
                  <circle
                    cx={bead.cx}
                    cy={bead.cy}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    style={{
                      filter: isActive || (isGuru && isCompleted) ? "drop-shadow(0 0 5px #F6D58A)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                </g>
              );
            })}

            {/* Tua rua lụa đỏ vàng treo ở Hạt Mẹ (Guru Bead) phía đáy vòng tròn */}
            <g transform={`translate(${CENTER_X}, ${CENTER_Y + RADIUS + 5})`}>
              {/* Thắt nút hoa sen hồ lô */}
              <rect x="-3" y="0" width="6" height="5" rx="1.5" fill="#D97706" stroke="#FDE68A" strokeWidth="0.8" />
              {/* Dải tua rua đỏ thắm trang nghiêm */}
              <path
                d="M-5,5 L5,5 L7,34 L-7,34 Z"
                fill="url(#tasselGrad)"
              />
              <linearGradient id="tasselGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="60%" stopColor="#B91C1C" />
                <stop offset="90%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </g>
          </svg>

          {/* ── BỐ CỤC TRUNG TÂM NẰM TRỌN TRONG LÒNG VÒNG TRÒN ── */}
          <div
            className="absolute flex flex-col items-center justify-center text-center cursor-pointer select-none"
            style={{
              width: "186px",
              height: "186px",
              borderRadius: "999px",
              background: "radial-gradient(circle at 50% 50%, rgba(42, 26, 17, 0.75) 0%, rgba(18, 10, 6, 0.95) 100%)",
              border: "1.2px solid rgba(217, 164, 65, 0.35)",
              boxShadow: "inset 0 0 24px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 0, 0, 0.6)",
            }}
            onClick={advanceOneBead}
            title="Nhấn vào đây để lần 1 hạt (hoặc nhấn nút bên dưới)"
          >
            {/* Chọn Câu Niệm Phật */}
            <div
              className="flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full bg-black/40 border border-[#D9A441]/30 max-w-[170px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMantraIdx((mantraIdx + MANTRAS.length - 1) % MANTRAS.length)}
                className="text-[#F6D58A] hover:scale-125 px-1 font-bold text-[11px]"
              >
                ◀
              </button>
              <span className="text-[11px] font-bold text-[#FFF3D6] truncate whitespace-nowrap">
                {currentMantra.text}
              </span>
              <button
                type="button"
                onClick={() => setMantraIdx((mantraIdx + 1) % MANTRAS.length)}
                className="text-[#F6D58A] hover:scale-125 px-1 font-bold text-[11px]"
              >
                ▶
              </button>
            </div>

            {/* Số hạt lớn ở tâm vòng tròn */}
            <div className="relative">
              <span
                className={`text-4xl sm:text-[44px] font-extrabold tracking-tight transition-transform ${
                  activeRipple ? "scale-110" : "scale-100"
                }`}
                style={{
                  fontFamily: "serif",
                  color: isCompleted ? "#FDE047" : "#FFF5D6",
                  textShadow: "0 2px 14px rgba(246, 213, 138, 0.45)",
                }}
              >
                {malaCount}
              </span>
              <span className="block text-[10px] font-bold text-[#F6D58A]/85 uppercase tracking-wider -mt-0.5">
                / 108 HẠT BỒ ĐỀ
              </span>
            </div>

            {/* Nút chạm lần hạt ngay trong lòng vòng */}
            <div className="mt-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#F6D58A]/25 to-[#D9A441]/35 border border-[#F6D58A]/60 text-[10.5px] font-bold text-[#FFF4D2] hover:scale-105 active:scale-95 transition-all shadow-sm whitespace-nowrap">
              {isCompleted ? "✨ ĐÃ ĐỦ 108 HẠT" : "👉 CHẠM LẦN 1 HẠT"}
            </div>
          </div>
        </div>

        {/* ── THÔNG BÁO VIÊN MÃN KHI ĐỦ 108 HẠT ── */}
        {isCompleted && (
          <div className="my-1.5 p-2 rounded-xl bg-gradient-to-r from-[#8C5815]/35 via-[#D9A441]/30 to-[#8C5815]/35 border border-[#F6D58A]/70 text-center shadow-md animate-in zoom-in-95">
            <div className="text-xs sm:text-sm font-bold text-[#FFF6DB] flex items-center justify-center gap-1">
              <span>🪷</span>
              <span>ĐÃ VIÊN MÃN 108 HẠT TRÀNG</span>
              <span>🪷</span>
            </div>
            <p className="text-[10px] text-[#F7EBD5]/85 mt-0.5 leading-snug">
              Công đức vô lượng · Tịnh hóa 108 phiền não, thân tâm an lạc tự tại.
            </p>
          </div>
        )}

        {/* ── BỐ CỤC 3 NÚT ĐIỀU KHIỂN RÕ RÀNG (CHỈ BẤM TỪNG 1 HẠT, KHÔNG TỰ CHẠY LIÊN TỤC) ── */}
        <div className="flex items-center gap-2 mt-2 text-xs">
          {/* Nút Lùi 1 hạt */}
          <button
            type="button"
            onClick={stepBackOneBead}
            disabled={malaCount <= 0}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F7EBD5]/80 font-semibold border border-[#D9A441]/30 disabled:opacity-30 active:scale-95 transition-all whitespace-nowrap"
            title="Lùi lại đúng 1 hạt"
          >
            ◀ Lùi
          </button>

          {/* Nút Lần 1 Hạt chính (Bấm 1 cái ăn đúng 1 hạt) */}
          <button
            type="button"
            onClick={advanceOneBead}
            disabled={isCompleted}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isCompleted
                ? "bg-stone-700/60 border border-stone-500 text-stone-300 opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-[#F6D58A] via-[#E2AC43] to-[#B87D1E] text-[#1B0D09] hover:brightness-105"
            }`}
          >
            <span>📿</span>
            <span>{isCompleted ? "Đã Đủ 108 Hạt (Dừng)" : "Lần 1 Hạt (+1)"}</span>
          </button>

          {/* Nút Đặt lại về 0 */}
          <button
            type="button"
            onClick={() => {
              resetMala();
              if (soundEnabled) malaSoundEngine.playBeadClack();
            }}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F7EBD5]/80 font-semibold border border-[#D9A441]/30 active:scale-95 transition-all whitespace-nowrap"
            title="Đặt lại về hạt số 0 để lần chuỗi mới"
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}