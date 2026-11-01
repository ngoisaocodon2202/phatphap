"use client";
import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";

const INTERACTION_RADIUS = 3.5; // meters

interface InteractableObject {
  position: THREE.Vector3;
  label: string;
  onInteract: () => void;
}

export function useInteraction(
  playerPositionRef: React.RefObject<THREE.Vector3>,
  objects: InteractableObject[]
) {
  const store       = useTempleStore();
  const lastPrompt  = useRef<string | null>(null);

  useFrame(() => {
    if (!playerPositionRef.current) return;

    let closestDist   = Infinity;
    let closestObject: InteractableObject | null = null;

    for (const obj of objects) {
      const dist = playerPositionRef.current.distanceTo(obj.position);
      if (dist < INTERACTION_RADIUS && dist < closestDist) {
        closestDist   = dist;
        closestObject = obj;
      }
    }

    const prompt = closestObject ? `[E] ${closestObject.label}` : null;

    if (prompt !== lastPrompt.current) {
      lastPrompt.current = prompt;
      store.setInteractionPrompt(prompt);
    }
  });

  const handleKeyE = useCallback((objects: InteractableObject[], playerPos: THREE.Vector3) => {
    for (const obj of objects) {
      if (playerPos.distanceTo(obj.position) < INTERACTION_RADIUS) {
        obj.onInteract();
        return;
      }
    }
  }, []);

  return { handleKeyE };
}
