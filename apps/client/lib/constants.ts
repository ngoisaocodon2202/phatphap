export const GAME_CONFIG = {
  TICK_RATE: 15,           // Hz — network update frequency
  MAX_PLAYERS: 50,         // Per room instance
  INTERACTION_RADIUS: 3.5, // meters
  BELL_COOLDOWN: 5000,     // ms
  LANTERN_LIFETIME: 120_000, // ms — 2 minutes
  MAX_LANTERNS: 50,
  WALK_SPEED: 5,           // m/s
  SPRINT_SPEED: 10,        // m/s
  JUMP_FORCE: 12,
  WORLD_BOUNDS: 25,        // ±25m square boundary
} as const;

export const REGIONS = {
  "us-east-1":      "wss://us-east.sansatemple.io",
  "eu-west-1":      "wss://eu-west.sansatemple.io",
  "ap-southeast-1": "wss://ap-southeast.sansatemple.io",
  "local":          "ws://localhost:2567",
} as const;

export type RegionKey = keyof typeof REGIONS;

