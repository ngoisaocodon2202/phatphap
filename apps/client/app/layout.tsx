import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SansaTemple — Chánh Điện 3D Thanh Tịnh",
  description: "Không gian Chánh Điện 100 bồ đoàn, lễ Phật, đọc kinh, thắp hương và thả hoa đăng trực tuyến",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-black text-white overflow-hidden select-none touch-none">{children}</body>
    </html>
  );
}
