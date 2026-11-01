"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Preserve all URL params and redirect to /temple
    const params = new URLSearchParams(window.location.search);
    if (!params.get("room")) params.set("room", "main-hall");
    if (!params.get("instance")) params.set("instance", "1");
    if (!params.get("region")) params.set("region", "us-east-1");
    router.replace(`/temple?${params.toString()}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-4xl mb-4">⛩️</div>
        <p className="text-amber-400 text-sm tracking-widest">ĐANG TIẾN VÀO CHÁNH ĐIỆN...</p>
      </div>
    </div>
  );
}
