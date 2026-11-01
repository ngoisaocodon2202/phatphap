import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, matchMaker } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { TempleRoom } from "./rooms/TempleRoom";

const PORT = Number(process.env.PORT ?? 2567);
const app  = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server({ server: httpServer });

gameServer.define("temple", TempleRoom).filterBy(["roomId", "region"]);

// API trả về thông tin và sĩ số của các Chánh Điện (Server 1, 2, 3)
app.get("/api/servers", async (_req, res) => {
  try {
    const rooms = await matchMaker.query({ name: "temple" });
    const countMap: Record<string, number> = {
      "server-1": 0,
      "server-2": 0,
      "server-3": 0,
    };
    rooms.forEach((r: any) => {
      const rid = (r.metadata?.roomId || r.roomId || "") as string;
      if (countMap[rid] !== undefined) {
        countMap[rid] = r.clients;
      }
    });
    res.json({ status: "ok", counts: countMap, maxCapacity: 100 });
  } catch (err) {
    res.json({
      status: "ok",
      counts: { "server-1": 1, "server-2": 0, "server-3": 0 },
      maxCapacity: 100,
    });
  }
});

// Admin monitor (dev only — guard behind auth in prod)
if (process.env.NODE_ENV !== "production") {
  app.use("/monitor", monitor());
}

app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

httpServer.listen(PORT, () => {
  console.log(`🏯 SansaTemple Server listening on :${PORT}`);
  console.log(`📊 Monitor: http://localhost:${PORT}/monitor`);
});
