"use client";
import React, { useState, useEffect } from "react";
import {
  useTempleStore,
  ROBE_PALETTE,
  SUGGESTED_BUDDHIST_NAMES,
  PilgrimGender,
} from "@/stores/templeStore";

export function OnboardingModal() {
  const onboardingCompleted = useTempleStore((s) => s.onboardingCompleted);
  const localPlayer = useTempleStore((s) => s.localPlayer);
  const setLocalPlayer = useTempleStore((s) => s.setLocalPlayer);
  const setOnboardingCompleted = useTempleStore((s) => s.setOnboardingCompleted);
  const setAudioPlaying = useTempleStore((s) => s.setAudioPlaying);
  const setBellRinging = useTempleStore((s) => s.setBellRinging);
  const currentServerId = useTempleStore((s) => s.currentServerId);
  const serversList = useTempleStore((s) => s.serversList);
  const setCurrentServerId = useTempleStore((s) => s.setCurrentServerId);

  const [name, setName] = useState(localPlayer.vietnameseName || "");
  const [gender, setGender] = useState<PilgrimGender>(localPlayer.gender || "male");
  const [selectedRobeIdx, setSelectedRobeIdx] = useState(0);
  const [selectedServer, setSelectedServer] = useState(currentServerId || "server-1");
  const [serverWarning, setServerWarning] = useState<string | null>(null);

  useEffect(() => {
    setName(localPlayer.vietnameseName || "");
    setGender(localPlayer.gender || "male");
    setSelectedServer(currentServerId || "server-1");
    const foundIdx = ROBE_PALETTE.findIndex(
      (r) => r.color.toLowerCase() === localPlayer.avatarColor.toLowerCase()
    );
    if (foundIdx >= 0) setSelectedRobeIdx(foundIdx);
  }, [localPlayer, onboardingCompleted, currentServerId]);

  if (onboardingCompleted) return null;

  const selectedRobe = ROBE_PALETTE[selectedRobeIdx] || ROBE_PALETTE[0];

  const handleEnterTemple = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || "Thiện Tâm";

    const targetServer = serversList.find((s) => s.id === selectedServer);
    if (targetServer && targetServer.onlineCount >= targetServer.capacity) {
      setServerWarning(
        `⚠️ ${targetServer.name} đã đủ tối đa 100 Phật tử. Không thể tiếp nhận thêm người thứ 101!`
      );
      return;
    }

    setCurrentServerId(selectedServer);

    setLocalPlayer({
      username: `${selectedRobe.label} · ${trimmedName}`,
      vietnameseName: trimmedName,
      avatarColor: selectedRobe.color,
      gender,
    });
    setOnboardingCompleted(true);
    setAudioPlaying(true);

    // Ngân tiếng Đại Hồng Chung chào đón Phật tử bước vào Chánh Điện
    setBellRinging(true, trimmedName);
    setTimeout(() => {
      useTempleStore.getState().setBellRinging(false);
    }, 3200);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        background:
          "radial-gradient(circle at 50% 40%, rgba(32, 18, 10, 0.72) 0%, rgba(12, 6, 3, 0.92) 100%)",
        backdropFilter: "blur(14px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div className="w-full max-w-[920px] grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Cột Trái (Desktop): Hình mẫu 2 Nhân Vật Mascot 3D Nam & Nữ Phật Tử */}
        <div className="hidden md:flex md:col-span-6 flex-col items-center justify-center relative">
          <div
            className="relative w-full aspect-[1.12/1] rounded-[24px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
            style={{
              border: "1.5px solid rgba(235, 192, 104, 0.6)",
            }}
          >
            <img
              src="/textures/mascot_onboarding_preview.jpg"
              alt="Nam & Nữ Phật Tử Mascot 3D"
              className="w-[200%] max-w-none h-full object-cover object-left"
              style={{
                transform: "scale(1.02)",
              }}
            />
            {/* Lớp bóng tối nhẹ phía dưới */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.2) 65%, rgba(20,10,5,0.85) 100%)",
              }}
            />
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-around gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setGender("male");
                  setSelectedRobeIdx(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  gender === "male"
                    ? "bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] shadow-[0_0_18px_rgba(246,213,138,0.65)] scale-105"
                    : "bg-black/60 text-[#F7EBD5]/85 border border-[#D9A441]/45 hover:border-[#F6D58A]"
                }`}
              >
                Nam Phật Tử · Áo Lam
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender("female");
                  setSelectedRobeIdx(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  gender === "female"
                    ? "bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] shadow-[0_0_18px_rgba(246,213,138,0.65)] scale-105"
                    : "bg-black/60 text-[#F7EBD5]/85 border border-[#D9A441]/45 hover:border-[#F6D58A]"
                }`}
              >
                Nữ Phật Tử · Nâu Sồng
              </button>
            </div>
          </div>
        </div>

        {/* Cột Phải: Bảng Glassmorphism "Bước Vào Chánh Điện" (Vừa vặn 1 màn hình không bị che/cuộn) */}
        <div className="md:col-span-6 flex justify-center w-full">
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "420px",
              background:
                "linear-gradient(180deg, rgba(68, 54, 42, 0.94) 0%, rgba(32, 22, 16, 0.98) 100%)",
              backdropFilter: "blur(22px)",
              border: "1.8px solid rgba(235, 195, 112, 0.8)",
              borderRadius: "22px",
              padding: "20px 22px 18px",
              boxShadow:
                "0 24px 60px rgba(0, 0, 0, 0.88), 0 0 35px rgba(217, 164, 65, 0.22), inset 0 1px 0 rgba(255, 240, 200, 0.35)",
              color: "#F7EBD5",
              boxSizing: "border-box",
            }}
          >
            {/* Khung viền hoa văn mạ vàng 4 góc cố định không trượt */}
            <div
              style={{
                position: "absolute",
                inset: "6px",
                border: "1px solid rgba(246, 213, 138, 0.3)",
                borderRadius: "17px",
                pointerEvents: "none",
              }}
            />
            {/* Hoa văn góc trên trái */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              style={{ position: "absolute", top: 6, left: 6, pointerEvents: "none" }}
            >
              <path d="M2 20V9C2 5.134 5.134 2 9 2H20" stroke="#F6D58A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 15C6 10.029 10.029 6 15 6" stroke="#F6D58A" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            </svg>
            {/* Hoa văn góc trên phải */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              style={{ position: "absolute", top: 6, right: 6, transform: "scaleX(-1)", pointerEvents: "none" }}
            >
              <path d="M2 20V9C2 5.134 5.134 2 9 2H20" stroke="#F6D58A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 15C6 10.029 10.029 6 15 6" stroke="#F6D58A" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            </svg>
            {/* Hoa văn góc dưới trái */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              style={{ position: "absolute", bottom: 6, left: 6, transform: "scaleY(-1)", pointerEvents: "none" }}
            >
              <path d="M2 20V9C2 5.134 5.134 2 9 2H20" stroke="#F6D58A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 15C6 10.029 10.029 6 15 6" stroke="#F6D58A" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            </svg>
            {/* Hoa văn góc dưới phải */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              style={{ position: "absolute", bottom: 6, right: 6, transform: "scale(-1, -1)", pointerEvents: "none" }}
            >
              <path d="M2 20V9C2 5.134 5.134 2 9 2H20" stroke="#F6D58A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 15C6 10.029 10.029 6 15 6" stroke="#F6D58A" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            </svg>

            <form onSubmit={handleEnterTemple} className="space-y-3 relative z-10">
              {/* Tiêu đề chính kèm Biểu tượng Hoa Sen Vàng */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3D2614] border border-[#F6D58A] mb-1 shadow-md">
                  <span className="text-base">🪷</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#F8DFA1] tracking-wide whitespace-nowrap">
                  Bước Vào Chánh Điện
                </h2>
              </div>

              {/* Ô nhập Tên / Pháp Danh & 5 Gợi Ý Nhanh */}
              <div>
                <input
                  type="text"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập Pháp danh / Tên của bạn"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#261F1A]/90 border border-[#D9AF60]/60 text-[#FFF8EC] text-sm text-center outline-none focus:border-[#F6D58A] shadow-inner font-medium placeholder:text-[#F7EBD5]/45"
                />
                <div className="flex justify-center gap-1.5 mt-1.5 overflow-x-auto py-0.5 whitespace-nowrap scrollbar-none">
                  {SUGGESTED_BUDDHIST_NAMES.slice(0, 5).map((sug) => {
                    const active = name === sug.name;
                    return (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => {
                          setName(sug.name);
                          setGender(sug.gender);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all whitespace-nowrap ${
                          active
                            ? "bg-[#D9A441]/40 border border-[#F6D58A] text-[#FFF4D2] font-bold shadow-sm"
                            : "bg-white/5 border border-[#D9A441]/25 text-[#F7EBD5]/75 hover:bg-white/10"
                        }`}
                      >
                        {sug.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn Giới Tính (Nam / Nữ) & Màu Áo Tràng */}
              <div className="grid grid-cols-2 gap-2">
                {/* Cột 1: Giới tính */}
                <div className="space-y-1">
                  <div className="text-[10.5px] font-semibold text-[#F6D58A]/90 text-center">
                    Giới tính
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "male" as PilgrimGender, label: "Nam", icon: "👨" },
                      { id: "female" as PilgrimGender, label: "Nữ", icon: "👩" },
                    ].map((g) => {
                      const isSel = gender === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGender(g.id)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            isSel
                              ? "bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] shadow-md border border-[#FFF4D2]"
                              : "bg-[#251B14]/80 border border-[#D9A441]/35 text-[#F7EBD5]/80 hover:bg-white/5"
                          }`}
                        >
                          <span>{g.icon}</span>
                          <span>{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cột 2: Màu áo tràng */}
                <div className="space-y-1">
                  <div className="text-[10.5px] font-semibold text-[#F6D58A]/90 text-center">
                    Màu Áo Tràng
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {ROBE_PALETTE.map((robe, idx) => {
                      const isSel = selectedRobeIdx === idx;
                      return (
                        <button
                          key={robe.id}
                          type="button"
                          onClick={() => setSelectedRobeIdx(idx)}
                          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                            isSel
                              ? "bg-[#D9A441]/25 border border-[#F6D58A] shadow-sm"
                              : "bg-[#251B14]/60 border border-[#D9A441]/25 hover:border-[#D9A441]/50"
                          }`}
                          title={robe.label}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/70 shadow-sm"
                            style={{ background: robe.color }}
                          />
                          <span className="text-[9px] mt-0.5 text-[#F7EBD5]/90 whitespace-nowrap truncate max-w-[42px]">
                            {robe.label.split(" ")[1] || robe.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── CHỌN CHÁNH ĐIỆN (SERVER DỮ LIỆU THẬT · 100 NGƯỜI / CHÁNH ĐIỆN) ── */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px] px-1 whitespace-nowrap">
                  <span className="font-bold text-[#F6D58A] flex items-center gap-1">
                    <span>🏛️</span>
                    <span>CHỌN CHÁNH ĐIỆN</span>
                  </span>
                  <span className="text-[9.5px] text-[#F7EBD5]/65">
                    Tối đa 100 người / server
                  </span>
                </div>

                <div className="space-y-1.5">
                  {serversList.map((srv) => {
                    const isSelected = selectedServer === srv.id;
                    const isFull = srv.onlineCount >= srv.capacity;

                    return (
                      <button
                        key={srv.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          if (isFull) {
                            setServerWarning(
                              `⚠️ ${srv.name} đã đủ 100 người. Không thể tiếp nhận thêm người thứ 101!`
                            );
                            return;
                          }
                          setSelectedServer(srv.id);
                          setServerWarning(null);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left whitespace-nowrap ${
                          isFull
                            ? "bg-red-950/40 border border-red-500/50 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#D9A441]/22 border border-[#F6D58A] shadow-sm"
                            : "bg-[#231710]/70 border border-[#D9A441]/25 hover:border-[#F6D58A]/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isFull
                                ? "bg-red-500 shadow-[0_0_6px_#ef4444]"
                                : "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#FFF8EC] truncate max-w-[170px] sm:max-w-[210px] whitespace-nowrap">
                              {srv.name}
                            </div>
                            <div className="text-[9.5px] text-[#F7EBD5]/65 truncate max-w-[170px] sm:max-w-[210px] whitespace-nowrap">
                              {isFull ? "⚠️ Đã đủ 100 người" : srv.desc}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                              isFull
                                ? "bg-red-900/60 border-red-500 text-red-200"
                                : isSelected
                                ? "bg-[#D9A441]/40 border-[#F6D58A] text-[#FFF4D2]"
                                : "bg-black/30 border-[#D9A441]/30 text-[#F6D58A]"
                            }`}
                          >
                            {srv.onlineCount}/100
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {serverWarning && (
                  <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/70 text-red-200 text-[10.5px] text-center font-medium animate-pulse">
                    {serverWarning}
                  </div>
                )}
              </div>

              {/* Nút Pill Vàng Kim "Bước Vào Chánh Điện" (Luôn hiển thị đầy đủ trên màn hình) */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#F9E4A8] via-[#DFAD4B] to-[#B88022] border-2 border-[#FFF5D2] text-[#221109] font-bold text-sm sm:text-base shadow-[0_8px_24px_rgba(246,213,138,0.5)] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                >
                  Bước Vào Chánh Điện
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}