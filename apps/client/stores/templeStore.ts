import { create } from "zustand";

export type QualityPreset = "high" | "medium" | "low";
export type PilgrimGender = "male" | "female";
export type TimeOfDayPhase = "morning" | "noon" | "afternoon" | "night";
export type TimeMode = "realtime" | TimeOfDayPhase;
export type WeatherCondition = "clear" | "rain" | "mist" | "petals";
export type WeatherMode = "realtime" | WeatherCondition;

export function getRealtimePhase(date = new Date()): TimeOfDayPhase {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 15.5) return "noon";
  if (h >= 15.5 && h < 18.25) return "afternoon";
  return "night";
}

export function formatRealtimeClock(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export interface RemotePlayer {
  sessionId: string;
  username: string;
  vietnameseName?: string;
  gender?: PilgrimGender;
  avatarColor: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  action: string; // idle | walk | run | sit | bow
  isMeditating: boolean;
}

// ── LƯ HƯƠNG ĐỒNG LỚN TRƯỚC PHẬT ĐÀI: NƠI PHẬT TỬ BƯỚC TỚI ĐỂ THẮP NÉN NHANG ──
export const INCENSE_BURNER_POS = { x: 0, z: -1.65 };
// Vị trí Phật tử đứng thắp hương (cách lư hương ~0.95m về phía Chánh Điện, quay mặt lên Phật)
export const INCENSE_STAND_SPOT = { x: 0, y: 0.01, z: -0.7 };
export const INCENSE_BURN_MS = 120_000; // 1 nén hương cháy hết sau 2 phút
export const INCENSE_MAX_STICKS = 12;

// ── HOA ĐĂNG ĐƯỢC THẢ XUỐNG 2 HỒ SEN HAI BÊN: Phật tử bước ra sát hiên chùa (x = ±9.3) ──
export const LANTERN_SPOT_X = 9.3;
export const POND_CENTER_X = 14.3;
export const POND_CENTER_Z = 4.5;

export interface IncenseStick {
  id: number;
  litAt: number;
  slot: number;
}

export interface Lantern {
  id: string;
  wish: string;
  authorId: string;
  x: number;
  y: number;
  z: number;
  color: string;
  createdAt: number;
}

export interface Cushion {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  side: "left" | "right" | "center";
  row: number;
  col: number;
}

const MAT_CRIMSON_GOLD = "#8B1E1B";

// ── HỆ THỐNG 100 TẤM THẢM QUỲ (MỖI BÊN 50 TẤM: 10 HÀNG DỌC × 5 CỘT NGANG) ──────
// Ở chính giữa (x = 0, từ x = -1.0 đến +1.0) là lối Thảm Đỏ Hành Lễ riêng biệt dẫn thẳng lên Bàn Thờ Phật
export const CUSHION_GRID: Cushion[] = (() => {
  const list: Cushion[] = [];
  let id = 0;

  // 10 hàng trải dài từ gần bàn thờ (z = -2.35) xuống cuối Đại Hùng Bảo Điện (z = +8.09)
  // Khoảng cách mỗi hàng 1.16m để phía trên mỗi tấm thảm đều đặt 1 Kệ Kinh Gỗ & 1 Cuốn Sách Kinh trang nghiêm
  const numRows = 10;
  const startZ = -2.35;
  const rowSpacing = 1.16;

  // 5 cột mỗi bên trải rộng khoáng đạt khắp chiều ngang Đại Hùng Bảo Điện (x từ ±1.95 ra tới ±8.08)
  // Chừa khoảng cách kiến trúc ở giữa cột 2 và cột 3 tại x = ±4.35 cho đại trụ gỗ lim giống hệt ảnh Preview
  const leftColsX = [-1.95, -3.28, -5.42, -6.75, -8.08];
  const rightColsX = [1.95, 3.28, 5.42, 6.75, 8.08];

  // 50 Tấm thảm bên trái (id: 0 -> 49)
  for (let r = 0; r < numRows; r++) {
    const z = +(startZ + r * rowSpacing).toFixed(2);
    for (let c = 0; c < leftColsX.length; c++) {
      list.push({
        id: id++,
        x: leftColsX[c],
        y: 0.01,
        z,
        color: MAT_CRIMSON_GOLD,
        side: "left",
        row: r,
        col: c,
      });
    }
  }

  // 50 Tấm thảm bên phải (id: 50 -> 99)
  for (let r = 0; r < numRows; r++) {
    const z = +(startZ + r * rowSpacing).toFixed(2);
    for (let c = 0; c < rightColsX.length; c++) {
      list.push({
        id: id++,
        x: rightColsX[c],
        y: 0.01,
        z,
        color: MAT_CRIMSON_GOLD,
        side: "right",
        row: r,
        col: c,
      });
    }
  }

  return list;
})();

export function findNearestCushion(px: number, pz: number): Cushion {
  let nearest = CUSHION_GRID[55] || CUSHION_GRID[0];
  let minDstSq = Infinity;
  for (const c of CUSHION_GRID) {
    const dstSq = (c.x - px) ** 2 + (c.z - pz) ** 2;
    if (dstSq < minDstSq) {
      minDstSq = dstSq;
      nearest = c;
    }
  }
  return nearest;
}

export const ROBE_PALETTE = [
  { id: "aolam", label: "Áo Lam", desc: "Lam khói Phật tử truyền thống", color: "#7A8B9E" },
  { id: "nausong", label: "Nâu Sồng", desc: "Áo tràng nâu trầm cổ điển", color: "#7C4D2B" },
  { id: "hoangy", label: "Hoàng Y", desc: "Sắc vàng ấm trang nghiêm", color: "#D98A2B" },
] as const;

export const SUGGESTED_BUDDHIST_NAMES = [
  { name: "Diệu Tâm", meaning: "Tâm Hồn Thanh Tịnh", gender: "female" as PilgrimGender },
  { name: "Minh An", meaning: "Trí Tuệ Bình An", gender: "male" as PilgrimGender },
  { name: "Tịnh Liên", meaning: "Đóa Sen Tinh Khiết", gender: "female" as PilgrimGender },
  { name: "Thiện Đức", meaning: "Đức Độ Hiền Hòa", gender: "male" as PilgrimGender },
  { name: "An Nhiên", meaning: "Tự Tại Giữa Đời", gender: "female" as PilgrimGender },
  { name: "Tâm Mộc", meaning: "Cây Bồ Đề Vững Chãi", gender: "male" as PilgrimGender },
];

export const DEFAULT_PILGRIM = {
  username: "Diệu Tâm",
  vietnameseName: "Diệu Tâm",
  gender: "male" as PilgrimGender,
  avatarColor: "#7A8B9E", // Mặc định Áo Lam truyền thống
};

export function getRandomPilgrim() {
  return DEFAULT_PILGRIM;
}

// ── QUẢN LÝ 3 CHÁNH ĐIỆN (SERVER) · MỖI SERVER TỐI ĐA 100 NGƯỜI (CHẶN NGƯỜI 101) ──
export interface TempleServerInfo {
  id: string; // "server-1" | "server-2" | "server-3"
  name: string; // "Chánh Điện 01 — Vô Lượng Quang"
  shortName: string; // "C.Đ 01"
  desc: string; // "Đại Chánh Điện trung tâm · Đang tụ hội đông đảo"
  capacity: number; // 100 người
  onlineCount: number; // Sĩ số hiện tại (0 - 100)
  status: "available" | "full";
}

export const INITIAL_SERVERS: TempleServerInfo[] = [
  {
    id: "server-1",
    name: "Chánh Điện 01 — Vô Lượng Quang",
    shortName: "C.Đ 01 · Vô Lượng Quang",
    desc: "Đại Chánh Điện trung tâm · Đang tụ hội đông đảo",
    capacity: 100,
    onlineCount: 38,
    status: "available",
  },
  {
    id: "server-2",
    name: "Chánh Điện 02 — Diệu Pháp Liên Hoa",
    shortName: "C.Đ 02 · Diệu Pháp",
    desc: "Đạo tràng trang nghiêm · Thanh tịnh an lạc",
    capacity: 100,
    onlineCount: 16,
    status: "available",
  },
  {
    id: "server-3",
    name: "Chánh Điện 03 — Từ Bi Hỷ Xả",
    shortName: "C.Đ 03 · Từ Bi Hỷ Xả",
    desc: "Thiền thất tĩnh mặc · Thích hợp tịnh tâm sâu",
    capacity: 100,
    onlineCount: 7,
    status: "available",
  },
];

export interface TempleStore {
  // Connection
  connected: boolean;
  sessionId: string;
  roomId: string;

  // ── Multi-Server Selection (3 Chánh Điện · Tối đa 100 người / server, chặn người 101) ──
  currentServerId: string;
  serversList: TempleServerInfo[];
  serverModalOpen: boolean;
  setServerModalOpen: (open: boolean) => void;
  setCurrentServerId: (id: string) => boolean;
  updateServerOnlineCount: (serverId: string, count: number) => void;

  // Onboarding (Chọn tên & giới tính mỗi khi vào trang)
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;

  // Local Player
  localPlayer: {
    username: string;
    vietnameseName: string;
    gender: PilgrimGender;
    avatarColor: string;
  };
  localPlayerPos: { x: number; y: number; z: number };
  localAction: "idle" | "walk" | "run" | "sit" | "bow";
  remotePlayers: Map<string, RemotePlayer>;

  // Tự động tìm thảm quỳ hoặc đi lên thảm giữa dâng Phật
  navigationTarget: { x: number; y: number; z: number; id?: number } | null;
  navigationPurpose: "bow" | "sit" | "lantern" | "incense" | null;

  // Nén hương đang cháy trong lư hương trước Phật đài
  incenseSticks: IncenseStick[];
  lightIncense: () => void;
  offerIncense: () => void;
  pruneIncense: () => void;

  // Camera tự xoay mượt tới góc nhìn mục tiêu (dùng khi thả hoa đăng ra hồ sen)
  cameraAzimuthTarget: number | null;
  setCameraAzimuthTarget: (v: number | null) => void;
  statusNotice: string | null;

  buddhaStyle: "3d" | "painting";

  // World state
  lanterns: Lantern[];
  bellRinging: boolean;
  bellRingerName: string;
  moktakRinging: boolean;

  // 4 Chức năng cốt lõi: Lạy Phật, Đọc Kinh, Đếm Chuỗi Hạt, Dâng Hoa Đăng
  bowCount: number;
  malaCount: number;
  malaModalOpen: boolean;
  sutraModalOpen: boolean;
  prayerModalOpen: boolean;

  // Audio & Presence
  audioTrack: "none" | "moktak" | "chant" | "rain";
  audioPlaying: boolean;
  presenceOpen: boolean;

  // UI state
  interactionPrompt: string | null;
  isMeditating: boolean;
  ping: number;

  // Camera Controls & Quality
  cameraZoom: number;
  cameraResetTrigger: number;
  playerSpawnTrigger: number;
  activeNavTab: string;
  qualityPreset: QualityPreset;

  // Mobile Touch Controls (Joystick & Nhảy)
  joystickVector: { x: number; y: number };
  setJoystickVector: (vec: { x: number; y: number }) => void;
  jumpTrigger: number;
  triggerJump: () => void;

  // Real-Time Time-of-Day & Weather (Sáng, Trưa, Chiều, Tối & Thời tiết thực tế)
  timeMode: TimeMode;
  timeOfDay: TimeOfDayPhase;
  weatherMode: WeatherMode;
  weatherCondition: WeatherCondition;
  liveTemperature: number;
  liveTimeString: string;
  setTimeMode: (mode: TimeMode) => void;
  setWeatherMode: (mode: WeatherMode) => void;
  syncRealtimeClockAndWeather: (data?: {
    temp?: number;
    condition?: WeatherCondition;
  }) => void;

  zoomIn: () => void;
  zoomOut: () => void;
  setCameraZoom: (zoom: number) => void;
  setOverviewCamera: () => void;
  resetCamera: () => void;
  setActiveNavTab: (tab: string) => void;
  setQualityPreset: (preset: QualityPreset) => void;

  // Actions
  setConnected: (v: boolean) => void;
  setSessionId: (v: string) => void;
  setRoomId: (v: string) => void;
  setLocalPlayer: (p: {
    username: string;
    vietnameseName: string;
    gender?: PilgrimGender;
    avatarColor: string;
  }) => void;
  setLocalPlayerPos: (x: number, y: number, z: number) => void;
  setLocalAction: (v: "idle" | "walk" | "run" | "sit" | "bow") => void;
  setRemotePlayers: (m: Map<string, RemotePlayer>) => void;
  setLanterns: (l: Lantern[]) => void;
  setBellRinging: (v: boolean, name?: string) => void;
  setMoktakRinging: (v: boolean) => void;
  setInteractionPrompt: (v: string | null) => void;
  setPrayerModalOpen: (v: boolean) => void;
  setSutraModalOpen: (v: boolean) => void;
  setIsMeditating: (v: boolean) => void;
  setPing: (v: number) => void;
  setMalaModalOpen: (v: boolean) => void;
  incrementMala: () => void;
  resetMala: () => void;

  // Navigation & Rituals
  startNavigateToCushion: (purpose: "bow" | "sit") => void;
  navigateToSpecificCushion: (cushion: Cushion, purpose?: "bow" | "sit") => void;
  startWalkToIncenseBurner: () => void;
  startWalkToPondForLantern: () => void;
  cancelNavigation: () => void;
  setStatusNotice: (msg: string | null) => void;
  triggerBowDirectly: () => void;
  toggleSit: () => void;

  setBuddhaStyle: (s: "3d" | "painting") => void;
  toggleBuddhaStyle: () => void;

  setAudioTrack: (t: "none" | "moktak" | "chant" | "rain") => void;
  setAudioPlaying: (v: boolean) => void;
  toggleAudioPlaying: () => void;
  setPresenceOpen: (v: boolean) => void;
}

// Mặc định nhân vật quỳ lễ tại tấm thảm hàng thứ 4 bên phải sát lối đi thảm đỏ
const INITIAL_MAT = CUSHION_GRID[65] || { x: 1.95, y: 0.01, z: 1.13 };

export const useTempleStore = create<TempleStore>((set, get) => ({
  connected: false,
  sessionId: "",
  roomId: "",

  currentServerId: "server-1",
  serversList: INITIAL_SERVERS,
  serverModalOpen: false,
  setServerModalOpen: (serverModalOpen) => set({ serverModalOpen }),
  setCurrentServerId: (id) => {
    const s = get().serversList.find((srv) => srv.id === id);
    if (s && s.onlineCount >= s.capacity) {
      get().setStatusNotice(`⚠️ ${s.name} đã đủ tối đa 100 Phật tử. Không thể tiếp nhận thêm người thứ 101!`);
      setTimeout(() => get().setStatusNotice(null), 4500);
      return false;
    }
    set({ currentServerId: id });
    return true;
  },
  updateServerOnlineCount: (serverId, count) => {
    set((s) => ({
      serversList: s.serversList.map((srv) =>
        srv.id === serverId
          ? {
              ...srv,
              onlineCount: Math.min(srv.capacity, Math.max(0, count)),
              status: count >= srv.capacity ? "full" : "available",
            }
          : srv
      ),
    }));
  },

  onboardingCompleted: false,
  setOnboardingCompleted: (v) =>
    set((s) =>
      v
        ? {
            onboardingCompleted: true,
            localAction: "sit",
            isMeditating: true,
            navigationTarget: null,
            navigationPurpose: null,
            cameraZoom: 5.4,
            cameraResetTrigger: s.cameraResetTrigger + 1,
            playerSpawnTrigger: s.playerSpawnTrigger + 1,
          }
        : { onboardingCompleted: false }
    ),

  localPlayer: DEFAULT_PILGRIM,
  localPlayerPos: { x: INITIAL_MAT.x, y: 0.76, z: INITIAL_MAT.z },
  localAction: "sit",
  remotePlayers: new Map(),

  navigationTarget: null,
  navigationPurpose: null,
  statusNotice: null,

  cameraZoom: 5.4,
  cameraResetTrigger: 0,
  playerSpawnTrigger: 0,
  activeNavTab: "chanhdien",
  qualityPreset: "high",

  // Mobile Touch Controls
  joystickVector: { x: 0, y: 0 },
  setJoystickVector: (joystickVector) => set({ joystickVector }),
  jumpTrigger: 0,
  triggerJump: () => set((s) => ({ jumpTrigger: s.jumpTrigger + 1 })),

  timeMode: "realtime",
  timeOfDay: getRealtimePhase(),
  weatherMode: "realtime",
  weatherCondition: "clear",
  liveTemperature: 30,
  liveTimeString: formatRealtimeClock(),
  setTimeMode: (mode) =>
    set({
      timeMode: mode,
      timeOfDay: mode === "realtime" ? getRealtimePhase() : mode,
    }),
  setWeatherMode: (mode) =>
    set((s) => ({
      weatherMode: mode,
      weatherCondition: mode === "realtime" ? s.weatherCondition : mode,
    })),
  syncRealtimeClockAndWeather: (data) =>
    set((s) => {
      const now = new Date();
      const nextTimeOfDay =
        s.timeMode === "realtime" ? getRealtimePhase(now) : s.timeOfDay;
      const nextWeather =
        s.weatherMode === "realtime"
          ? data?.condition ?? s.weatherCondition
          : s.weatherCondition;
      return {
        liveTimeString: formatRealtimeClock(now),
        timeOfDay: nextTimeOfDay,
        weatherCondition: nextWeather,
        liveTemperature:
          typeof data?.temp === "number" ? Math.round(data.temp) : s.liveTemperature,
      };
    }),

  zoomIn: () =>
    set((s) => ({ cameraZoom: Math.max(1.8, +(s.cameraZoom - 1.8).toFixed(2)) })),
  zoomOut: () =>
    set((s) => ({ cameraZoom: Math.min(26.0, +(s.cameraZoom + 2.2).toFixed(2)) })),
  setCameraZoom: (zoom) =>
    set({ cameraZoom: Math.max(1.8, Math.min(26.0, zoom)) }),
  setOverviewCamera: () =>
    set((s) => ({
      cameraZoom: s.cameraZoom > 11.0 ? 5.4 : 18.5,
      cameraResetTrigger: s.cameraResetTrigger + 1,
    })),
  resetCamera: () =>
    set((s) => ({
      cameraZoom: 5.4,
      localAction: "sit",
      isMeditating: true,
      navigationTarget: null,
      navigationPurpose: null,
      cameraResetTrigger: s.cameraResetTrigger + 1,
      playerSpawnTrigger: s.playerSpawnTrigger + 1,
    })),
  setActiveNavTab: (tab) => set({ activeNavTab: tab }),
  setQualityPreset: (qualityPreset) => set({ qualityPreset }),

  buddhaStyle: "3d",

  lanterns: [],
  bellRinging: false,
  bellRingerName: "",
  moktakRinging: false,

  bowCount: 0,
  malaCount: 0,
  malaModalOpen: false,
  sutraModalOpen: false,
  prayerModalOpen: false,

  audioTrack: "chant",
  audioPlaying: false,
  presenceOpen: false,

  interactionPrompt: null,
  isMeditating: true,
  ping: 0,

  setConnected: (v) => set({ connected: v }),
  setSessionId: (v) => set({ sessionId: v }),
  setRoomId: (v) => set({ roomId: v }),
  setLocalPlayer: (p) =>
    set((s) => ({
      localPlayer: {
        username: p.username,
        vietnameseName: p.vietnameseName,
        gender: p.gender ?? s.localPlayer.gender ?? "male",
        avatarColor: p.avatarColor,
      },
    })),
  setLocalPlayerPos: (x, y, z) => {
    const pos = get().localPlayerPos;
    pos.x = x;
    pos.y = y;
    pos.z = z;
  },
  setLocalAction: (v) => set({ localAction: v }),
  setRemotePlayers: (m) => set({ remotePlayers: new Map(m) }),
  setLanterns: (l) => set({ lanterns: l }),
  setBellRinging: (v, name = "") => set({ bellRinging: v, bellRingerName: name }),
  setMoktakRinging: (v) => set({ moktakRinging: v }),
  setInteractionPrompt: (v) => set({ interactionPrompt: v }),
  setPrayerModalOpen: (v) => set({ prayerModalOpen: v }),
  setSutraModalOpen: (v) => set({ sutraModalOpen: v }),
  setIsMeditating: (v) => set({ isMeditating: v }),
  setPing: (v) => set({ ping: v }),
  setMalaModalOpen: (v) => set({ malaModalOpen: v }),
  setStatusNotice: (msg) => set({ statusNotice: msg }),

  setBuddhaStyle: (s) => set({ buddhaStyle: s }),
  toggleBuddhaStyle: () =>
    set((s) => ({ buddhaStyle: s.buddhaStyle === "3d" ? "painting" : "3d" })),

  incrementMala: () => {
    const next = (get().malaCount + 1) % 109;
    set({ malaCount: next === 0 ? 1 : next });
  },
  resetMala: () => set({ malaCount: 0 }),

  startNavigateToCushion: (purpose: "bow" | "sit") => {
    const currentAction = get().localAction;
    if (currentAction === "bow") return;

    const { localPlayerPos } = get();
    const nearest = findNearestCushion(localPlayerPos.x, localPlayerPos.z);
    get().navigateToSpecificCushion(nearest, purpose);
  },

  navigateToSpecificCushion: (cushion: Cushion, purpose: "bow" | "sit" = "sit") => {
    const currentAction = get().localAction;
    if (currentAction === "bow") return;

    const { localPlayerPos } = get();
    const dst = Math.hypot(cushion.x - localPlayerPos.x, cushion.z - localPlayerPos.z);

    if (dst <= 0.35) {
      if (purpose === "bow") {
        get().triggerBowDirectly();
      } else {
        const isCurrentlySitting = get().localAction === "sit";
        set({
          localAction: isCurrentlySitting ? "idle" : "sit",
          isMeditating: !isCurrentlySitting,
          statusNotice: isCurrentlySitting
            ? null
            : `Đang quỳ lễ tại thảm số ${cushion.id + 1} · Tâm tĩnh lặng, an trú hiện tại`,
        });
      }
    } else {
      const notice =
        purpose === "bow"
          ? `Đang bước tới thảm quỳ số ${cushion.id + 1} để đảnh lễ Đức Phật...`
          : `Đang bước tới thảm quỳ số ${cushion.id + 1}...`;

      set({
        navigationTarget: cushion,
        navigationPurpose: purpose,
        statusNotice: notice,
        localAction: "walk",
        isMeditating: false,
      });
    }
  },

  // Bước lên thảm đỏ trung tâm tới trước Lư Hương để thắp một nén nhang dâng Phật
  startWalkToIncenseBurner: () => {
    if (get().localAction === "bow") return;
    const { localPlayerPos } = get();
    const dst = Math.hypot(
      INCENSE_STAND_SPOT.x - localPlayerPos.x,
      INCENSE_STAND_SPOT.z - localPlayerPos.z
    );
    // Đã đứng sẵn trước lư hương: thắp hương ngay
    if (dst <= 0.5 && !get().navigationTarget) {
      get().offerIncense();
      return;
    }
    set({
      navigationTarget: { ...INCENSE_STAND_SPOT },
      navigationPurpose: "incense",
      statusNotice: "Đang bước lên thảm đỏ tới lư hương để thắp nén nhang dâng Phật...",
      localAction: "walk",
      isMeditating: false,
    });
  },

  // Thắp một nén nhang rồi chắp tay đảnh lễ Đức Phật
  offerIncense: () => {
    get().lightIncense();
    setTimeout(() => {
      const s = get();
      if (s.localAction === "idle" || s.localAction === "sit") s.triggerBowDirectly();
    }, 1300);
  },

  // Bước ra sát hiên chùa (bên trái hoặc phải gần nhất) để thả hoa đăng xuống hồ sen
  startWalkToPondForLantern: () => {
    if (get().localAction === "bow") return;
    const { localPlayerPos } = get();
    const side = localPlayerPos.x < -0.35 ? -1 : 1;
    const spotZ = Math.max(0.6, Math.min(9.0, localPlayerPos.z));
    set({
      navigationTarget: { x: side * LANTERN_SPOT_X, y: 0.01, z: spotZ },
      navigationPurpose: "lantern",
      statusNotice:
        side < 0
          ? "Đang bước ra hiên bên trái để thả hoa đăng xuống hồ sen..."
          : "Đang bước ra hiên bên phải để thả hoa đăng xuống hồ sen...",
      localAction: "walk",
      isMeditating: false,
    });
  },

  incenseSticks: [],
  lightIncense: () => {
    const now = Date.now();
    const alive = get().incenseSticks.filter((s) => now - s.litAt < INCENSE_BURN_MS);
    const used = new Set(alive.map((s) => s.slot));
    let slot = 0;
    while (used.has(slot) && slot < INCENSE_MAX_STICKS) slot++;
    const next = [...alive];
    if (slot >= INCENSE_MAX_STICKS) {
      // Lư hương đã đầy: thay nén hương cũ nhất
      next.sort((a, b) => a.litAt - b.litAt);
      slot = next.shift()!.slot;
    }
    next.push({ id: now + Math.floor(Math.random() * 1000), litAt: now, slot });
    set({
      incenseSticks: next,
      statusNotice: "Đã thắp nén hương · Nguyện hương thơm lan tỏa, cầu bình an cho muôn loài",
    });
    setTimeout(() => {
      set((s) => ({
        statusNotice: s.statusNotice?.startsWith("Đã thắp nén hương") ? null : s.statusNotice,
      }));
    }, 4500);
  },
  pruneIncense: () => {
    const now = Date.now();
    const cur = get().incenseSticks;
    const alive = cur.filter((s) => now - s.litAt < INCENSE_BURN_MS);
    if (alive.length !== cur.length) set({ incenseSticks: alive });
  },

  cameraAzimuthTarget: null,
  setCameraAzimuthTarget: (v) => set({ cameraAzimuthTarget: v }),

  cancelNavigation: () => {
    if (get().navigationTarget) {
      set({
        navigationTarget: null,
        navigationPurpose: null,
        statusNotice: null,
      });
    }
  },

  triggerBowDirectly: () => {
    if (get().localAction === "bow") return;
    set({
      localAction: "bow",
      isMeditating: false,
      navigationTarget: null,
      navigationPurpose: null,
      statusNotice: "Đang chí thành đảnh lễ Đức Phật (Ngũ thể đầu địa)...",
    });

    setTimeout(() => {
      set((s) => ({
        localAction: "sit",
        isMeditating: true,
        bowCount: s.bowCount + 1,
        statusNotice: "Đảnh lễ hoàn mãn · Nguyện cầu bình an, phước huệ trang nghiêm",
      }));
      setTimeout(() => {
        set((s) => ({
          statusNotice: s.statusNotice?.startsWith("Đảnh lễ hoàn mãn")
            ? null
            : s.statusNotice,
        }));
      }, 3000);
    }, 2800);
  },

  toggleSit: () => {
    const current = get().localAction;
    if (current === "sit") {
      set({ localAction: "idle", isMeditating: false, statusNotice: null });
    } else {
      get().startNavigateToCushion("sit");
    }
  },

  setAudioTrack: (t) => set({ audioTrack: t }),
  setAudioPlaying: (v) => set({ audioPlaying: v }),
  toggleAudioPlaying: () => set((s) => ({ audioPlaying: !s.audioPlaying })),
  setPresenceOpen: (v) => set({ presenceOpen: v }),
}));
