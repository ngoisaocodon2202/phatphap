"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTempleStore } from "@/stores/templeStore";

export function SpatialAudio() {
  const { camera } = useThree();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bellRinging = useTempleStore((s) => s.bellRinging);
  const moktakRinging = useTempleStore((s) => s.moktakRinging);
  const malaCount = useTempleStore((s) => s.malaCount);
  const isMeditating = useTempleStore((s) => s.isMeditating);
  const audioPlaying = useTempleStore((s) => s.audioPlaying);
  const audioTrack = useTempleStore((s) => s.audioTrack);

  const prevBellRinging = useRef(false);
  const prevMoktakRinging = useRef(false);
  const prevMalaCount = useRef(malaCount);

  const masterGainRef = useRef<GainNode | null>(null);
  const reverbSendRef = useRef<GainNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio Context + Realistic Wooden Sanctuary Reverb
  useEffect(() => {
    const initAudio = () => {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        return;
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      const shouldPlay =
        useTempleStore.getState().audioPlaying &&
        useTempleStore.getState().audioTrack !== "none";
      master.gain.setValueAtTime(shouldPlay ? 0.9 : 0, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Tạo âm vang Chánh Điện gỗ cổ truyền (Convolution Hall Reverb)
      const reverbSend = ctx.createGain();
      reverbSend.gain.setValueAtTime(0.45, ctx.currentTime);
      try {
        const convolver = ctx.createConvolver();
        convolver.buffer = createSanctuaryImpulseResponse(ctx, 3.4, 2.6);
        const reverbLowpass = ctx.createBiquadFilter();
        reverbLowpass.type = "lowpass";
        reverbLowpass.frequency.setValueAtTime(2400, ctx.currentTime);

        reverbSend.connect(convolver);
        convolver.connect(reverbLowpass);
        reverbLowpass.connect(master);
      } catch {
        reverbSend.connect(master);
      }
      reverbSendRef.current = reverbSend;

      // Âm nền thiền định 108Hz + 162Hz (Fifth) ấm áp, nhẹ nhàng
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(108, ctx.currentTime);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(162, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, ctx.currentTime);

        gain.gain.setValueAtTime(0.028, ctx.currentTime);
        ambientGainRef.current = gain;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc1.start();
        osc2.start();
      } catch (err) {
        console.warn("[SpatialAudio] Warm pad failed:", err);
      }

      // Tiếng mưa rơi hiên chùa êm dịu (Pink-filtered Noise)
      try {
        const noiseBuffer = createSoftRainBuffer(ctx, 4.0);
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = "bandpass";
        rainFilter.frequency.setValueAtTime(680, ctx.currentTime);
        rainFilter.Q.setValueAtTime(0.7, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(
          useTempleStore.getState().audioTrack === "rain" ? 0.08 : 0.0,
          ctx.currentTime
        );
        rainGainRef.current = rainGain;

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(master);
        rainSource.start();
      } catch (err) {
        console.warn("[SpatialAudio] Rain buffer failed:", err);
      }

      // Ngân một tiếng Chuông Gia Trì nhẹ khi khởi tạo âm thanh
      if (useTempleStore.getState().audioPlaying) {
        playSingingBowl(ctx, master, reverbSend, 0.35);
      }
    };

    window.addEventListener("pointerdown", initAudio);
    window.addEventListener("keydown", initAudio);

    return () => {
      window.removeEventListener("pointerdown", initAudio);
      window.removeEventListener("keydown", initAudio);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Master volume on/off & Resume AudioContext if suspended
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!masterGainRef.current || !ctx) return;
    if (audioPlaying && ctx.state === "suspended") {
      ctx.resume();
    }
    masterGainRef.current.gain.setTargetAtTime(
      audioPlaying && audioTrack !== "none" ? 0.9 : 0,
      ctx.currentTime,
      0.18
    );

    if (rainGainRef.current) {
      rainGainRef.current.gain.setTargetAtTime(
        audioPlaying && audioTrack === "rain" ? 0.085 : 0.0,
        ctx.currentTime,
        0.5
      );
    }
  }, [audioPlaying, audioTrack]);

  // Background Relaxing Temple Tracks (Chuông chùa & Tiếng mõ / Chuông Gia Trì / Mưa & Chuông gió)
  useEffect(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (chimeIntervalRef.current) {
      clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = null;
    }

    if (!audioPlaying || audioTrack === "none") return;

    if (audioTrack === "moktak") {
      // Nhịp mõ gỗ trầm ấm thư giãn kết hợp tiếng Chuông Gia Trì mỗi 8 nhịp
      let beat = 0;
      loopIntervalRef.current = setInterval(() => {
        const ctx = audioCtxRef.current;
        const master = masterGainRef.current;
        const rev = reverbSendRef.current;
        if (!ctx || !master) return;
        beat = (beat + 1) % 8;
        playMoktak(ctx, master, rev, 0.18);
        if (beat === 0) {
          playSingingBowl(ctx, master, rev, 0.28);
        }
      }, 1650);
    } else if (audioTrack === "chant") {
      // Chuông Gia Trì & Đại Hồng Chung ngân vang thư giãn định kỳ
      loopIntervalRef.current = setInterval(() => {
        const ctx = audioCtxRef.current;
        const master = masterGainRef.current;
        const rev = reverbSendRef.current;
        if (!ctx || !master) return;
        playSingingBowl(ctx, master, rev, 0.32);
      }, 5200);
    }

    // Tiếng chuông gió đồng bên hiên chùa (ngân khẽ ngẫu nhiên rất thư giãn)
    chimeIntervalRef.current = setInterval(() => {
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      const rev = reverbSendRef.current;
      if (!ctx || !master) return;
      playWindChime(ctx, master, rev, 0.12);
    }, 6800);

    return () => {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
    };
  }, [audioTrack, audioPlaying]);

  // Handle Great Temple Bell Strike (Đại Hồng Chung)
  useEffect(() => {
    if (
      bellRinging &&
      !prevBellRinging.current &&
      audioCtxRef.current &&
      masterGainRef.current
    ) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      playTempleGong(
        audioCtxRef.current,
        masterGainRef.current,
        reverbSendRef.current,
        [4.5, 2.3, -2.5]
      );
    }
    prevBellRinging.current = bellRinging;
  }, [bellRinging]);

  // Handle Moktak Strike (Direct player action or Sutra reader)
  useEffect(() => {
    if (
      moktakRinging &&
      !prevMoktakRinging.current &&
      audioCtxRef.current &&
      masterGainRef.current
    ) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      playMoktak(
        audioCtxRef.current,
        masterGainRef.current,
        reverbSendRef.current,
        0.52
      );
    }
    prevMoktakRinging.current = moktakRinging;
  }, [moktakRinging]);

  // Handle Mala Bead Advance Click
  useEffect(() => {
    if (
      malaCount !== prevMalaCount.current &&
      audioCtxRef.current &&
      masterGainRef.current
    ) {
      playBeadClick(
        audioCtxRef.current,
        masterGainRef.current,
        reverbSendRef.current
      );
    }
    prevMalaCount.current = malaCount;
  }, [malaCount]);

  // Handle Meditation State Volume Transition
  useEffect(() => {
    if (!ambientGainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    ambientGainRef.current.gain.setTargetAtTime(
      isMeditating ? 0.045 : 0.028,
      ctx.currentTime,
      1.2
    );
  }, [isMeditating]);

  // Spatial Listener Tracking
  useFrame(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== "running") return;

    const listener = ctx.listener;
    const forward = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    camera.getWorldDirection(forward);

    if (listener.positionX) {
      listener.positionX.setValueAtTime(camera.position.x, ctx.currentTime);
      listener.positionY.setValueAtTime(camera.position.y, ctx.currentTime);
      listener.positionZ.setValueAtTime(camera.position.z, ctx.currentTime);
      listener.forwardX.setValueAtTime(forward.x, ctx.currentTime);
      listener.forwardY.setValueAtTime(forward.y, ctx.currentTime);
      listener.forwardZ.setValueAtTime(forward.z, ctx.currentTime);
      listener.upX.setValueAtTime(up.x, ctx.currentTime);
      listener.upY.setValueAtTime(up.y, ctx.currentTime);
      listener.upZ.setValueAtTime(up.z, ctx.currentTime);
    }
  });

  return null;
}

/**
 * Tạo xung phản xạ âm học không gian Chánh Điện gỗ (Sanctuary Impulse Response)
 */
function createSanctuaryImpulseResponse(
  ctx: AudioContext,
  durationSeconds: number,
  decayRate: number
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSeconds);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.pow(1 - i / length, decayRate);
      // Phản xạ sớm ấm áp của cột gỗ + độ ngân sâu của chánh điện
      const early =
        t < 0.08 ? Math.sin(t * 280 * (ch + 1)) * 0.25 : 0;
      channelData[i] = ((Math.random() * 2 - 1) * 0.75 + early) * env;
    }
  }
  return impulse;
}

/**
 * Tạo buffer tiếng mưa rơi hiên chùa êm dịu
 */
function createSoftRainBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.95 * b2 + white * 0.048;
    data[i] = (b0 + b1 + b2) * 0.35;
  }
  return buffer;
}

/**
 * Tiếng Mõ Gỗ Cổ Truyền (Rosewood Temple Moktak) ấm và tròn tiếng
 */
function playMoktak(
  ctx: AudioContext,
  destination: GainNode,
  reverbSend: GainNode | null,
  volume = 0.45
) {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  // Cộng hưởng khoang gỗ mít/gỗ lim trầm ấm (~640Hz & ~980Hz)
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(660, now);
  osc1.frequency.exponentialRampToValueAtTime(485, now + 0.11);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1020, now);
  osc2.frequency.exponentialRampToValueAtTime(690, now + 0.07);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(680, now);
  filter.Q.setValueAtTime(3.2, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  if (reverbSend) {
    gain.connect(reverbSend);
  }

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.24);
  osc2.stop(now + 0.24);
}

/**
 * Tiếng Chuông Gia Trì / Singing Bowl thanh thoát, thư giãn sâu
 */
function playSingingBowl(
  ctx: AudioContext,
  destination: GainNode,
  reverbSend: GainNode | null,
  volume = 0.32
) {
  const now = ctx.currentTime;
  const partials = [
    { freq: 288, ratio: 1.0, decay: 4.6 },
    { freq: 288.6, ratio: 0.65, decay: 4.4 }, // Nhịp giao thoa tự nhiên của đồng
    { freq: 576, ratio: 0.35, decay: 3.2 },
    { freq: 864, ratio: 0.14, decay: 2.1 },
  ];

  partials.forEach(({ freq, ratio, decay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(volume * ratio, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain);
    gain.connect(destination);
    if (reverbSend) {
      gain.connect(reverbSend);
    }

    osc.start(now);
    osc.stop(now + decay + 0.05);
  });
}

/**
 * Tiếng Chuông Gió Đồng Hiên Chùa (Temple Eaves Bronze Wind Chime)
 */
function playWindChime(
  ctx: AudioContext,
  destination: GainNode,
  reverbSend: GainNode | null,
  volume = 0.12
) {
  const pentatonic = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
  const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(note, now);

  gain.gain.setValueAtTime(0.0005, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

  osc.connect(gain);
  gain.connect(destination);
  if (reverbSend) {
    gain.connect(reverbSend);
  }

  osc.start(now);
  osc.stop(now + 2.5);
}

/**
 * Tiếng Lần Chuỗi Hạt Gỗ Trầm Hương (Wooden Mala Bead Click)
 */
function playBeadClick(
  ctx: AudioContext,
  destination: GainNode,
  reverbSend: GainNode | null
) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1150 + Math.random() * 140, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.045);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(980, now);
  filter.Q.setValueAtTime(4.5, now);

  gain.gain.setValueAtTime(0.32, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  if (reverbSend) {
    gain.connect(reverbSend);
  }

  osc.start(now);
  osc.stop(now + 0.065);
}

/**
 * Tiếng Đại Hồng Chung Chùa Cổ (Authentic Bronze Great Temple Bell)
 * Có âm chày gỗ trầm lúc chạm chuông và sóng giao thoa đồng ngân dài 7.5 giây
 */
function playTempleGong(
  ctx: AudioContext,
  destination: GainNode,
  reverbSend: GainNode | null,
  bellPos: [number, number, number]
) {
  const now = ctx.currentTime;
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "exponential";
  panner.refDistance = 4;
  panner.maxDistance = 65;
  panner.rolloffFactor = 0.85;

  if (panner.positionX) {
    panner.positionX.setValueAtTime(bellPos[0], now);
    panner.positionY.setValueAtTime(bellPos[1], now);
    panner.positionZ.setValueAtTime(bellPos[2], now);
  }

  panner.connect(destination);
  if (reverbSend) {
    panner.connect(reverbSend);
  }

  // 1. Tiếng chày gỗ trầm ấm chạm vào thân chuông đồng
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = "triangle";
  thudOsc.frequency.setValueAtTime(145, now);
  thudOsc.frequency.exponentialRampToValueAtTime(52, now + 0.14);
  thudGain.gain.setValueAtTime(0.42, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  thudOsc.connect(thudGain);
  thudGain.connect(panner);
  thudOsc.start(now);
  thudOsc.stop(now + 0.18);

  // 2. Hệ bồi âm chuẩn vật lý của Đại Hồng Chung bằng đồng (Hum, Prime, Tierce, Quint, Nominal)
  const harmonics = [
    { freq: 108.0, gain: 0.48, decay: 7.2 }, // Hum note trầm sâu
    { freq: 108.45, gain: 0.36, decay: 7.0 }, // Giao thoa sóng âm (beating) tự nhiên
    { freq: 216.0, gain: 0.44, decay: 5.8 }, // Prime
    { freq: 216.8, gain: 0.28, decay: 5.5 }, // Prime beating
    { freq: 259.2, gain: 0.24, decay: 4.4 }, // Minor third (Tierce đặc trưng chuông chùa)
    { freq: 324.0, gain: 0.2, decay: 3.6 }, // Fifth (Quint)
    { freq: 432.0, gain: 0.18, decay: 2.9 }, // Nominal
    { freq: 684.0, gain: 0.08, decay: 1.8 }, // Bồi âm ánh kim
  ];

  harmonics.forEach(({ freq, gain: initGain, decay }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(initGain, now + 0.022);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gainNode);
    gainNode.connect(panner);

    osc.start(now);
    osc.stop(now + decay + 0.1);
  });
}
