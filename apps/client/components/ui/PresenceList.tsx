"use client";
import { useTempleStore } from "@/stores/templeStore";

export function PresenceList() {
  const presenceOpen = useTempleStore((s) => s.presenceOpen);
  const setPresenceOpen = useTempleStore((s) => s.setPresenceOpen);
  const remotePlayers = useTempleStore((s) => s.remotePlayers);
  const localPlayer = useTempleStore((s) => s.localPlayer);
  const connected = useTempleStore((s) => s.connected);
  const totalCount = remotePlayers.size + 1;

  if (!presenceOpen) return null;

  return (
    <div className="fixed top-14 sm:top-16 left-3 right-3 sm:left-auto sm:right-4 z-30 sm:w-80 max-w-[calc(100vw-24px)] bg-[#1B0D09]/95 backdrop-blur-2xl border border-[#D9A441]/45 rounded-3xl p-4 sm:p-5 shadow-[0_16px_48px_rgba(0,0,0,0.85)] space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 font-sans whitespace-nowrap">
      <div className="flex items-center justify-between border-b border-[#D9A441]/20 pb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-[#F6D58A] shrink-0"
            fill="currentColor"
          >
            <path d="M12 3C9.8 6.5 8.5 9.5 8.5 12.5C8.5 15 10 16.8 12 17.6C14 16.8 15.5 15 15.5 12.5C15.5 9.5 14.2 6.5 12 3Z" />
          </svg>
          <span className="text-xs text-[#F6D58A] font-semibold tracking-wider truncate whitespace-nowrap">
            Đồng đạo trong Chánh điện ({totalCount})
          </span>
        </div>
        <button
          onClick={() => setPresenceOpen(false)}
          className="text-[#F7EBD5]/50 hover:text-[#F6D58A] text-xs px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 whitespace-nowrap"
        >
          Đóng
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {/* Nhân vật của bạn */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-xs">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-[#F6D58A]/60 shrink-0"
            style={{ background: localPlayer.avatarColor }}
          />
          <span className="text-[#F7EBD5] font-medium truncate">
            {localPlayer.username}
          </span>
          <span className="ml-auto text-[10px] text-[#F6D58A] font-semibold bg-[#D9A441]/25 px-2 py-0.5 rounded-full">
            Bạn
          </span>
        </div>

        {/* Các đồng đạo khác cùng phòng */}
        {Array.from(remotePlayers.values()).map((p) => (
          <div
            key={p.sessionId}
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5 text-xs text-[#F7EBD5]/90"
          >
            <div
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 shrink-0"
              style={{ background: p.avatarColor || "#D9A441" }}
            />
            <span className="truncate">{p.username}</span>
            {p.action === "sit" || p.isMeditating ? (
              <span className="ml-auto text-[10px] text-[#F6D58A] bg-[#D9A441]/15 px-2 py-0.5 rounded-full">
                Tọa thiền
              </span>
            ) : p.action === "bow" ? (
              <span className="ml-auto text-[10px] text-[#F6D58A] bg-[#D9A441]/15 px-2 py-0.5 rounded-full">
                Lạy Phật
              </span>
            ) : null}
          </div>
        ))}

        {remotePlayers.size === 0 && connected && (
          <div className="text-[#F7EBD5]/50 text-xs text-center py-5 space-y-1">
            <p>Hiện chưa có đồng đạo nào khác trong Chánh Điện.</p>
            <p className="text-[11px] text-[#F7EBD5]/35 italic">
              Hãy an trú trong giây phút hiện tại.
            </p>
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-[#D9A441]/15 text-[11px] text-[#F6D58A]/70 text-center italic">
        Lặng lẽ cùng nhau sẻ chia sự bình an trong tâm hồn
      </div>
    </div>
  );
}
