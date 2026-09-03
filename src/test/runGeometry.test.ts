import { describe, it, expect } from "vitest";
import {
  intersects,
  createInsetRectangle,
  getFloorZone,
  getCeilingZone,
  computePipeGap,
  computePipeSpeed,
  computePipeSpacing,
  HITBOX_CONFIG,
} from "../game/runGeometry";

// ---------------------------------------------------------------------------
// Tuning helpers — floors / ceilings
// ---------------------------------------------------------------------------

describe("computePipeGap", () => {
  it("stays at floor (175) under extreme score/difficulty", () => {
    expect(computePipeGap(1000, 1000)).toBe(175);
  });

  it("returns base value at zero score/difficulty", () => {
    expect(computePipeGap(0, 0)).toBe(360);
  });

  it("never drops below floor for any positive inputs", () => {
    for (const score of [0, 10, 50, 200]) {
      for (const diff of [0, 5, 20]) {
        expect(computePipeGap(score, diff)).toBeGreaterThanOrEqual(175);
      }
    }
  });
});

describe("computePipeSpeed", () => {
  it("caps at 5.5 under extreme score/difficulty", () => {
    expect(computePipeSpeed(1000, 1000)).toBe(5.5);
  });

  it("starts at base speed at zero score/difficulty", () => {
    expect(computePipeSpeed(0, 0)).toBeCloseTo(2.8);
  });

  it("never exceeds ceiling for any positive inputs", () => {
    for (const score of [0, 10, 50, 200]) {
      for (const diff of [0, 5, 20]) {
        expect(computePipeSpeed(score, diff)).toBeLessThanOrEqual(5.5);
      }
    }
  });
});

describe("computePipeSpacing", () => {
  it("stays at floor (80) under extreme score/difficulty", () => {
    expect(computePipeSpacing(1000, 1000)).toBe(80);
  });

  it("returns base value at zero score/difficulty", () => {
    expect(computePipeSpacing(0, 0)).toBe(140);
  });

  it("never drops below floor for any positive inputs", () => {
    for (const score of [0, 10, 50, 200]) {
      for (const diff of [0, 5, 20]) {
        expect(computePipeSpacing(score, diff)).toBeGreaterThanOrEqual(80);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

describe("intersects", () => {
  it("returns true for overlapping rects", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(true);
  });

  it("returns false for non-overlapping rects (gap on x axis)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 11, y: 0, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it("returns false for non-overlapping rects (gap on y axis)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 0, y: 11, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it("returns false for touching edges (not overlapping)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(false);
  });
});

describe("createInsetRectangle", () => {
  it("shrinks bounds by the inset ratios", () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    const r = createInsetRectangle(bounds, 0.2, 0.1);
    expect(r.width).toBeCloseTo(80);
    expect(r.height).toBeCloseTo(90);
    expect(r.x).toBeCloseTo(10);
    expect(r.y).toBeCloseTo(5);
  });

  it("clamps width/height to zero when inset exceeds bounds", () => {
    const bounds = { x: 0, y: 0, width: 10, height: 10 };
    const r = createInsetRectangle(bounds, 2, 2);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });

  it("returns unchanged bounds when inset is zero", () => {
    const bounds = { x: 5, y: 10, width: 50, height: 60 };
    const r = createInsetRectangle(bounds);
    expect(r).toMatchObject(bounds);
  });
});

describe("getFloorZone", () => {
  it("spans full width at the bottom", () => {
    const zone = getFloorZone(800, 600);
    expect(zone.x).toBe(0);
    expect(zone.width).toBe(800);
    expect(zone.height).toBe(HITBOX_CONFIG.bounds.floor);
    expect(zone.y).toBe(600 - HITBOX_CONFIG.bounds.floor);
  });
});

describe("getCeilingZone", () => {
  it("spans full width at the top", () => {
    const zone = getCeilingZone(800);
    expect(zone.x).toBe(0);
    expect(zone.y).toBe(0);
    expect(zone.width).toBe(800);
    expect(zone.height).toBe(HITBOX_CONFIG.bounds.ceiling);
  });
});
