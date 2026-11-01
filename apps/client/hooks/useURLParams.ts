"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export interface TempleURLParams {
  room:     string;
  instance: string;
  region:   string;
}

export function useURLParams(): TempleURLParams {
  const searchParams = useSearchParams();

  return useMemo(() => ({
    room:     searchParams.get("room")     ?? "main-hall",
    instance: searchParams.get("instance") ?? "1",
    region:   searchParams.get("region")   ?? "us-east-1",
  }), [searchParams]);
}
