"use client";
import { useState, useEffect } from "react";
import { useTempleStore } from "@/stores/templeStore";

interface SutraItem {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  verses: string[];
}

const SUTRAS: SutraItem[] = [
  {
    id: "bat-nha",
    title: "Bát Nhã Tâm Kinh",
    shortTitle: "Bát Nhã Tâm Kinh",
    subtitle: "Kinh Quán Tự Tại Bồ Tát hành thâm Bát Nhã",
    verses: [
      "Quán Tự Tại Bồ Tát hành thâm Bát Nhã Ba La Mật Đa thời, chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.",
      "Xá Lợi Tử! Sắc bất dị không, không bất dị sắc, sắc tức thị không, không tức thị sắc; thọ, tưởng, hành, thức diệc phục như thị.",
      "Xá Lợi Tử! Thị chư pháp không tướng, bất sanh bất diệt, bất cấu bất tịnh, bất tăng bất giảm.",
      "Thị cố không trung vô sắc, vô thọ, tưởng, hành, thức; vô nhãn, nhĩ, tỷ, thiệt, thân, ý; vô sắc, thanh, hương, vị, xúc, pháp.",
      "Bồ Tát y Bát Nhã Ba La Mật Đa cố, tâm vô quái ngại; vô quái ngại cố, vô hữu khủng bố, viễn ly điên đảo mộng tưởng, cứu cánh Niết Bàn.",
      "Yết đế, yết đế, ba la yết đế, ba la tăng yết đế, Bồ đề tát bà ha. (3 lần)",
    ],
  },
  {
    id: "tu-bi",
    title: "Kinh Từ Bi (Metta)",
    shortTitle: "Kinh Từ Bi",
    subtitle: "Trải tâm từ bi và năng lượng bình an đến muôn loài",
    verses: [
      "Nguyện cho tất cả chúng sinh đều được an vui, không có oán thù, không có khổ đau, thân tâm thường an lạc.",
      "Như mẹ hiền thương yêu và che chở đứa con duy nhất của mình bằng cả mạng sống, hãy mở rộng tấm lòng từ bi vô lượng đối với tất cả muôn loài.",
      "Từ trên xuống dưới, khắp cả mười phương, tâm từ bi trải rộng không biên giới, không hận thù, không oán giận.",
      "Dù khi đi, khi đứng, khi ngồi hay khi nằm, bao giờ còn thức tỉnh, hãy luôn an trú trong chánh niệm từ bi này.",
      "Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. (3 lần)",
    ],
  },
  {
    id: "sam-nguyen",
    title: "Lời Sám Nguyện",
    shortTitle: "Lời Sám Nguyện",
    subtitle: "Tịnh hóa thân tâm trước tôn tượng Đức Phật Thích Ca",
    verses: [
      "Đệ tử chúng con chí tâm đảnh lễ trước bảo tọa Đức Phật Thích Ca Mâu Ni, nguyện giữ tâm trong sáng như hoa sen nở giữa hồ thanh tịnh.",
      "Bao nhiêu lầm lỗi do thân, khẩu, ý gây tạo từ vô thỉ kiếp đến nay, con xin chí thành sám hối và nguyện làm lành lánh dữ.",
      "Nguyện đem công đức lành này hướng về khắp tất cả, đệ tử và chúng sinh đều trọn thành Phật đạo, gia đạo bình an, vạn sự cát tường.",
    ],
  },
];

export function SutraModal() {
  const sutraModalOpen = useTempleStore((s) => s.sutraModalOpen);
  const setSutraModalOpen = useTempleStore((s) => s.setSutraModalOpen);
  const setMoktakRinging = useTempleStore((s) => s.setMoktakRinging);
  const setBellRinging = useTempleStore((s) => s.setBellRinging);
  const localPlayer = useTempleStore((s) => s.localPlayer);

  const [selectedId, setSelectedId] = useState<string>(SUTRAS[0].id);
  const [autoMoktak, setAutoMoktak] = useState<boolean>(false);
  const [activeVerseIdx, setActiveVerseIdx] = useState<number>(0);

  const currentSutra = SUTRAS.find((s) => s.id === selectedId) || SUTRAS[0];

  // Tự động gõ mõ nhịp nhàng khi bật chế độ Tụng Kinh Có Tiếng Mõ
  useEffect(() => {
    if (!sutraModalOpen || !autoMoktak) return;
    const interval = setInterval(() => {
      setMoktakRinging(true);
      setTimeout(() => {
        useTempleStore.getState().setMoktakRinging(false);
      }, 180);
    }, 1150);

    return () => clearInterval(interval);
  }, [sutraModalOpen, autoMoktak, setMoktakRinging]);

  if (!sutraModalOpen) return null;

  const handleStrikeMoktakOnce = () => {
    setMoktakRinging(true);
    setTimeout(() => {
      useTempleStore.getState().setMoktakRinging(false);
    }, 200);
  };

  const handleCompleteSutra = () => {
    setAutoMoktak(false);
    setBellRinging(true, localPlayer.vietnameseName);
    setTimeout(() => {
      useTempleStore.getState().setBellRinging(false);
    }, 3000);
    setSutraModalOpen(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        background: "rgba(10, 5, 3, 0.75)",
        backdropFilter: "blur(8px)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={() => {
        setAutoMoktak(false);
        setSutraModalOpen(false);
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, rgba(44, 22, 14, 0.97) 0%, rgba(24, 11, 6, 0.99) 100%)",
          border: "1.5px solid rgba(217, 164, 65, 0.72)",
          borderRadius: "22px",
          padding: "clamp(16px, 4vw, 24px)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.85)",
          color: "#F7EBD5",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: 700,
                color: "#F6D58A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              KINH PHẬT NHẬT TỤNG
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "clamp(11px, 2.8vw, 12.5px)",
                color: "rgba(247, 235, 213, 0.68)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentSutra.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAutoMoktak(false);
              setSutraModalOpen(false);
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(217, 164, 65, 0.35)",
              color: "#F6D58A",
              cursor: "pointer",
              fontSize: "15px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Chọn bài kinh — 1 dòng duy nhất, không bao giờ nhảy dòng */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
            marginBottom: "14px",
          }}
        >
          {SUTRAS.map((s) => {
            const active = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedId(s.id);
                  setActiveVerseIdx(0);
                }}
                style={{
                  padding: "7px 8px",
                  borderRadius: "999px",
                  fontSize: "clamp(10.5px, 2.8vw, 12.5px)",
                  fontWeight: active ? 700 : 500,
                  background: active
                    ? "linear-gradient(180deg, #F6D58A 0%, #D9A441 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: active
                    ? "1px solid #FFF2C6"
                    : "1px solid rgba(217, 164, 65, 0.32)",
                  color: active ? "#1B0D09" : "#F7EBD5",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.shortTitle}
              </button>
            );
          })}
        </div>

        {/* Nội dung Kinh */}
        <div
          style={{
            maxHeight: "48dvh",
            overflowY: "auto",
            padding: "clamp(12px, 3vw, 18px)",
            borderRadius: "16px",
            background: "rgba(16, 7, 4, 0.78)",
            border: "1px solid rgba(217, 164, 65, 0.32)",
            lineHeight: 1.7,
            fontSize: "clamp(13.5px, 3.4vw, 15px)",
          }}
        >
          {currentSutra.verses.map((verse, idx) => {
            const isHighlighted = idx === activeVerseIdx;
            return (
              <p
                key={idx}
                onClick={() => {
                  setActiveVerseIdx(idx);
                  handleStrikeMoktakOnce();
                }}
                style={{
                  margin: idx === 0 ? "0 0 10px" : "10px 0",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: isHighlighted
                    ? "rgba(217, 164, 65, 0.16)"
                    : "transparent",
                  borderLeft: isHighlighted
                    ? "3px solid #F6D58A"
                    : "3px solid transparent",
                  color: isHighlighted ? "#FFF6D6" : "rgba(247, 235, 213, 0.85)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {verse}
              </p>
            );
          })}
        </div>

        {/* Thanh công cụ Tiếng Mõ & Hồi Hướng — Không bao giờ xuống dòng chữ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto 1fr",
            gap: "6px",
            marginTop: "14px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={handleStrikeMoktakOnce}
            style={{
              padding: "9px 11px",
              borderRadius: "999px",
              background: "rgba(217, 164, 65, 0.16)",
              border: "1px solid rgba(217, 164, 65, 0.55)",
              color: "#F6D58A",
              fontSize: "clamp(11px, 2.8vw, 12.5px)",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Gõ Mõ
          </button>
          <button
            type="button"
            onClick={() => setAutoMoktak((v) => !v)}
            style={{
              padding: "9px 11px",
              borderRadius: "999px",
              background: autoMoktak
                ? "rgba(74, 222, 128, 0.2)"
                : "rgba(255, 255, 255, 0.06)",
              border: autoMoktak
                ? "1px solid #4ADE80"
                : "1px solid rgba(217, 164, 65, 0.35)",
              color: autoMoktak ? "#86EFAC" : "#F7EBD5",
              fontSize: "clamp(11px, 2.8vw, 12.5px)",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {autoMoktak ? "Đang nhịp mõ..." : "Tự động mõ"}
          </button>

          <button
            type="button"
            onClick={handleCompleteSutra}
            style={{
              padding: "9px 12px",
              borderRadius: "999px",
              background:
                "linear-gradient(180deg, #F6D58A 0%, #D9A441 55%, #B57C1E 100%)",
              border: "1px solid #FFF2C6",
              color: "#1B0D09",
              fontSize: "clamp(11px, 2.8vw, 13px)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Thỉnh Chuông Hồi Hướng
          </button>
        </div>
      </div>
    </div>
  );
}
