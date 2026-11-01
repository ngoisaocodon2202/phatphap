"use client";
import React, { useState, useEffect } from "react";
import { useTempleStore, DiligencePilgrim } from "@/stores/templeStore";

// ── BỘ TỔNG HỢP ÂM THANH TIẾNG CHUÔNG KHÁNH TÙY HỶ CÔNG ĐỨC (WEB AUDIO API) ──
class RejoiceAudioEngine {
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

  // Âm thanh chuông khánh thanh lương khi bấm "Tùy Hỷ" hoặc "Niệm Lành"
  playRejoiceChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;

      // Hợp âm thanh khiết cao độ 1568Hz & 2093Hz (G6, C7)
      const freqs = [1567.98, 2093.0];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);

        const dur = 1.6 - i * 0.3;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {}
  }
}

const rejoiceSound = new RejoiceAudioEngine();

export function LeaderboardModal() {
  const leaderboardModalOpen    = useTempleStore((s) => s.leaderboardModalOpen);
  const setLeaderboardModalOpen = useTempleStore((s) => s.setLeaderboardModalOpen);
  const activeTab               = useTempleStore((s) => s.activeLeaderboardTab);
  const setActiveTab            = useTempleStore((s) => s.setActiveLeaderboardTab);

  const localPlayer         = useTempleStore((s) => s.localPlayer);
  const currentServerId     = useTempleStore((s) => s.currentServerId);
  const serversList         = useTempleStore((s) => s.serversList);
  const currentServer       = serversList.find((s) => s.id === currentServerId) || serversList[0];

  const spiritualStats      = useTempleStore((s) => s.spiritualStats);
  const malaCount           = useTempleStore((s) => s.malaCount);
  const bowCount            = useTempleStore((s) => s.bowCount);
  const leaderboardPilgrims = useTempleStore((s) => s.leaderboardPilgrims);
  const rejoicePilgrim      = useTempleStore((s) => s.rejoicePilgrim);
  const wishesList          = useTempleStore((s) => s.wishesList);
  const addCommunityWish    = useTempleStore((s) => s.addCommunityWish);
  const rejoiceWish         = useTempleStore((s) => s.rejoiceWish);
  const tickMeditationSecond = useTempleStore((s) => s.tickMeditationSecond);

  const [inputWish, setInputWish] = useState("");
  const [rejoicedMap, setRejoicedMap] = useState<Record<string, boolean>>({});
  const [floatingPetals, setFloatingPetals] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Bộ đếm thời gian tĩnh tâm thời gian thực trong Chánh Điện
  useEffect(() => {
    const timer = setInterval(() => {
      tickMeditationSecond();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickMeditationSecond]);

  if (!leaderboardModalOpen) return null;

  // Tính điểm Tinh Tấn của chính người dùng
  const myMeditationMinutes = Math.floor(spiritualStats.meditationSeconds / 60);
  const myPoints =
    myMeditationMinutes * 1 +
    malaCount * 1 +
    (malaCount >= 108 ? 50 : 0) +
    bowCount * 5 +
    (spiritualStats.lanternsOffered + spiritualStats.incenseOffered) * 10 +
    spiritualStats.rejoiceCount * 2;

  // Cấp độ Tinh Tấn
  const getRankTitle = (pts: number) => {
    if (pts >= 4000) return { title: "Viên Mãn Thanh Tịnh", level: 5, icon: "☀️", color: "#FDE047" };
    if (pts >= 1500) return { title: "Bồ Đề Tâm Nguyện", level: 4, icon: "🌟", color: "#F6D58A" };
    if (pts >= 500) return { title: "Chánh Niệm Tinh Tấn", level: 3, icon: "🕯️", color: "#60A5FA" };
    if (pts >= 100) return { title: "Tịnh Tâm An Lạc", level: 2, icon: "🪷", color: "#34D399" };
    return { title: "Sơ Tâm Tu Học", level: 1, icon: "🌱", color: "#A7F3D0" };
  };

  const myRankInfo = getRankTitle(myPoints);

  // Danh sách Phật tử hoàn chỉnh bao gồm chính bản thân
  const selfPilgrim: DiligencePilgrim = {
    id: "self",
    name: localPlayer.vietnameseName || "Thiện Tâm",
    gender: localPlayer.gender || "male",
    avatarColor: localPlayer.avatarColor,
    serverName: currentServer.shortName || "C.Đ 01",
    title: myRankInfo.title,
    points: myPoints,
    meditationMinutes: myMeditationMinutes,
    beadsChanted: malaCount,
    bowsCount: bowCount,
    rejoicesCount: spiritualStats.rejoiceCount,
    isSelf: true,
  };

  const combinedList = [...leaderboardPilgrims, selfPilgrim].sort(
    (a, b) => b.points - a.points
  );
  const myStanding = combinedList.findIndex((p) => p.id === "self") + 1;

  // Xử lý bấm Tùy Hỷ
  const handleRejoice = (e: React.MouseEvent, pilgrimId: string) => {
    e.stopPropagation();
    rejoiceSound.playRejoiceChime();
    rejoicePilgrim(pilgrimId);
    setRejoicedMap((prev) => ({ ...prev, [pilgrimId]: true }));

    // Hiệu ứng cánh hoa sen bay lên
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newPetal = {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
    setFloatingPetals((prev) => [...prev, newPetal]);
    setTimeout(() => {
      setFloatingPetals((prev) => prev.filter((p) => p.id !== newPetal.id));
    }, 1200);

    // Haptic vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  // Gửi Lời Nguyện Cầu An
  const handleSubmitWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWish.trim()) return;
    addCommunityWish(inputWish);
    setInputWish("");
    rejoiceSound.playRejoiceChime();
  };

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
        background: "rgba(10, 5, 2, 0.84)",
        backdropFilter: "blur(18px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={() => setLeaderboardModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, rgba(64, 48, 36, 0.96) 0%, rgba(30, 20, 14, 0.98) 100%)",
          backdropFilter: "blur(24px)",
          border: "1.8px solid rgba(235, 195, 112, 0.8)",
          borderRadius: "24px",
          boxShadow:
            "0 28px 75px rgba(0, 0, 0, 0.88), 0 0 40px rgba(217, 164, 65, 0.28)",
          color: "#F7EBD5",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => setLeaderboardModalOpen(false)}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-[#D9A441]/45 text-[#F6D58A] flex items-center justify-center text-sm transition-all z-20"
        >
          ✕
        </button>

        {/* ── HEADER MODAL ── */}
        <div className="px-5 pt-5 pb-3 text-center shrink-0">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2614] border border-[#F6D58A] mb-1.5 shadow-md">
            <span className="text-xl">🏆</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F8DFA1] tracking-wide whitespace-nowrap">
            ĐẠO TRÀNG TINH TẤN
          </h2>
          <p className="text-[11px] text-[#F7EBD5]/75 mt-0.5 whitespace-nowrap truncate">
            Noi gương tu học · Tùy hỷ công đức · Hồi hướng an lành
          </p>
        </div>

        {/* ── THANH 3 TABS (RESPONSIVE 1 HÀNG KHÔNG XUỐNG DÒNG) ── */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#23140B]/90 p-1 rounded-full border border-[#D9A441]/35 whitespace-nowrap">
            {[
              { id: "rankings" as const, label: "Bảng Tinh Tấn", icon: "🏆" },
              { id: "diary" as const, label: "Tu Tập Ký", icon: "📖" },
              { id: "wishes" as const, label: "Tường Cầu An", icon: "🕊️" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] shadow-md scale-[1.02]"
                      : "text-[#F7EBD5]/75 hover:text-[#FFF8EC] hover:bg-white/5"
                  }`}
                >
                  <span className="text-[13px]">{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── NỘI DUNG CHÍNH (CUỘN MƯỢT MÀ) ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin">
          {/* ═════════ TAB 1: BẢNG VÀNG TINH TẤN ═════════ */}
          {activeTab === "rankings" && (
            <div className="space-y-2.5">
              {/* Thẻ Thứ Hạng Cá Nhân Hiện Tại */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#8C5815]/35 via-[#D9A441]/25 to-[#8C5815]/35 border border-[#F6D58A]/60 shadow-md whitespace-nowrap">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-full bg-[#D9A441] text-[#1B0D09] font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    #{myStanding}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-[#FFF9E6] truncate max-w-[90px] sm:max-w-[140px]">
                        {localPlayer.vietnameseName || "Thiện Tâm"}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-black/40 text-[#F6D58A] border border-[#D9A441]/40 shrink-0">
                        {myRankInfo.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#F7EBD5]/75 whitespace-nowrap">
                      {myMeditationMinutes}p thiền · {malaCount} hạt · {bowCount} lạy
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-[#FDE047] whitespace-nowrap">
                    {myPoints} điểm
                  </div>
                  <div className="text-[9.5px] text-[#34D399] font-medium whitespace-nowrap">
                    {spiritualStats.rejoiceCount} tùy hỷ 🙏
                  </div>
                </div>
              </div>

              {/* Danh Sách Các Phật Tử Tinh Tấn */}
              <div className="space-y-1.5">
                {combinedList.map((pilgrim, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;
                  const hasRejoiced = rejoicedMap[pilgrim.id];

                  return (
                    <div
                      key={pilgrim.id}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-all whitespace-nowrap ${
                        pilgrim.isSelf
                          ? "bg-[#D9A441]/18 border border-[#F6D58A]/80 shadow-md"
                          : "bg-[#251710]/75 border border-[#D9A441]/25 hover:border-[#F6D58A]/50"
                      }`}
                    >
                      {/* Vị trí thứ hạng & Avatar & Pháp danh */}
                      <div className="flex items-center gap-2 min-w-0 pr-1.5">
                        {/* Huy hiệu thứ hạng */}
                        <span className="w-5 sm:w-6 text-center font-bold text-xs sm:text-sm shrink-0">
                          {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${rank}`}
                        </span>

                        {/* Màu áo Mascot */}
                        <span
                          className="w-3 h-3 rounded-full border border-white/60 shrink-0"
                          style={{ background: pilgrim.avatarColor }}
                        />

                        {/* Pháp Danh & Danh hiệu */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span
                              className={`text-xs sm:text-[13px] font-bold truncate max-w-[75px] sm:max-w-[125px] ${
                                pilgrim.isSelf ? "text-[#FFF8E7]" : "text-[#F7EBD5]"
                              }`}
                            >
                              {pilgrim.name}
                            </span>
                            {pilgrim.isSelf && (
                              <span className="text-[8.5px] px-1 bg-[#D9A441] text-[#1B0D09] font-bold rounded shrink-0">
                                BẠN
                              </span>
                            )}
                            <span className="text-[9px] text-[#F6D58A]/80 bg-black/30 px-1 rounded border border-[#D9A441]/20 hidden xs:inline shrink-0">
                              {pilgrim.title}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-[#F7EBD5]/65 whitespace-nowrap">
                            {pilgrim.meditationMinutes}p · {pilgrim.beadsChanted} hạt
                          </div>
                        </div>
                      </div>

                      {/* Điểm & Nút Tùy Hỷ */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs sm:text-[13px] font-bold text-[#F6D58A] whitespace-nowrap">
                            {pilgrim.points}đ
                          </span>
                        </div>

                        {/* Nút Tùy Hỷ Công Đức */}
                        <button
                          type="button"
                          disabled={pilgrim.isSelf}
                          onClick={(e) => handleRejoice(e, pilgrim.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10.5px] font-bold transition-all active:scale-90 shrink-0 whitespace-nowrap ${
                            pilgrim.isSelf
                              ? "opacity-40 cursor-default bg-black/20 text-[#F7EBD5]/50 border border-white/10"
                              : hasRejoiced
                              ? "bg-emerald-950/70 border border-emerald-400 text-emerald-300"
                              : "bg-[#3D2516] hover:bg-[#D9A441]/30 border border-[#D9A441]/60 text-[#F6D58A] hover:scale-105 shadow-sm"
                          }`}
                          title="Tán thán và tùy hỷ công đức lành"
                        >
                          <span>{hasRejoiced ? "🪷" : "🙏"}</span>
                          <span>{pilgrim.rejoicesCount}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: TU TẬP KÝ (NHẬT KÝ BẢN THÂN) ═════════ */}
          {activeTab === "diary" && (
            <div className="space-y-3">
              {/* Thẻ Cấp Độ & Danh Hiệu */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#3D2616] via-[#2A180E] to-[#3D2616] border border-[#F6D58A]/50 shadow-lg text-center whitespace-nowrap">
                <div className="text-2xl mb-1">{myRankInfo.icon}</div>
                <div className="text-xs text-[#F7EBD5]/75">Cấp độ tu học hiện tại:</div>
                <div
                  className="text-base sm:text-lg font-bold tracking-wide mt-0.5"
                  style={{ color: myRankInfo.color }}
                >
                  {myRankInfo.title}
                </div>
                <div className="mt-2 w-full bg-black/50 rounded-full h-2 overflow-hidden border border-[#D9A441]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#F6D58A] to-[#D9A441] transition-all duration-500"
                    style={{ width: `${Math.min(100, (myPoints / 1500) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#F7EBD5]/70 mt-1">
                  <span>{myPoints} điểm</span>
                  <span>Mục tiêu tiếp theo: 1500đ</span>
                </div>
              </div>

              {/* Lưới 4 Thẻ Thống Kê Chi Tiết */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#23150D]/85 border border-[#D9A441]/35 text-center whitespace-nowrap">
                  <span className="text-lg">⏱️</span>
                  <div className="text-sm sm:text-base font-bold text-[#FFF8EC] mt-0.5">
                    {myMeditationMinutes} phút
                  </div>
                  <div className="text-[10px] text-[#F7EBD5]/70">Tĩnh tâm trong chùa</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#23150D]/85 border border-[#D9A441]/35 text-center whitespace-nowrap">
                  <span className="text-lg">📿</span>
                  <div className="text-sm sm:text-base font-bold text-[#FFF8EC] mt-0.5">
                    {malaCount} hạt
                  </div>
                  <div className="text-[10px] text-[#F7EBD5]/70">Lần tràng hạt 108</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#23150D]/85 border border-[#D9A441]/35 text-center whitespace-nowrap">
                  <span className="text-lg">🙏</span>
                  <div className="text-sm sm:text-base font-bold text-[#FFF8EC] mt-0.5">
                    {bowCount} lạy
                  </div>
                  <div className="text-[10px] text-[#F7EBD5]/70">Đảnh lễ Tam Bảo</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#23150D]/85 border border-[#D9A441]/35 text-center whitespace-nowrap">
                  <span className="text-lg">🏮</span>
                  <div className="text-sm sm:text-base font-bold text-[#FFF8EC] mt-0.5">
                    {spiritualStats.lanternsOffered + spiritualStats.incenseOffered} lần
                  </div>
                  <div className="text-[10px] text-[#F7EBD5]/70">Thắp hương & Hoa đăng</div>
                </div>
              </div>

              {/* Lời Khuyên Tu Học */}
              <div className="p-3 rounded-xl bg-black/40 border border-[#D9A441]/25 text-[11px] text-[#F7EBD5]/85 leading-relaxed text-center">
                ✨ <i>"Mỗi phút giây an trú trong hiện tại là một đóa hoa sen nở trong tâm."</i>
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: TƯỜNG CẦU AN & HỒI HƯỚNG ═════════ */}
          {activeTab === "wishes" && (
            <div className="space-y-3">
              {/* Form Gửi Lời Nguyện Cầu An */}
              <form onSubmit={handleSubmitWish} className="flex gap-2 whitespace-nowrap">
                <input
                  type="text"
                  maxLength={120}
                  value={inputWish}
                  onChange={(e) => setInputWish(e.target.value)}
                  placeholder="Gửi lời nguyện cầu an cho cha mẹ, gia đình..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#24130B]/90 border border-[#D9A441]/50 text-xs text-[#FFF8EC] outline-none placeholder:text-[#F7EBD5]/45 focus:border-[#F6D58A] shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputWish.trim()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] font-bold text-xs disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 whitespace-nowrap"
                >
                  Gửi 🪷
                </button>
              </form>

              {/* Danh Sách Lời Nguyện Của Đại Chúng */}
              <div className="space-y-2">
                {wishesList.map((wish) => (
                  <div
                    key={wish.id}
                    className="p-3 rounded-xl bg-[#24150D]/80 border border-[#D9A441]/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] whitespace-nowrap">
                      <span className="font-bold text-[#F6D58A] truncate max-w-[120px]">
                        🙏 {wish.author}
                      </span>
                      <span className="text-[9.5px] text-[#F7EBD5]/60 shrink-0">
                        {wish.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-[#FFF8EC] leading-relaxed">
                      "{wish.content}"
                    </p>

                    <div className="flex justify-end pt-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          rejoiceSound.playRejoiceChime();
                          rejoiceWish(wish.id);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#3A2213] hover:bg-[#D9A441]/25 border border-[#D9A441]/50 text-[#F6D58A] active:scale-95 transition-all whitespace-nowrap"
                      >
                        <span>{wish.hasRejoiced ? "🪷 Đã Niệm Lành" : "🙏 Niệm Lành"}</span>
                        <span>({wish.rejoiceCount})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── HIỆU ỨNG CÁNH HOA SEN VÀNG BAY LÊN (TÙY HỶ) ── */}
        {floatingPetals.map((petal) => (
          <div
            key={petal.id}
            style={{
              position: "fixed",
              left: `${petal.x}px`,
              top: `${petal.y}px`,
              pointerEvents: "none",
              zIndex: 99,
              transform: "translate(-50%, -50%)",
              animation: "floatUpLotus 1.2s ease-out forwards",
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#FDE047] drop-shadow-[0_2px_8px_rgba(253,224,71,0.8)]"
          >
            <span>🪷</span>
            <span>+1 Tùy Hỷ</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes floatUpLotus {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(0.85);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -65px) scale(1.25);
          }
        }
      `}</style>
    </div>
  );
}
