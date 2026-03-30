import { Howl } from "howler";
import { useEffect, useMemo, useRef, useState } from "react";
import backgroundMusic from "./background-music.mp3";
import jumpSound from "./jump_sound.mp3";
import pipeSound from "./going_through_pipe_sound.mp3";
import deathSound from "./dead_cat_sound.mp3";

const MUSIC_KEY = "nyan-music-volume";
const DEFAULT_VOLUME = 0.08;
const KEY_STARTERS = new Set(["Space", "Enter"]);
const SFX_RELATIVE_VOLUME = {
  jump: 1.2,
  pipe: 1,
  death: 1.5,
} as const;
const getNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

let musicInstance: Howl | null = null;
let jumpInstance: Howl | null = null;
let pipeInstance: Howl | null = null;
let deathInstance: Howl | null = null;

const ensureMusic = () => {
  if (musicInstance) return musicInstance;
  musicInstance = new Howl({
    src: [backgroundMusic, "/audio/nyan-theme.wav"],
    loop: true,
    volume: DEFAULT_VOLUME,
    html5: true,
  });
  return musicInstance;
};

const ensureJump = () => {
  if (jumpInstance) return jumpInstance;
  jumpInstance = new Howl({
    src: [jumpSound],
    volume: 0,
  });
  return jumpInstance;
};

const ensurePipe = () => {
  if (pipeInstance) return pipeInstance;
  pipeInstance = new Howl({
    src: [pipeSound],
    volume: 0,
  });
  return pipeInstance;
};

const ensureDeath = () => {
  if (deathInstance) return deathInstance;
  deathInstance = new Howl({
    src: [deathSound],
    volume: 0,
  });
  return deathInstance;
};

type SfxOptions = {
  cooldownMs?: number;
  interrupt?: boolean;
  rateRange?: [number, number];
};

const createSfxPlayer = (
  ensure: () => Howl,
  { cooldownMs = 0, interrupt = true, rateRange }: SfxOptions = {},
) => {
  let lastPlay = 0;
  return () => {
    const now = getNow();
    if (cooldownMs && now - lastPlay < cooldownMs) {
      return;
    }
    const howl = ensure();
    if (rateRange) {
      const [min, max] = rateRange;
      const rate = min + Math.random() * (max - min);
      howl.rate(rate);
    }
    if (interrupt) {
      howl.stop();
    }
    try {
      howl.play();
      lastPlay = now;
    } catch (error) {
      console.error("SFX playback error", error);
    }
  };
};

export const useAudioManager = () => {
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    const stored = window.localStorage.getItem(MUSIC_KEY);
    return stored ? Number.parseFloat(stored) : DEFAULT_VOLUME;
  });
  const [isReady, setReady] = useState(false);
  const handlersRef = useRef<{ listener: () => void } | null>(null);
  const initialVolumeRef = useRef(volume);

  useEffect(() => {
    const howl = ensureMusic();
    howl.volume(initialVolumeRef.current);
    if (!howl.playing()) {
      const detach = () => {
        handlersRef.current?.listener?.();
        handlersRef.current = null;
      };
      const play = () => {
        try {
          if (!howl.playing()) {
            howl.play();
          }
          setReady(true);
          detach();
        } catch (err) {
          console.error("Audio playback error", err);
        }
      };
      const pointerHandler = (event: PointerEvent) => {
        if (event.isPrimary) {
          play();
        }
      };
      const keyHandler = (event: KeyboardEvent) => {
        if (KEY_STARTERS.has(event.code)) {
          play();
        }
      };
      window.addEventListener("pointerdown", pointerHandler);
      window.addEventListener("keydown", keyHandler);
      handlersRef.current = {
        listener: () => {
          window.removeEventListener("pointerdown", pointerHandler);
          window.removeEventListener("keydown", keyHandler);
        },
      };
    }
    return () => {
      handlersRef.current?.listener?.();
      handlersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const howl = ensureMusic();
    howl.volume(volume);
    ensureJump().volume(volume * SFX_RELATIVE_VOLUME.jump);
    ensurePipe().volume(Math.min(1, volume * SFX_RELATIVE_VOLUME.pipe));
    ensureDeath().volume(Math.min(1, volume * SFX_RELATIVE_VOLUME.death));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUSIC_KEY, volume.toString());
    }
  }, [volume]);

  const playJump = useMemo(
    () => createSfxPlayer(ensureJump, { cooldownMs: 90 }),
    [],
  );

  const playPipe = useMemo(
    () =>
      createSfxPlayer(ensurePipe, {
        cooldownMs: 150,
        rateRange: [0.95, 1.05],
      }),
    [],
  );

  const playDeath = useMemo(
    () => createSfxPlayer(ensureDeath, { cooldownMs: 800, interrupt: false }),
    [],
  );

  const api = useMemo(
    () => ({
      volume,
      isReady,
      setVolume: (value: number) => setVolume(Math.min(1, Math.max(0, value))),
      toggleMute: () => setVolume((prev) => (prev > 0 ? 0 : DEFAULT_VOLUME)),
      playJump,
      playPipe,
      playDeath,
    }),
    [isReady, playDeath, playJump, playPipe, volume],
  );

  return api;
};
