"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useURLParams } from "@/hooks/useURLParams";
// Dynamic imports avoid SSR issues with WebGL and client state
const TempleScene = dynamic(
  () => import("@/components/scene/TempleScene").then((m) => ({ default: m.TempleScene })),
  { ssr: false, loading: () => <TempleLoader /> }
);

const HUD = dynamic(
  () => import("@/components/ui/HUD").then((m) => ({ default: m.HUD })),
  { ssr: false }
);

const PresenceList = dynamic(
  () => import("@/components/ui/PresenceList").then((m) => ({ default: m.PresenceList })),
  { ssr: false }
);

const PrayerModal = dynamic(
  () => import("@/components/ui/PrayerModal").then((m) => ({ default: m.PrayerModal })),
  { ssr: false }
);

const MalaModal = dynamic(
  () => import("@/components/ui/MalaModal").then((m) => ({ default: m.MalaModal })),
  { ssr: false }
);

const SutraModal = dynamic(
  () => import("@/components/ui/SutraModal").then((m) => ({ default: m.SutraModal })),
  { ssr: false }
);

const OnboardingModal = dynamic(
  () => import("@/components/ui/OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
  { ssr: false }
);

const ServerModal = dynamic(
  () => import("@/components/ui/ServerModal").then((m) => ({ default: m.ServerModal })),
  { ssr: false }
);

function TempleLoader() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#1B0D09] font-sans px-4">
      <div className="text-center space-y-4 max-w-full overflow-hidden">
        <div className="w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
          <svg viewBox="0 0 36 36" className="w-14 h-14 text-[#D9A441]" fill="currentColor">
            <path d="M18 5C14.8 10.5 13.5 15.5 13.5 20C13.5 23.5 15.5 26 18 27.2C20.5 26 22.5 23.5 22.5 20C22.5 15.5 21.2 10.5 18 5Z" />
            <path d="M10.5 10.5C8.5 15 9.2 20.2 12.2 23.8C13.5 25.3 15.4 26.5 17.2 27C13.8 24.8 12.2 21.2 12.4 16.8C12.5 14.5 11.8 12.2 10.5 10.5Z" opacity="0.85" />
            <path d="M25.5 10.5C24.2 12.2 23.5 14.5 23.6 16.8C23.8 21.2 22.2 24.8 18.8 27C20.6 26.5 22.5 25.3 23.8 23.8C26.8 20.2 27.5 15 25.5 10.5Z" opacity="0.85" />
          </svg>
        </div>
        <h2 className="text-[#F6D58A] font-serif tracking-widest text-lg font-semibold whitespace-nowrap">
          SansaTemple
        </h2>
        <p className="text-[#F7EBD5]/65 text-xs tracking-wider whitespace-nowrap truncate">
          Đang bước vào Chánh Điện Thanh Yên...
        </p>
        <div className="w-44 h-1 bg-[#32170F] mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-[#D9A441] animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

function TempleContent() {
  const { room, instance, region } = useURLParams();

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#1b0b07] touch-none">
      <TempleScene room={room} instance={instance} region={region} />
      <HUD />
      <PresenceList />
      <PrayerModal />
      <MalaModal />
      <SutraModal />
      <OnboardingModal />
      <ServerModal />
    </div>
  );
}

export default function TemplePage() {
  return (
    <Suspense fallback={<TempleLoader />}>
      <TempleContent />
    </Suspense>
  );
}
