import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Vector3 extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("float32") z: number = 0;
}

export class PlayerState extends Schema {
  @type("string")  sessionId: string = "";
  @type("string")  username: string = "Pilgrim";
  @type("string")  avatarColor: string = "#a78bfa";
  @type("float32") x: number = 0;
  @type("float32") y: number = 1;
  @type("float32") z: number = 0;
  @type("float32") rotY: number = 0;
  @type("string")  action: string = "idle"; // idle | walk | run | meditate
  @type("boolean") isMeditating: boolean = false;
  @type("int32")   ping: number = 0;
}

export class LanternState extends Schema {
  @type("string")  id: string = "";
  @type("string")  wish: string = "";
  @type("string")  authorId: string = "";
  @type("float32") x: number = 0;
  @type("float32") y: number = 5;
  @type("float32") z: number = 0;
  @type("string")  color: string = "#fbbf24";
  @type("int64")   createdAt: number = Date.now();
}

export class BellState extends Schema {
  @type("boolean") isRinging: boolean = false;
  @type("string")  lastStrikeBy: string = "";
  @type("int64")   lastStrikeAt: number = 0;
}

export class TempleState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type([LanternState])       lanterns = new ArraySchema<LanternState>();
  @type(BellState)            bell = new BellState();
  @type("string")             roomId: string = "";
  @type("string")             region: string = "us-east-1";
  @type("int32")              tickRate: number = 15;
}
