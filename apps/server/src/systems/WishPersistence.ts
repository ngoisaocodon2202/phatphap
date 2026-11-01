import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on("error", (err) => {
      console.warn("[Redis] Connection error (wishes will not persist):", err.message);
    });
  }
  return redis;
}

export interface Wish {
  id:        string;
  wish:      string;
  authorId:  string;
  roomId:    string;
  color:     string;
  timestamp: number;
}

export async function saveWish(wish: Wish): Promise<void> {
  try {
    const r = getRedis();
    await r.lpush("temple:wishes", JSON.stringify(wish));
    await r.ltrim("temple:wishes", 0, 999); // Keep last 1000 wishes
  } catch (err) {
    // Non-critical — fail silently
  }
}

export async function getRecentWishes(count = 20): Promise<Wish[]> {
  try {
    const r = getRedis();
    const raw = await r.lrange("temple:wishes", 0, count - 1);
    return raw.map(s => JSON.parse(s) as Wish);
  } catch {
    return [];
  }
}

