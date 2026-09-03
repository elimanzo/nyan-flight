import { DEFAULT_CONFIG } from "./types";

export type Rect = { x: number; y: number; width: number; height: number };

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

export const PIPE_GAP_BASE = 360;
export const PIPE_SPACING_BASE = 140;
export const NEAR_MISS_THRESHOLD = 52;

export const HITBOX_CONFIG = {
  cat: {
    widthScale: 0.4,
    heightScale: 0.15,
    offsetYScale: 0.02,
  },
  pipe: {
    cap: { insetXRatio: 0.18, insetYRatio: 0.15 },
    body: { insetXRatio: 0.25, insetYRatio: 0.08 },
  },
  bounds: {
    ceiling: 12,
    floor: 48,
  },
} as const;

// ---------------------------------------------------------------------------
// Tuning functions
// ---------------------------------------------------------------------------

export const computePipeGap = (score: number, difficulty: number): number =>
  Math.max(PIPE_GAP_BASE - score * 6 - difficulty * 14, 175);

export const computePipeSpeed = (score: number, difficulty: number): number =>
  Math.min(DEFAULT_CONFIG.pipe.speed + score * 0.035 + difficulty * 0.2, 5.5);

export const computePipeSpacing = (score: number, difficulty: number): number =>
  Math.max(PIPE_SPACING_BASE - score * 1.2 - difficulty * 9, 80);

// ---------------------------------------------------------------------------
// Geometry helpers (no Pixi)
// ---------------------------------------------------------------------------

export const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export const createInsetRectangle = (
  bounds: Rect,
  insetXRatio = 0,
  insetYRatio = 0,
): Rect => {
  const insetX = bounds.width * insetXRatio;
  const insetY = bounds.height * insetYRatio;
  return {
    x: bounds.x + insetX / 2,
    y: bounds.y + insetY / 2,
    width: Math.max(0, bounds.width - insetX),
    height: Math.max(0, bounds.height - insetY),
  };
};

export const getFloorZone = (width: number, height: number): Rect => ({
  x: 0,
  y: Math.max(0, height - HITBOX_CONFIG.bounds.floor),
  width,
  height: HITBOX_CONFIG.bounds.floor,
});

export const getCeilingZone = (width: number): Rect => ({
  x: 0,
  y: 0,
  width,
  height: HITBOX_CONFIG.bounds.ceiling,
});
