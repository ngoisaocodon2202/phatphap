"use client";
import { useState, useRef } from "react";
import { useTempleStore } from "@/stores/templeStore";
import { sendRoomMessage } from "@/hooks/useMultiplayer";

const LANTERN_PALETTE = [
  { name: "Hoàng Kim (Ánh Vàng Tam Bảo)", hex: "#D9A441" },
  { name: "Đỏ Son (Phước Báu Bình An)", hex: "#C84B31" },
  { name: "Hồng Sen (Tâm Hồn Tinh Khiết)", hex: "#E879A0" },
  { name: "Hổ Phách (Ấm Áp Từ Bi)", hex: "#E07A2E" },
  { name: "Ngọc Ngà (Thanh Tịnh Trí Tuệ)", hex: "#F6D58A" },
];

export function PrayerModal() {
  const prayerModalOpen = useTempleStore((s) => s.prayerModalOpen);
  const setPrayerModalOpen = useTempleStore((s) => s.setPrayerModalOpen);
  const [wish, setWish] = useState("");
  const [color, setColor] = useState(LANTERN_PALETTE[0].hex);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!prayerModalOpen) return null;

  const handleSubmit = async () => {
    if (!wish.trim() || sending) return;
    setSending(true);

    sendRoomMessage("altarInteract", { wish: wish.trim(), color });

    // Báo cho Phật tử biết hoa đăng đang được thả xuống hồ sen
    const store = useTempleStore.getState();
    store.setStatusNotice("Hoa đăng đang được thả xuống hồ sen · Nguyện cầu bình an cho muôn loài");
    setTimeout(() => {
      const s = useTempleStore.getState();
      if (s.statusNotice?.startsWith("Hoa đăng đang được thả")) s.setStatusNotice(null);
    }, 5000);

    setWish("");
    setSending(false);
    setPrayerModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") setPrayerModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 font-sans">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#1B0D09]/95 border border-[#D9A441]/50 rounded-3xl p-4 sm:p-6 md:p-7 shadow-[0_16px_48px_rgba(0,0,0,0.85)] space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Tiêu đề */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-[#32170F] border border-[#D9A441]/50 flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F6D58A]" fill="currentColor">
              <path d="M12 2.5C9.5 6.5 8 10 8 13.5C8 16.5 9.8 18.5 12 19.5C14.2 18.5 16 16.5 16 13.5C16 10 14.5 6.5 12 2.5ZM5.5 8.5C4.5 11.5 4.8 14.8 6.8 17.2C7.8 18.4 9.5 19.3 11.2 19.7C8.6 18.1 7.2 15.6 7.2 12.6C7.2 11 6.5 9.6 5.5 8.5ZM18.5 8.5C17.5 9.6 16.8 11 16.8 12.6C16.8 15.6 15.4 18.1 12.8 19.7C14.5 19.3 16.2 18.4 17.2 17.2C19.2 14.8 19.5 11.5 18.5 8.5Z" />
            </svg>
          </div>
          <h2 className="text-[#F6D58A] text-base sm:text-lg font-serif font-semibold tracking-wider whitespace-nowrap truncate">
            Thả Hoa Đăng Cầu Nguyện
          </h2>
          <p className="text-[#F7EBD5]/65 text-[11px] sm:text-xs whitespace-nowrap truncate">
            Hoa đăng sẽ trôi trên hồ sen hai bên Chánh Điện
          </p>
        </div>

        {/* Khung viết lời nguyện cầu */}
        <div className="relative">
          <textarea
            ref={inputRef}
            autoFocus
            value={wish}
            onChange={(e) => setWish(e.target.value.slice(0, 140))}
            onKeyDown={handleKeyDown}
            placeholder="Nguyện cho gia quyến bình an, tâm hồn thanh thản, muôn loài an vui..."
            rows={3}
            className="w-full bg-[#32170F]/60 border border-[#D9A441]/40 rounded-2xl p-4
                       text-[#F7EBD5] placeholder-[#F7EBD5]/35 text-sm resize-none
                       focus:outline-none focus:border-[#F6D58A] focus:ring-1 focus:ring-[#D9A441]/40"
          />
          <div className="text-right text-[11px] text-[#F7EBD5]/45 mt-1 font-mono">
            {wish.length} / 140 ký tự
          </div>
        </div>

        {/* Bảng chọn màu hoa đăng */}
        <div className="space-y-2">
          <p className="text-xs text-[#F7EBD5]/75 tracking-wider">
            Chọn sắc màu hoa đăng truyền thống
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {LANTERN_PALETTE.map((item) => (
              <button
                key={item.hex}
                onClick={() => setColor(item.hex)}
                title={item.name}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 relative"
                style={{
                  background: item.hex,
                  boxShadow: color === item.hex ? `0 0 12px ${item.hex}` : "none",
                  outline:
                    color === item.hex
                      ? "2px solid #F6D58A"
                      : "2px solid transparent",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Xem trước sớ cầu an */}
        <div
          className="flex items-center gap-3 rounded-2xl p-3 border"
          style={{
            background: `${color}18`,
            borderColor: `${color}55`,
          }}
        >
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 10px ${color}` }}
          />
          <span className="text-[#F7EBD5]/90 text-xs italic truncate">
            {wish || "Lời nguyện của bạn sẽ được thắp sáng trên hoa đăng..."}
          </span>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-2.5 pt-2 text-xs whitespace-nowrap">
          <button
            onClick={() => setPrayerModalOpen(false)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#D9A441]/25 text-[#F7EBD5]/70 hover:bg-white/5 transition-colors font-medium whitespace-nowrap"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!wish.trim() || sending}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C99738] via-[#F6D58A] to-[#D9A441] disabled:opacity-40 disabled:cursor-not-allowed text-[#1B0D09] font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            {sending ? "Đang thả..." : "Thả Hoa Đăng"}
          </button>
        </div>
      </div>
    </div>
  );
}
