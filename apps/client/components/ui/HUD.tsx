"use client";
import { useTempleStore, QualityPreset } from "@/stores/templeStore";
import { sendRoomMessage } from "@/hooks/useMultiplayer";
import { ZenSelect, ZenSelectOption } from "./ZenSelect";

function LotusBrandIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none">
      <defs>
        <linearGradient id="brandGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6D58A" />
          <stop offset="55%" stopColor="#D9A441" />
          <stop offset="100%" stopColor="#9C6B19" />
        </linearGradient>
      </defs>
      <path
        d="M18 5C14.8 10.5 13.5 15.5 13.5 20C13.5 23.5 15.5 26 18 27.2C20.5 26 22.5 23.5 22.5 20C22.5 15.5 21.2 10.5 18 5Z"
        fill="url(#brandGoldGrad)"
      />
      <path
        d="M10.5 10.5C8.5 15 9.2 20.2 12.2 23.8C13.5 25.3 15.4 26.5 17.2 27C13.8 24.8 12.2 21.2 12.4 16.8C12.5 14.5 11.8 12.2 10.5 10.5Z"
        fill="url(#brandGoldGrad)"
        opacity="0.9"
      />
      <path
        d="M25.5 10.5C24.2 12.2 23.5 14.5 23.6 16.8C23.8 21.2 22.2 24.8 18.8 27C20.6 26.5 22.5 25.3 23.8 23.8C26.8 20.2 27.5 15 25.5 10.5Z"
        fill="url(#brandGoldGrad)"
        opacity="0.9"
      />
      <path
        d="M4.5 16.5C4.2 20.5 6.5 24.5 10.8 26.5C12.8 27.4 15 27.7 16.8 27.6C12.5 26.2 9.5 23.2 8.2 19.2C7.5 17.8 6.2 16.9 4.5 16.5Z"
        fill="url(#brandGoldGrad)"
        opacity="0.78"
      />
      <path
        d="M31.5 16.5C29.8 16.9 28.5 17.8 27.8 19.2C26.5 23.2 23.5 26.2 19.2 27.6C21 27.7 23.2 27.4 25.2 26.5C29.5 24.5 31.8 20.5 31.5 16.5Z"
        fill="url(#brandGoldGrad)"
        opacity="0.78"
      />
      <path
        d="M9 29.5C12 31 24 31 27 29.5"
        stroke="url(#brandGoldGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const AUDIO_TRACK_OPTIONS: ZenSelectOption[] = [
  {
    value: "moktak",
    label: "Chuông chùa & Tiếng mõ",
    shortLabel: "Chuông mõ",
    desc: "Đại Hồng Chung & mõ gỗ thư giãn",
    icon: (
      <svg viewBox="0 0 18 18" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M9 3C5.5 3 3 5.5 3 8.8c0 2.6 1.8 4.8 4.5 5.4V16h3v-1.8c2.7-.6 4.5-2.8 4.5-5.4C15 5.5 12.5 3 9 3zm-2 5.5h4a1 1 0 010 2H7a1 1 0 010-2z" />
      </svg>
    ),
  },
  {
    value: "chant",
    label: "Chuông Gia Trì & Thiền âm",
    shortLabel: "Thiền âm",
    desc: "Âm hưởng tịnh tâm an lạc",
    icon: (
      <svg viewBox="0 0 18 18" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="9" cy="9" r="5.5" strokeDasharray="2 2.2" />
        <circle cx="9" cy="3.2" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "rain",
    label: "Mưa rơi & Chuông gió chùa",
    shortLabel: "Tiếng mưa",
    desc: "Tiếng mưa hiên chùa thanh lương",
    icon: (
      <svg viewBox="0 0 18 18" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 10.5a3.5 3.5 0 016.8-1A2.8 2.8 0 0114 12.2H5.2A2.5 2.5 0 015 10.5z" />
        <path d="M6.5 14l-1 2M9.5 14l-1 2M12.5 14l-1 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "none",
    label: "Tắt âm thanh",
    shortLabel: "Tắt âm",
    desc: "Tĩnh lặng hoàn toàn",
    icon: (
      <svg viewBox="0 0 18 18" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3.5 7h2.8L10 3.8v10.4L6.3 11H3.5V7z" />
        <path d="M12.5 7l3 4m0-4l-3 4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function HUD() {
  const localPlayer         = useTempleStore((s) => s.localPlayer);
  const remotePlayersCount  = useTempleStore((s) => s.remotePlayers.size);
  const localAction         = useTempleStore((s) => s.localAction);
  const bowCount            = useTempleStore((s) => s.bowCount);
  const malaCount           = useTempleStore((s) => s.malaCount);
  const setMalaModalOpen    = useTempleStore((s) => s.setMalaModalOpen);
  const setSutraModalOpen   = useTempleStore((s) => s.setSutraModalOpen);
  const setOnboardingCompleted = useTempleStore((s) => s.setOnboardingCompleted);
  const audioTrack          = useTempleStore((s) => s.audioTrack);
  const setAudioTrack       = useTempleStore((s) => s.setAudioTrack);
  const audioPlaying        = useTempleStore((s) => s.audioPlaying);
  const toggleAudioPlaying  = useTempleStore((s) => s.toggleAudioPlaying);
  const presenceOpen        = useTempleStore((s) => s.presenceOpen);
  const setPresenceOpen     = useTempleStore((s) => s.setPresenceOpen);
  const interactionPrompt   = useTempleStore((s) => s.interactionPrompt);
  const bellRinging         = useTempleStore((s) => s.bellRinging);
  const bellRingerName      = useTempleStore((s) => s.bellRingerName);
  const setBellRinging      = useTempleStore((s) => s.setBellRinging);
  const statusNotice        = useTempleStore((s) => s.statusNotice);
  const hasNavigationTarget = useTempleStore((s) => s.navigationTarget !== null);
  const zoomIn              = useTempleStore((s) => s.zoomIn);
  const zoomOut             = useTempleStore((s) => s.zoomOut);
  const resetCamera         = useTempleStore((s) => s.resetCamera);
  const setOverviewCamera   = useTempleStore((s) => s.setOverviewCamera);
  const isOverview          = useTempleStore((s) => s.cameraZoom > 8.5);
  const sutraModalOpen      = useTempleStore((s) => s.sutraModalOpen);
  const qualityPreset       = useTempleStore((s) => s.qualityPreset);
  const setQualityPreset    = useTempleStore((s) => s.setQualityPreset);
  const timeMode            = useTempleStore((s) => s.timeMode);
  const timeOfDay           = useTempleStore((s) => s.timeOfDay);
  const weatherMode         = useTempleStore((s) => s.weatherMode);
  const weatherCondition    = useTempleStore((s) => s.weatherCondition);
  const liveTemperature     = useTempleStore((s) => s.liveTemperature);
  const liveTimeString      = useTempleStore((s) => s.liveTimeString);
  const setTimeMode         = useTempleStore((s) => s.setTimeMode);
  const setWeatherMode      = useTempleStore((s) => s.setWeatherMode);

  const phaseLabelMap: Record<string, string> = {
    morning: "Sáng",
    noon: "Trưa",
    afternoon: "Chiều",
    night: "Tối",
  };
  const phaseIconMap: Record<string, string> = {
    morning: "🌅",
    noon: "☀️",
    afternoon: "🌇",
    night: "🌙",
  };

  const currentEnvSelectValue =
    weatherMode === "rain"
      ? "rain"
      : timeMode === "realtime"
      ? "realtime"
      : timeMode;

  const envOptions: ZenSelectOption[] = [
    {
      value: "realtime",
      label: `${
        weatherCondition === "rain" ? "🌧️" : phaseIconMap[timeOfDay]
      } Real-time (${phaseLabelMap[timeOfDay]} · ${liveTemperature}°C)`,
      shortLabel: `${phaseLabelMap[timeOfDay]} ${liveTemperature}°C`,
      desc: `Đồng bộ giờ thực (${liveTimeString}) & thời tiết trực tiếp`,
    },
    {
      value: "morning",
      label: "🌅 Buổi Sáng (Bình minh)",
      shortLabel: "🌅 Sáng",
      desc: "Nắng sớm ban mai & sương nhẹ sân chùa",
    },
    {
      value: "noon",
      label: "☀️ Buổi Trưa (Quang đãng)",
      shortLabel: "☀️ Trưa",
      desc: "Trời xanh mây trắng, nắng vàng rực rỡ",
    },
    {
      value: "afternoon",
      label: "🌇 Buổi Chiều (Hoàng hôn)",
      shortLabel: "🌇 Chiều",
      desc: "Nắng chiều vàng cam chiếu xiên qua hiên chùa",
    },
    {
      value: "night",
      label: "🌙 Buổi Tối (Đêm trăng)",
      shortLabel: "🌙 Tối",
      desc: "Trăng rằm, bầu trời sao & đèn lồng tỏa sáng",
    },
    {
      value: "rain",
      label: "🌧️ Mưa Chùa (Mưa rơi)",
      shortLabel: "🌧️ Mưa",
      desc: "Mưa rơi ngoài hiên chùa & hồ sen thanh lương",
    },
  ];

  const handleEnvChange = (val: string) => {
    if (val === "rain") {
      setWeatherMode("rain");
    } else if (val === "realtime") {
      setWeatherMode("realtime");
      setTimeMode("realtime");
    } else {
      setWeatherMode("clear");
      setTimeMode(val as any);
    }
  };

  const totalPilgrims = remotePlayersCount + 1;

  // 1. Lạy Phật
  const handleBowClick = () => {
    useTempleStore.getState().startNavigateToCushion("bow");
  };

  // 2. Đọc Kinh
  const handleReadSutraClick = () => {
    setSutraModalOpen(true);
  };

  // 3. Đếm Chuỗi Hạt
  const handleMalaClick = () => {
    setMalaModalOpen(true);
  };

  // 4. Dâng Hoa Đăng (Bước ra hiên chùa và thả hoa đăng xuống hồ sen hai bên)
  const handleOfferLanternClick = () => {
    useTempleStore.getState().startWalkToPondForLantern();
  };

  // Thỉnh Đại Hồng Chung thư giãn
  const handleRingTempleBell = () => {
    setBellRinging(true, localPlayer.vietnameseName);
    sendRoomMessage("bellStrike");
    setTimeout(() => {
      useTempleStore.getState().setBellRinging(false);
    }, 3200);
  };

  const cycleQualityPreset = () => {
    const next: Record<QualityPreset, QualityPreset> = {
      high: "medium",
      medium: "low",
      low: "high",
    };
    setQualityPreset(next[qualityPreset]);
  };

  const dockButtons = [
    {
      id: "bow",
      label: bowCount > 0 ? `Lạy Phật (${bowCount})` : "Lạy Phật",
      onClick: handleBowClick,
      disabled: localAction === "bow",
      active: localAction === "bow",
    },
    {
      id: "sutra",
      label: "Đọc Kinh",
      onClick: handleReadSutraClick,
      disabled: false,
      active: false,
    },
    {
      id: "mala",
      label: malaCount > 0 ? `Đếm Chuỗi Hạt (${malaCount})` : "Đếm Chuỗi Hạt",
      onClick: handleMalaClick,
      disabled: false,
      active: false,
    },
    {
      id: "lantern",
      label: "Dâng Hoa Đăng",
      onClick: handleOfferLanternClick,
      disabled: false,
      active: false,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none flex flex-col justify-between font-sans overflow-hidden">
      {/* ── 1. THANH HEADER RESPONSIVE MOBILE & DESKTOP (KHÔNG TRÀN VIỀN, KHÔNG XUỐNG DÒNG) ── */}
      <header className="pointer-events-auto w-full max-w-full box-border bg-gradient-to-b from-[#1B0D09]/92 via-[#1B0D09]/65 to-transparent backdrop-blur-md border-b border-[#D9A441]/25 px-3 sm:px-5 md:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-3 whitespace-nowrap">
        {/* Góc trái: Logo Hoa Sen Vàng + Pháp Danh Phật Tử + Số người hiện diện */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <div
            onClick={resetCamera}
            className="flex items-center gap-1 sm:gap-2.5 cursor-pointer group shrink-0"
            title="Đặt lại góc nhìn Chánh Điện"
          >
            <div className="w-5 h-5 sm:w-9 sm:h-9 flex items-center justify-center drop-shadow-[0_2px_10px_rgba(217,164,65,0.45)] group-hover:scale-105 transition-transform shrink-0">
              <LotusBrandIcon className="w-5 h-5 sm:w-8 sm:h-8" />
            </div>
            <div className="whitespace-nowrap">
              <span className="block font-serif tracking-wide text-[13px] sm:text-base md:text-lg font-bold bg-gradient-to-r from-[#FFF3D1] via-[#F6D58A] to-[#D9A441] bg-clip-text text-transparent whitespace-nowrap leading-tight">
                SansaTemple
              </span>
              <p className="hidden sm:block text-[10px] text-[#F7EBD5]/70 tracking-wide font-light whitespace-nowrap">
                Chánh Điện 100 Bồ Đoàn Thực Tế
              </p>
            </div>
          </div>

          {/* Nút Đổi Tên & Giới Tính Mascot */}
          <button
            onClick={() => setOnboardingCompleted(false)}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#24110A]/90 backdrop-blur-md border border-[#D9A441]/50 hover:border-[#F6D58A] px-2 sm:pl-2 sm:pr-2.5 py-1 rounded-full text-[10.5px] sm:text-xs text-[#F7EBD5] transition-all hover:scale-105 active:scale-95 shadow-md whitespace-nowrap min-w-0"
            title="Nhấn để đổi Tên / Pháp danh & Giới tính nhân vật"
          >
            <span
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-[#F6D58A] shrink-0"
              style={{ background: localPlayer.avatarColor }}
            />
            <span className="font-semibold text-[#FFF4D2] max-w-[64px] sm:max-w-[140px] truncate whitespace-nowrap">
              {localPlayer.vietnameseName || "Thiện Tâm"}
            </span>
            <span className="text-[10px] text-[#F6D58A]/80 hidden md:inline whitespace-nowrap">
              ({localPlayer.gender === "female" ? "Nữ" : "Nam"})
            </span>
          </button>

          {/* Số Phật tử đang hiện diện */}
          <button
            onClick={() => setPresenceOpen(!presenceOpen)}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#1B0D09]/85 border border-[#D9A441]/35 hover:border-[#F6D58A] px-1.5 sm:px-3 py-1 rounded-full text-[10.5px] sm:text-xs text-[#F7EBD5]/90 transition-all whitespace-nowrap shrink-0"
            title="Danh sách Phật tử đang cùng tu tập"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0" />
            <span className="whitespace-nowrap">
              {totalPilgrims} <span className="hidden md:inline">Phật tử</span>
            </span>
          </button>
        </div>

        {/* Góc phải: Thỉnh Chuông Chùa, Chọn Âm Thanh Thực Tế & Đồ Họa */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
          <button
            onClick={handleRingTempleBell}
            className="flex items-center justify-center gap-1.5 bg-[#2A140B]/90 hover:bg-[#D9A441]/25 border border-[#D9A441]/55 hover:border-[#F6D58A] w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs text-[#F6D58A] font-medium transition-all active:scale-95 shadow-md whitespace-nowrap shrink-0"
            title="Thỉnh tiếng Đại Hồng Chung ngân vang thư giãn"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M10 3a4.5 4.5 0 00-4.5 4.5v2.8c0 .8-.3 1.5-.8 2.1L4 13.2h12l-.7-.8a3.2 3.2 0 01-.8-2.1V7.5A4.5 4.5 0 0010 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8.2 15.5a2 2 0 003.6 0" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline whitespace-nowrap">Thỉnh Chuông</span>
          </button>

          <div className="flex bg-[#24110A]/90 backdrop-blur-md border border-[#D9A441]/40 rounded-full px-1 sm:px-2 py-0.5 items-center gap-0.5 sm:gap-1 text-xs text-[#F7EBD5] shadow-md whitespace-nowrap shrink-0">
            <button
              onClick={toggleAudioPlaying}
              title={audioPlaying ? "Tắt âm thanh" : "Bật âm thanh"}
              className="p-1 hover:bg-white/10 rounded-full hover:scale-110 active:scale-95 transition-all shrink-0 text-[#F6D58A]"
            >
              {audioPlaying ? (
                <svg viewBox="0 0 18 18" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M3 7h2.8L9.5 3.8v10.4L5.8 11H3V7z" fill="currentColor" />
                  <path d="M12 6.2a4 4 0 010 5.6M14 4.2a7 7 0 010 9.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 18 18" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M3 7h2.8L9.5 3.8v10.4L5.8 11H3V7z" />
                  <path d="M12.2 7l3 4m0-4l-3 4" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <ZenSelect
              value={audioTrack}
              options={AUDIO_TRACK_OPTIONS}
              onChange={(val) => setAudioTrack(val as any)}
            />
          </div>

          {/* Chọn Thời Gian & Thời Tiết Real-time (Sáng / Trưa / Chiều / Tối / Mưa) trên Desktop */}
          <div className="hidden md:flex bg-[#24110A]/90 backdrop-blur-md border border-[#D9A441]/40 rounded-full px-1.5 py-0.5 items-center text-xs text-[#F7EBD5] shadow-md whitespace-nowrap shrink-0">
            <ZenSelect
              value={currentEnvSelectValue}
              options={envOptions}
              onChange={handleEnvChange}
            />
          </div>

          <button
            onClick={cycleQualityPreset}
            className="hidden lg:flex items-center gap-1 bg-[#24110A]/85 backdrop-blur-md border border-[#D9A441]/35 hover:border-[#F6D58A]/70 px-2.5 py-1.5 rounded-full text-[11px] text-[#F7EBD5]/85 hover:text-[#F6D58A] transition-all shadow-md whitespace-nowrap shrink-0"
            title="Chuyển đổi mức đồ họa 3D (Cao / Trung bình / Thấp)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] shrink-0" />
            <span className="whitespace-nowrap">
              {qualityPreset === "high"
                ? "Đồ họa: Cao"
                : qualityPreset === "medium"
                ? "Đồ họa: TB"
                : "Đồ họa: Thấp"}
            </span>
          </button>
        </div>
      </header>

      {/* ── 2. THÔNG BÁO TÂM LINH & NÚT THỜI TIẾT REAL-TIME TRÊN MOBILE ── */}
      <div className="flex flex-col items-center gap-1.5 px-2 sm:px-4 mt-1.5">
        {/* Thanh chọn Thời tiết & Thời gian Real-time gọn nhẹ dành riêng cho Mobile (không làm tràn Navbar) */}
        <div className="pointer-events-auto md:hidden self-end mr-1 bg-[#24110A]/90 backdrop-blur-md border border-[#D9A441]/45 rounded-full px-2 py-0.5 flex items-center text-[11px] text-[#F7EBD5] shadow-md whitespace-nowrap">
          <ZenSelect
            value={currentEnvSelectValue}
            options={envOptions}
            onChange={handleEnvChange}
          />
        </div>
        {bellRinging && (
          <div className="pointer-events-auto max-w-[94vw] bg-[#26120B]/92 backdrop-blur-md border border-[#D9A441]/65 text-[#F6D58A] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs tracking-wide shadow-2xl flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-[#F6D58A] animate-ping shrink-0" />
            <span className="truncate whitespace-nowrap">
              Tiếng Đại Hồng Chung ngân vang · {bellRingerName || "Phật tử"} kính lễ
            </span>
          </div>
        )}

        {statusNotice && (
          <div className="pointer-events-auto max-w-[94vw] bg-[#26120B]/92 backdrop-blur-xl border border-[#D9A441]/60 text-[#F6D58A] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs md:text-sm tracking-wide font-medium shadow-2xl flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span className="truncate whitespace-nowrap">{statusNotice}</span>
            {hasNavigationTarget && (
              <span className="hidden sm:inline text-[10px] bg-[#D9A441]/25 text-[#F6D58A] px-2 py-0.5 rounded-full border border-[#D9A441]/40 whitespace-nowrap shrink-0">
                Nhấn WASD để dừng
              </span>
            )}
          </div>
        )}

        {interactionPrompt && (
          <div className="pointer-events-auto max-w-[94vw] bg-[#1B0D09]/90 backdrop-blur-md border border-[#D9A441]/60 text-[#F6D58A] px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs tracking-wide font-medium shadow-2xl whitespace-nowrap truncate">
            {interactionPrompt}
          </div>
        )}
      </div>

      {/* ── 3. THANH DOCK 4 NÚT PILL VIỀN VÀNG HOÀNG KIM GIỐNG 100% ẢNH IMPLEMENTATION PLAN ── */}
      <footer className="relative w-full px-2 sm:px-5 md:px-7 pb-3 sm:pb-6 flex flex-col items-center justify-end gap-2 sm:gap-2.5 z-20">
        {/* Nút Mở Sách Đọc Kinh hiển thị ngay khi nhân vật đang ngồi trên tấm thảm có kệ kinh trước mặt */}
        {localAction === "sit" && !sutraModalOpen && (
          <button
            type="button"
            onClick={handleReadSutraClick}
            className="pointer-events-auto flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border-2 border-[#FFE08A] text-[#FFFDF5] text-xs sm:text-sm font-bold tracking-wide shadow-[0_6px_24px_rgba(0,0,0,0.75),0_0_18px_rgba(246,213,138,0.45)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap animate-bounce"
            style={{
              background:
                "linear-gradient(180deg, rgba(186, 132, 44, 0.95) 0%, rgba(112, 72, 20, 0.98) 100%)",
              animationDuration: "2.4s",
            }}
          >
            <svg
              viewBox="0 0 20 20"
              className="w-4 h-4 text-[#FFE699] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                d="M2.5 5.2C2.5 4.5 3.1 4 3.8 4h4.2c1.1 0 2 .9 2 2v9.5c0-.8-.7-1.5-1.5-1.5H3.8c-.7 0-1.3-.5-1.3-1.2V5.2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 5.2c0-.7-.6-1.2-1.3-1.2H12c-1.1 0-2 .9-2 2v9.5c0-.8.7-1.5 1.5-1.5h4.7c.7 0 1.3-.5 1.3-1.2V5.2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sm:hidden whitespace-nowrap">Mở Sách Đọc Kinh</span>
            <span className="hidden sm:inline whitespace-nowrap">Mở Sách Đọc Kinh (Trên Kệ Trước Mặt)</span>
          </button>
        )}

        <div
          className="pointer-events-auto w-full sm:w-auto max-w-[680px] grid grid-cols-4 gap-1.5 sm:gap-3.5 px-2 sm:px-5 py-2 sm:py-3.5 rounded-[22px] sm:rounded-[26px] whitespace-nowrap"
          style={{
            background:
              "linear-gradient(180deg, rgba(64, 44, 28, 0.72) 0%, rgba(36, 22, 14, 0.82) 100%)",
            backdropFilter: "blur(18px)",
            border: "1.4px solid rgba(228, 184, 98, 0.55)",
            boxShadow:
              "0 18px 48px rgba(0, 0, 0, 0.82), inset 0 1px 0 rgba(255, 242, 204, 0.28)",
          }}
        >
          {dockButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={btn.onClick}
              disabled={btn.disabled}
              className="relative flex items-center justify-center px-2 sm:px-6 py-2.5 sm:py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60 whitespace-nowrap overflow-hidden"
              style={{
                background: btn.active
                  ? "linear-gradient(180deg, rgba(168, 122, 48, 0.75) 0%, rgba(92, 62, 24, 0.9) 100%)"
                  : "linear-gradient(180deg, rgba(78, 52, 32, 0.85) 0%, rgba(48, 30, 18, 0.92) 72%, rgba(138, 96, 34, 0.55) 100%)",
                border: "2px solid #E5B95C",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.55), inset 0 0 12px rgba(246, 213, 138, 0.25)",
              }}
            >
              {/* Đốm sáng vàng kim ở cạnh dưới mỗi nút pill giống hệt ảnh Implementation Plan */}
              <span
                style={{
                  position: "absolute",
                  bottom: "-3px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "52%",
                  height: "6px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle, rgba(255, 244, 198, 0.95) 0%, rgba(246, 213, 138, 0) 75%)",
                  pointerEvents: "none",
                }}
              />
              <span
                className="font-semibold tracking-tight sm:tracking-wide whitespace-nowrap leading-none"
                style={{
                  fontSize: "clamp(10.5px, 2.8vw, 15px)",
                  color: "#FFF8EC",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.65)",
                }}
              >
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* Cụm nút điều khiển Zoom & Toàn Cảnh 100 tấm thảm */}
        <div className="pointer-events-auto fixed sm:absolute right-2.5 sm:right-5 md:right-7 bottom-28 sm:bottom-5 md:bottom-6 flex flex-col items-center gap-1.5 sm:gap-2 z-20">
          <button
            onClick={zoomIn}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B0D09]/90 hover:bg-[#D9A441] text-[#F7EBD5] hover:text-[#1B0D09] border border-[#D9A441]/50 flex items-center justify-center font-semibold text-base sm:text-lg shadow-lg transition-all active:scale-95"
            title="Phóng to cận cảnh (+ hoặc cuộn chuột lên)"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B0D09]/90 hover:bg-[#D9A441] text-[#F7EBD5] hover:text-[#1B0D09] border border-[#D9A441]/50 flex items-center justify-center font-semibold text-base sm:text-lg shadow-lg transition-all active:scale-95"
            title="Thu nhỏ nhìn bao quát 100 tấm thảm (− hoặc cuộn chuột xuống)"
          >
            −
          </button>
          <button
            onClick={setOverviewCamera}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              isOverview
                ? "bg-[#D9A441] text-[#1B0D09] border-[#F6D58A]"
                : "bg-[#1B0D09]/90 hover:bg-[#D9A441] text-[#F7EBD5] hover:text-[#1B0D09] border-[#D9A441]/50"
            }`}
            title={
              isOverview
                ? "Quay về góc nhìn gần nhân vật"
                : "Xem bao quát toàn cảnh 100 tấm thảm Chánh Điện"
            }
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M3.5 7.5V3.5H7.5M12.5 3.5H16.5V7.5M16.5 12.5V16.5H12.5M7.5 16.5H3.5V12.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={resetCamera}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B0D09]/90 hover:bg-[#D9A441] text-[#F7EBD5] hover:text-[#1B0D09] border border-[#D9A441]/50 flex items-center justify-center shadow-lg transition-all active:scale-95"
            title="Đặt lại góc nhìn mặc định"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10" cy="10" r="5.5" />
              <circle cx="10" cy="10" r="1.8" fill="currentColor" />
              <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
