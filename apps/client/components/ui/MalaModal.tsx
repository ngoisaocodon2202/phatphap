"use client";
import { useTempleStore } from "@/stores/templeStore";

export function MalaModal() {
  const malaModalOpen = useTempleStore((s) => s.malaModalOpen);
  const setMalaModalOpen = useTempleStore((s) => s.setMalaModalOpen);
  const malaCount = useTempleStore((s) => s.malaCount);
  const incrementMala = useTempleStore((s) => s.incrementMala);
  const resetMala = useTempleStore((s) => s.resetMala);

  if (!malaModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md font-sans">
      <div className="w-full max-w-sm mx-4 bg-[#1B0D09]/95 border border-[#D9A441]/45 rounded-3xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.85)] space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Tiêu đề */}
        <div>
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#32170F] border border-[#D9A441]/50 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-[#F6D58A]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="7" strokeDasharray="2 3" />
              <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
              <path d="M12 19v3" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-[#F6D58A] font-serif tracking-wider text-base sm:text-lg font-semibold whitespace-nowrap truncate">
            Lần Chuỗi Niệm Phật
          </h3>
          <p className="text-[#F7EBD5]/60 text-[11px] sm:text-xs mt-1 whitespace-nowrap truncate">
            Buông xả muộn phiền, nhất tâm lần từng hạt chuỗi
          </p>
        </div>

        {/* Vòng quay đếm hạt to chính giữa */}
        <div className="relative py-3 sm:py-4 flex flex-col items-center justify-center">
          <div
            onClick={incrementMala}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-[#D9A441]/50 bg-[#32170F]/60
                       flex flex-col items-center justify-center cursor-pointer select-none
                       hover:scale-105 active:scale-95 transition-all shadow-inner
                       hover:border-[#F6D58A] group whitespace-nowrap"
          >
            <span className="text-4xl sm:text-5xl font-serif font-semibold text-[#F6D58A] group-hover:text-white transition-colors whitespace-nowrap">
              {malaCount}
            </span>
            <span className="text-xs text-[#D9A441] uppercase tracking-widest mt-1 font-medium whitespace-nowrap">
              / 108 Hạt
            </span>
            <span className="text-[11px] text-[#F7EBD5]/75 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Chạm để lần hạt
            </span>
          </div>

          {malaCount === 108 && (
            <div className="mt-4 text-[11px] sm:text-xs text-[#F6D58A] bg-[#D9A441]/20 border border-[#D9A441]/45 rounded-xl px-3 py-2 animate-pulse shadow-lg whitespace-nowrap truncate max-w-full">
              Đã viên mãn 108 hạt chuỗi bình an
            </div>
          )}
        </div>

        {/* Nút điều khiển */}
        <div className="flex gap-2.5 text-xs whitespace-nowrap">
          <button
            onClick={resetMala}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F7EBD5]/70 transition-colors font-medium border border-[#D9A441]/20 whitespace-nowrap"
          >
            Làm lại từ đầu
          </button>
          <button
            onClick={() => setMalaModalOpen(false)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C99738] via-[#F6D58A] to-[#D9A441] text-[#1B0D09] font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
