import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { TempleRoom } from "./rooms/TempleRoom";

const PORT = Number(process.env.PORT ?? 2567);
const app  = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server({ server: httpServer });

gameServer.define("temple", TempleRoom).filterBy(["roomId", "region"]);

// Admin monitor (dev only — guard behind auth in prod)
if (process.env.NODE_ENV !== "production") {
  app.use("/monitor", monitor());
}

app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

httpServer.listen(PORT, () => {
  console.log(`🏯 SansaTemple Server listening on :${PORT}`);
  console.log(`📊 Monitor: http://localhost:${PORT}/monitor`);
});
