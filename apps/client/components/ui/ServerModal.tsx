"use client";
import React, { useState, useEffect } from "react";
import { useTempleStore } from "@/stores/templeStore";
import { getColyseusEndpoint } from "@/hooks/useMultiplayer";

export function ServerModal() {
  const serverModalOpen    = useTempleStore((s) => s.serverModalOpen);
  const setServerModalOpen = useTempleStore((s) => s.setServerModalOpen);
  const currentServerId    = useTempleStore((s) => s.currentServerId);
  const serversList        = useTempleStore((s) => s.serversList);
  const setCurrentServerId = useTempleStore((s) => s.setCurrentServerId);
  const setStatusNotice    = useTempleStore((s) => s.setStatusNotice);
  const connected          = useTempleStore((s) => s.connected);

  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [serverEndpointInput, setServerEndpointInput] = useState("");
  const [activeEndpoint, setActiveEndpoint] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ep = getColyseusEndpoint();
      setActiveEndpoint(ep);
      setServerEndpointInput(ep);
    }
  }, [serverModalOpen]);

  if (!serverModalOpen) return null;

  const handleSelectServer = (serverId: string) => {
    const target = serversList.find((s) => s.id === serverId);
    if (!target) return;

    if (target.onlineCount >= target.capacity) {
      setErrorNotice(
        `⚠️ ${target.name} đã đủ tối đa 100 Phật tử. Không thể tiếp nhận thêm người thứ 101!`
      );
      setTimeout(() => setErrorNotice(null), 4000);
      return;
    }

    const success = setCurrentServerId(serverId);
    if (success) {
      setErrorNotice(null);
      setServerModalOpen(false);
      setStatusNotice(`Đã chuyển sang ${target.name} (${target.onlineCount + 1}/100)`);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  const handleSaveCustomServer = (url: string) => {
    if (!url.trim()) return;
    try {
      localStorage.setItem("sansa_colyseus_url", url.trim());
      setActiveEndpoint(url.trim());
      setStatusNotice(`Đã lưu máy chủ: ${url.trim()}. Đang kết nối lại...`);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {}
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
        padding: "16px",
        background: "rgba(12, 6, 3, 0.82)",
        backdropFilter: "blur(14px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={() => setServerModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          background:
            "linear-gradient(180deg, rgba(68, 52, 40, 0.95) 0%, rgba(32, 22, 16, 0.98) 100%)",
          backdropFilter: "blur(22px)",
          border: "1.8px solid rgba(235, 195, 112, 0.8)",
          borderRadius: "24px",
          padding: "22px 20px 20px",
          boxShadow:
            "0 28px 70px rgba(0, 0, 0, 0.88), 0 0 38px rgba(217, 164, 65, 0.28)",
          color: "#F7EBD5",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => setServerModalOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 border border-[#D9A441]/45 text-[#F6D58A] flex items-center justify-center text-sm transition-all z-10"
        >
          ✕
        </button>

        {/* Tiêu đề */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#3D2614] border border-[#F6D58A] mb-1 shadow-md">
            <span className="text-base">🏛️</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F8DFA1] tracking-wide whitespace-nowrap">
            CHỌN CHÁNH ĐIỆN (SERVER)
          </h2>
          <p className="text-[11px] text-[#F7EBD5]/75 mt-0.5 leading-relaxed">
            Mỗi Chánh Điện giới hạn đúng <span className="text-[#F6D58A] font-bold">100 bồ đoàn</span>. Khi đủ 100 người sẽ tự động khóa người thứ 101.
          </p>
        </div>

        {errorNotice && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-red-950/80 border border-red-500/70 text-red-200 text-xs text-center animate-pulse">
            {errorNotice}
          </div>
        )}

        {/* ── TRẠNG THÁI KẾT NỐI MÁY CHỦ MULTIPLAYER (GIẢI QUYẾT VẤN ĐỀ THẤY NHAU) ── */}
        <div className="mb-3 p-2.5 rounded-xl bg-black/40 border border-[#D9A441]/30 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  connected
                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
                    : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                }`}
              />
              <span className="font-semibold truncate">
                {connected
                  ? "Máy chủ Multiplayer: ĐÃ KẾT NỐI"
                  : "Chế độ Đơn tu (Chưa kết nối Colyseus)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowNetworkSettings(!showNetworkSettings)}
              className="text-[10px] text-[#F6D58A] underline hover:text-[#FFF4D2] shrink-0 ml-1.5"
            >
              {showNetworkSettings ? "Thu gọn" : "Cấu hình IP"}
            </button>
          </div>

          {/* Bảng hướng dẫn cấu hình kết nối mạng LAN / Cloud WSS */}
          {showNetworkSettings && (
            <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
              <div className="text-[10.5px] text-[#F7EBD5]/80 leading-relaxed">
                💡 <b className="text-[#F6D58A]">Để Mobile & Desktop thấy nhau:</b>
                <ul className="list-disc list-inside mt-1 space-y-1 text-[10px] text-[#F7EBD5]/70">
                  <li>
                    <b>Cách 1 (Test qua Wi-Fi nội bộ):</b> Mở link <code className="bg-black/50 px-1 py-0.2 rounded text-emerald-300">http://192.168.1.18:3000/temple</code> trên cả máy tính và điện thoại.
                  </li>
                  <li>
                    <b>Cách 2 (Trên Vercel):</b> Do Vercel là HTTPS nên cần máy chủ <code className="text-[#F6D58A]">wss://</code> (bảo mật). Bạn có thể deploy server lên Render/Railway hoặc nhập URL bên dưới.
                  </li>
                </ul>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={serverEndpointInput}
                  onChange={(e) => setServerEndpointInput(e.target.value)}
                  placeholder="ws://192.168.1.18:2567 hoặc wss://..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1B0D09] border border-[#D9A441]/45 text-xs text-[#FFF8EC] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveCustomServer(serverEndpointInput)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#D9A441] text-[#1B0D09] font-bold text-xs hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  Lưu & Nối
                </button>
              </div>

              <div className="flex gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleSaveCustomServer("ws://192.168.1.18:2567")}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/15 text-[9.5px] text-[#F6D58A] hover:bg-white/10"
                >
                  ⚡ Nối LAN Wi-Fi (192.168.1.18:2567)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCustomServer("ws://localhost:2567")}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/15 text-[9.5px] text-[#F7EBD5]/70 hover:bg-white/10"
                >
                  Mặc định localhost
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách 3 Chánh Điện */}
        <div className="flex flex-col gap-2 mb-3">
          {serversList.map((srv) => {
            const isCurrent = currentServerId === srv.id;
            const isFull = srv.onlineCount >= srv.capacity;

            return (
              <div
                key={srv.id}
                className="flex items-center justify-between p-2.5 rounded-xl transition-all"
                style={{
                  background: isFull
                    ? "rgba(45, 15, 10, 0.6)"
                    : isCurrent
                    ? "linear-gradient(90deg, rgba(225, 185, 102, 0.25) 0%, rgba(132, 98, 45, 0.2) 100%)"
                    : "rgba(35, 27, 22, 0.65)",
                  border: isFull
                    ? "1.4px solid rgba(239, 68, 68, 0.65)"
                    : isCurrent
                    ? "1.8px solid #FCE4A6"
                    : "1.2px solid rgba(217, 175, 96, 0.35)",
                  boxShadow: isCurrent && !isFull
                    ? "0 4px 16px rgba(246, 213, 138, 0.25)"
                    : "none",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: isFull ? "#EF4444" : "#10B981",
                      boxShadow: isFull ? "0 0 8px #EF4444" : "0 0 8px #10B981",
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#FFF8EC] truncate">
                      {srv.name}
                    </div>
                    <div className="text-[10px] text-[#F7EBD5]/70 truncate">
                      {isFull ? "⚠️ Đã đủ 100 người · Chặn người 101" : srv.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: isFull
                          ? "rgba(239, 68, 68, 0.25)"
                          : "rgba(246, 213, 138, 0.2)",
                        border: isFull
                          ? "1px solid #EF4444"
                          : "1px solid rgba(217, 164, 65, 0.4)",
                        color: isFull ? "#FCA5A5" : "#FFF4D2",
                      }}
                    >
                      {isFull ? "100/100 · ĐẦY" : `${srv.onlineCount}/100`}
                    </span>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10.5px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/50 px-2 py-1 rounded-lg">
                      Đang ở đây
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => handleSelectServer(srv.id)}
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        isFull
                          ? "bg-red-950/60 border border-red-500/40 text-red-300 opacity-60 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#F6D58A] to-[#D9A441] text-[#1B0D09] hover:scale-105 active:scale-95 shadow-md"
                      }`}
                    >
                      {isFull ? "Đã Khóa" : "Chuyển Vào"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setServerModalOpen(false)}
            className="w-full py-2 rounded-full border border-[#D9A441]/45 text-[#F7EBD5]/80 hover:text-[#FFF8EC] text-xs font-medium hover:bg-white/5 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
