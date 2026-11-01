"use client";
import { useState, useEffect } from "react";
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

  const [name, setName] = useState(localPlayer.vietnameseName || "");
  const [gender, setGender] = useState<PilgrimGender>(localPlayer.gender || "male");
  const [selectedRobeIdx, setSelectedRobeIdx] = useState(0);

  useEffect(() => {
    setName(localPlayer.vietnameseName || "");
    setGender(localPlayer.gender || "male");
    const foundIdx = ROBE_PALETTE.findIndex(
      (r) => r.color.toLowerCase() === localPlayer.avatarColor.toLowerCase()
    );
    if (foundIdx >= 0) setSelectedRobeIdx(foundIdx);
  }, [localPlayer, onboardingCompleted]);

  if (onboardingCompleted) return null;

  const selectedRobe = ROBE_PALETTE[selectedRobeIdx] || ROBE_PALETTE[0];

  const handleEnterTemple = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || "Thiện Tâm";

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
        padding: "16px",
        background:
          "radial-gradient(circle at 50% 40%, rgba(32, 18, 10, 0.68) 0%, rgba(12, 6, 3, 0.88) 100%)",
        backdropFilter: "blur(12px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Cột Trái (Desktop): Hình mẫu 2 Nhân Vật Mascot 3D Nam & Nữ Phật Tử chuẩn Implementation Plan */}
        <div className="hidden md:flex md:col-span-6 flex-col items-center justify-center relative">
          <div
            className="relative w-full aspect-[1.08/1] rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
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
            {/* Khung chọn nổi bật theo giới tính đang chọn */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 68%, rgba(20,10,5,0.85) 100%)",
              }}
            />
            <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-around gap-3">
              <button
                type="button"
                onClick={() => {
                  setGender("male");
                  setSelectedRobeIdx(0);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
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

        {/* Cột Phải: Bảng Glassmorphism "Bước Vào Chánh Điện" giống 100% ảnh Implementation Plan */}
        <div className="md:col-span-6 flex justify-center pt-7 md:pt-6">
          <form
            onSubmit={handleEnterTemple}
            style={{
              width: "100%",
              maxWidth: "410px",
              background:
                "linear-gradient(180deg, rgba(78, 66, 56, 0.78) 0%, rgba(48, 38, 32, 0.86) 100%)",
              backdropFilter: "blur(22px)",
              border: "1.8px solid rgba(235, 195, 112, 0.78)",
              borderRadius: "24px",
              padding: "46px 26px 26px",
              boxShadow:
                "0 28px 70px rgba(0, 0, 0, 0.85), 0 0 42px rgba(217, 164, 65, 0.22), inset 0 1px 0 rgba(255, 240, 200, 0.4)",
              color: "#F7EBD5",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            {/* Khung viền hoa văn 4 góc giống hệt ảnh thiết kế */}
            <div
              style={{
                position: "absolute",
                inset: "7px",
                border: "1px solid rgba(246, 213, 138, 0.35)",
                borderRadius: "18px",
                pointerEvents: "none",
              }}
            />
            {/* Hoa văn góc trên trái */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              style={{ position: "absolute", top: 7, left: 7, pointerEvents: "none" }}
            >
              <path
                d="M2 20V9C2 5.134 5.134 2 9 2H20"
                stroke="#F6D58A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6 15C6 10.029 10.029 6 15 6"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>
            {/* Hoa văn góc trên phải */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                transform: "scaleX(-1)",
                pointerEvents: "none",
              }}
            >
              <path
                d="M2 20V9C2 5.134 5.134 2 9 2H20"
                stroke="#F6D58A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6 15C6 10.029 10.029 6 15 6"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>
            {/* Hoa văn góc dưới trái */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              style={{
                position: "absolute",
                bottom: 7,
                left: 7,
                transform: "scaleY(-1)",
                pointerEvents: "none",
              }}
            >
              <path
                d="M2 20V9C2 5.134 5.134 2 9 2H20"
                stroke="#F6D58A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6 15C6 10.029 10.029 6 15 6"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>
            {/* Hoa văn góc dưới phải */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              style={{
                position: "absolute",
                bottom: 7,
                right: 7,
                transform: "scale(-1, -1)",
                pointerEvents: "none",
              }}
            >
              <path
                d="M2 20V9C2 5.134 5.134 2 9 2H20"
                stroke="#F6D58A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6 15C6 10.029 10.029 6 15 6"
                stroke="#F6D58A"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>

            {/* Huy hiệu Hoa Sen Hoàng Kim Nổi Trên Đỉnh Viền (Floating Top Medallion) */}
            <div
              style={{
                position: "absolute",
                top: "-38px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "76px",
                height: "76px",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 50% 42%, rgba(122, 92, 52, 0.96) 0%, rgba(58, 42, 26, 0.98) 100%)",
                border: "2.2px solid #FCE4A6",
                boxShadow:
                  "0 0 26px rgba(246, 213, 138, 0.65), inset 0 0 16px rgba(246, 213, 138, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient
                    id="lotusMedallionGrad"
                    x1="24"
                    y1="8"
                    x2="24"
                    y2="38"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#FFF8DC" />
                    <stop offset="55%" stopColor="#F6D58A" />
                    <stop offset="100%" stopColor="#D99B26" />
                  </linearGradient>
                </defs>
                {/* Cánh sen ngoài xòe rộng */}
                <path
                  d="M7 27C7.5 32.5 13.5 36.5 21 36.8C15.5 34.5 12 30.2 11.5 25.5C9.5 25.5 8 26 7 27Z"
                  fill="url(#lotusMedallionGrad)"
                  opacity="0.88"
                />
                <path
                  d="M41 27C40.5 32.5 34.5 36.5 27 36.8C32.5 34.5 36 30.2 36.5 25.5C38.5 25.5 40 26 41 27Z"
                  fill="url(#lotusMedallionGrad)"
                  opacity="0.88"
                />
                {/* Cánh sen lớp giữa */}
                <path
                  d="M12.5 18.5C10.5 24.5 13 31.5 21.5 35.8C17.5 31.8 16.5 26 17.5 20.5C15.8 19.2 14 18.5 12.5 18.5Z"
                  fill="url(#lotusMedallionGrad)"
                  opacity="0.95"
                />
                <path
                  d="M35.5 18.5C37.5 24.5 35 31.5 26.5 35.8C30.5 31.8 31.5 26 30.5 20.5C32.2 19.2 34 18.5 35.5 18.5Z"
                  fill="url(#lotusMedallionGrad)"
                  opacity="0.95"
                />
                {/* Cánh sen trung tâm */}
                <path
                  d="M24 10C19.5 16.5 18 22.8 18 28.2C18 32.5 20.6 35.8 24 37.2C27.4 35.8 30 32.5 30 28.2C30 22.8 28.5 16.5 24 10Z"
                  fill="url(#lotusMedallionGrad)"
                />
              </svg>
            </div>

            {/* Tiêu đề chính */}
            <h2
              style={{
                margin: "0 0 18px",
                textAlign: "center",
                fontSize: "clamp(20px, 5vw, 25px)",
                fontWeight: 700,
                color: "#F8DFA1",
                letterSpacing: "0.02em",
                textShadow: "0 2px 12px rgba(246, 213, 138, 0.35)",
                whiteSpace: "nowrap",
              }}
            >
              Bước Vào Chánh Điện
            </h2>

            {/* Ô nhập Tên / Pháp Danh */}
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên / Pháp Danh"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(38, 31, 26, 0.72)",
                  border: "1.4px solid rgba(217, 175, 96, 0.68)",
                  color: "#FFF8EC",
                  fontSize: "15.5px",
                  fontWeight: 500,
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.45)",
                }}
              />
            </div>

            {/* Gợi ý nhanh Pháp Danh trên 1 hàng gọn */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "5px",
                marginBottom: "16px",
                overflowX: "auto",
                paddingBottom: "2px",
              }}
            >
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
                    style={{
                      padding: "3px 9px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: active ? 600 : 500,
                      background: active
                        ? "rgba(217, 164, 65, 0.32)"
                        : "rgba(255, 255, 255, 0.06)",
                      border: active
                        ? "1px solid #F6D58A"
                        : "1px solid rgba(217, 164, 65, 0.28)",
                      color: active ? "#FFF4D2" : "rgba(247, 235, 213, 0.78)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {sug.name}
                  </button>
                );
              })}
            </div>

            {/* 2 Thẻ Chọn Nam Phật Tử / Nữ Phật Tử giống hệt ảnh thiết kế */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              {[
                {
                  id: "male" as PilgrimGender,
                  title: "Nam Phật Tử",
                },
                {
                  id: "female" as PilgrimGender,
                  title: "Nữ Phật Tử",
                },
              ].map((opt) => {
                const isSelected = gender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGender(opt.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "16px 12px 14px",
                      borderRadius: "14px",
                      background: isSelected
                        ? "linear-gradient(180deg, rgba(225, 185, 102, 0.42) 0%, rgba(132, 98, 45, 0.28) 100%)"
                        : "rgba(38, 31, 26, 0.68)",
                      border: isSelected
                        ? "1.8px solid #FCE4A6"
                        : "1.2px solid rgba(217, 175, 96, 0.48)",
                      color: "#FFF8EC",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      boxShadow: isSelected
                        ? "0 6px 22px rgba(246, 213, 138, 0.28), inset 0 2px 10px rgba(255, 244, 208, 0.35)"
                        : "none",
                    }}
                  >
                    {/* Icon Tượng Phật Tử Vàng Kim Chuẩn Ảnh Tham Chiếu */}
                    {opt.id === "male" ? (
                      <svg width="42" height="44" viewBox="0 0 44 46" fill="none">
                        {/* Đầu & Tóc Nam Phật Tử */}
                        <path
                          d="M14.5 14C14.5 9.5 17.8 6.5 22 6.5C26.2 6.5 29.5 9.5 29.5 14C29.5 18.5 26.2 22 22 22C17.8 22 14.5 18.5 14.5 14Z"
                          fill="#F6D58A"
                        />
                        <path
                          d="M15 12.5C17 9.5 21 9.2 23.5 10.2C25.5 9.5 27.8 10.5 29 12.5"
                          stroke="#5A3E1B"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        {/* Thân Áo Tràng Cổ Giao Lĩnh Chữ Y */}
                        <path
                          d="M9.5 39C10.2 30.5 14.8 26 22 26C29.2 26 33.8 30.5 34.5 39H9.5Z"
                          fill="#F6D58A"
                        />
                        <path
                          d="M17.5 26.5L22 33.5L26.5 26.5"
                          stroke="#5A3E1B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 33.5L19 39"
                          stroke="#5A3E1B"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg width="42" height="44" viewBox="0 0 44 46" fill="none">
                        {/* Búi Tóc Cao Nữ Phật Tử */}
                        <ellipse cx="22" cy="5.5" rx="4.2" ry="3.2" fill="#F6D58A" />
                        <path
                          d="M18.2 7.2C20 8.2 24 8.2 25.8 7.2"
                          stroke="#5A3E1B"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        {/* Đầu & Khuôn Mặt Nữ Phật Tử */}
                        <path
                          d="M14.8 15.5C14.8 11.2 18 8.2 22 8.2C26 8.2 29.2 11.2 29.2 15.5C29.2 19.8 26 23 22 23C18 23 14.8 19.8 14.8 15.5Z"
                          fill="#F6D58A"
                        />
                        <path
                          d="M15.2 14.5C18 11.5 22 11.2 28.8 14.5"
                          stroke="#5A3E1B"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        {/* Thân Áo Tràng Cổ Giao Lĩnh Chữ Y */}
                        <path
                          d="M10 39C10.8 30.8 15.2 26.5 22 26.5C28.8 26.5 33.2 30.8 34 39H10Z"
                          fill="#F6D58A"
                        />
                        <path
                          d="M17.5 27L22 33.8L26.5 27"
                          stroke="#5A3E1B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 33.8L19.2 39"
                          stroke="#5A3E1B"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    <span
                      style={{
                        fontSize: "clamp(13px, 3.5vw, 15px)",
                        fontWeight: 700,
                        color: "#FFF8EC",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3 Ô Vuông Màu Áo Tràng (Áo Lam | Nâu Sồng | Hoàng Y) Giống Hệt Ảnh Thiết Kế */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
                marginBottom: "24px",
                justifyItems: "center",
              }}
            >
              {ROBE_PALETTE.map((robe, idx) => {
                const isSelected = selectedRobeIdx === idx;
                return (
                  <button
                    key={robe.id}
                    type="button"
                    onClick={() => setSelectedRobeIdx(idx)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "clamp(58px, 15vw, 72px)",
                        height: "clamp(58px, 15vw, 72px)",
                        borderRadius: "14px",
                        background: robe.color,
                        border: isSelected
                          ? "2.5px solid #FFF2C6"
                          : "1.5px solid rgba(217, 175, 96, 0.55)",
                        boxShadow: isSelected
                          ? "0 0 20px rgba(246, 213, 138, 0.5), inset 0 1px 3px rgba(255,255,255,0.4)"
                          : "0 4px 12px rgba(0,0,0,0.45)",
                        transition: "all 0.18s ease",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "clamp(12px, 3.2vw, 14px)",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#FFF4D2" : "#F7EBD5",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {robe.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nút Pill Vàng Kim Phát Sáng "Bước Vào Chánh Điện" Giống Hệt Ảnh Thiết Kế */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="submit"
                style={{
                  width: "84%",
                  padding: "13px 22px",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(180deg, #F9E4A8 0%, #DFAD4B 52%, #B88022 100%)",
                  border: "2px solid #FFF5D2",
                  color: "#221109",
                  fontSize: "clamp(14.5px, 3.8vw, 17px)",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow:
                    "0 8px 28px rgba(246, 213, 138, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.75)",
                  transition: "transform 0.15s ease",
                }}
              >
                Bước Vào Chánh Điện
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
