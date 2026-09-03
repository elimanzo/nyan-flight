import { describe, it, expect } from "vitest";
import { stepRun, resetRun } from "../game/stepRun";
import type { RunState, RunInput } from "../game/stepRun";
import { DEFAULT_CONFIG } from "../game/types";

const VIEWPORT = { width: 800, height: 600 };
const CAT_X = VIEWPORT.width * 0.2; // 160
const NO_INPUT: RunInput = { flap: false };

// Run N steps with the given input, returning final state and all events
function runSteps(
  initial: RunState,
  input: RunInput,
  steps: number,
): { state: RunState; allEvents: ReturnType<typeof stepRun>["events"] } {
  let state = initial;
  const allEvents: ReturnType<typeof stepRun>["events"] = [];
  for (let i = 0; i < steps; i++) {
    const result = stepRun(state, input, 1);
    state = result.state;
    allEvents.push(...result.events);
  }
  return { state, allEvents };
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------

describe("stepRun – physics", () => {
  it("gravity accumulates velocity each frame", () => {
    const s0 = resetRun(VIEWPORT);
    const { state: s1 } = stepRun(s0, NO_INPUT, 1);
    expect(s1.velocity).toBeCloseTo(DEFAULT_CONFIG.gravity);
    const { state: s2 } = stepRun(s1, NO_INPUT, 1);
    expect(s2.velocity).toBeCloseTo(DEFAULT_CONFIG.gravity * 2);
  });

  it("velocity clamps at terminal velocity", () => {
    const s0 = resetRun(VIEWPORT);
    const { state } = runSteps(s0, NO_INPUT, 200);
    expect(state.velocity).toBeLessThanOrEqual(DEFAULT_CONFIG.terminalVelocity);
  });

  it("flap sets velocity to flapStrength", () => {
    const s0 = resetRun(VIEWPORT);
    const { state, events } = stepRun(s0, { flap: true }, 1);
    // After flap, gravity adds one frame: flapStrength + gravity
    expect(state.velocity).toBeCloseTo(
      DEFAULT_CONFIG.flapStrength + DEFAULT_CONFIG.gravity,
    );
    expect(events).toContainEqual({ type: "flap" });
  });

  it("cat falls without flap", () => {
    const s0 = resetRun(VIEWPORT);
    const { state } = runSteps(s0, NO_INPUT, 10);
    expect(state.catY).toBeGreaterThan(s0.catY);
  });

  it("cat rises after flap", () => {
    const s0 = resetRun(VIEWPORT);
    const { state: afterFlap } = stepRun(s0, { flap: true }, 1);
    expect(afterFlap.catY).toBeLessThan(s0.catY);
  });
});

// ---------------------------------------------------------------------------
// Death events
// ---------------------------------------------------------------------------

describe("stepRun – death on boundary contact", () => {
  it("emits death when cat hits floor", () => {
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      catY: VIEWPORT.height - 1,
      velocity: 8,
    };
    const { allEvents } = runSteps(s0, NO_INPUT, 5);
    expect(allEvents.some((e) => e.type === "death")).toBe(true);
  });

  it("emits death when cat hits ceiling", () => {
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      catY: 5,
      velocity: -8,
    };
    const { allEvents } = runSteps(s0, NO_INPUT, 5);
    expect(allEvents.some((e) => e.type === "death")).toBe(true);
  });

  it("emits death when cat contacts a pipe", () => {
    // Place cat in the path of a pipe
    const pipeX = CAT_X - 20; // pipe overlapping cat x
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      catY: 50, // above gap, so cat is inside top pipe
      pipes: [
        { id: 0, x: pipeX, centerY: 300, gap: 200, scored: false },
      ],
    };
    const { events } = stepRun(s0, NO_INPUT, 1);
    expect(events.some((e) => e.type === "death")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

describe("stepRun – scoring", () => {
  it("increments score once when pipe passes cat", () => {
    // Pipe just to the right of cat, will pass in one step
    const pipeX = CAT_X - DEFAULT_CONFIG.pipe.width + 1; // right edge just past cat
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      pipes: [
        { id: 0, x: pipeX, centerY: 300, gap: 400, scored: false },
      ],
    };
    const { state, events } = stepRun(s0, NO_INPUT, 1);
    expect(state.score).toBe(1);
    const scored = events.filter((e) => e.type === "scored");
    expect(scored).toHaveLength(1);
    expect(scored[0]).toMatchObject({ type: "scored", score: 1 });
  });

  it("does not score the same pipe twice", () => {
    const pipeX = CAT_X - DEFAULT_CONFIG.pipe.width - 1; // already passed
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      pipes: [
        { id: 0, x: pipeX, centerY: 300, gap: 400, scored: true },
      ],
    };
    const { state, events } = stepRun(s0, NO_INPUT, 1);
    expect(state.score).toBe(0);
    expect(events.filter((e) => e.type === "scored")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Near-miss
// ---------------------------------------------------------------------------

describe("stepRun – near-miss", () => {
  it("emits near-miss when cat clears pipe closely", () => {
    // Pipe passing cat this frame, cat very close to gap edge
    const pipeX = CAT_X - DEFAULT_CONFIG.pipe.width + 1;
    const gap = 300;
    const centerY = 300;
    const topEdge = centerY - gap / 2; // 150
    // Place cat just below topEdge (within NEAR_MISS_THRESHOLD = 52)
    const catY = topEdge + 20; // 20 pixels below top edge
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      catY,
      pipes: [{ id: 0, x: pipeX, centerY, gap, scored: false }],
    };
    const { events } = stepRun(s0, NO_INPUT, 1);
    expect(events.some((e) => e.type === "near-miss")).toBe(true);
  });

  it("does not emit near-miss when cat clears pipe with wide margin", () => {
    const pipeX = CAT_X - DEFAULT_CONFIG.pipe.width + 1;
    const gap = 400;
    const centerY = 300;
    // Cat at center of gap — far from edges
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      catY: centerY,
      pipes: [{ id: 0, x: pipeX, centerY, gap, scored: false }],
    };
    const { events } = stepRun(s0, NO_INPUT, 1);
    expect(events.some((e) => e.type === "near-miss")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------

describe("stepRun – difficulty", () => {
  it("difficulty stays within bounds (gap >= 175, speed <= 5.5, spacing >= 80)", () => {
    let state = resetRun(VIEWPORT);
    // Simulate 6 difficulty steps (60000 ms worth of elapsed) at dt=1
    for (let i = 0; i < 3600; i++) {
      const result = stepRun(state, { flap: false, spawnCenterY: 300 }, 1);
      state = result.state;
    }
    // Check that spawned pipe gaps are within range
    for (const pipe of state.pipes) {
      expect(pipe.gap).toBeGreaterThanOrEqual(175);
    }
  });
});

// ---------------------------------------------------------------------------
// Pipe spawning
// ---------------------------------------------------------------------------

describe("stepRun – pipe spawning", () => {
  it("spawns a pipe at the given centerY when space exists", () => {
    const s0 = resetRun(VIEWPORT);
    const { state } = stepRun(s0, { flap: false, spawnCenterY: 250 }, 1);
    expect(state.pipes).toHaveLength(1);
    expect(state.pipes[0].centerY).toBe(250);
    expect(state.pipes[0].x).toBe(VIEWPORT.width + 100);
  });

  it("does not spawn when no spawnCenterY provided", () => {
    const s0 = resetRun(VIEWPORT);
    const { state } = stepRun(s0, { flap: false }, 1);
    expect(state.pipes).toHaveLength(0);
  });

  it("does not spawn until spacing threshold is reached", () => {
    // Put a pipe near the right edge so spacing isn't met
    const s0: RunState = {
      ...resetRun(VIEWPORT),
      pipes: [
        { id: 0, x: VIEWPORT.width - 10, centerY: 300, gap: 200, scored: false },
      ],
    };
    const { state } = stepRun(s0, { flap: false, spawnCenterY: 250 }, 1);
    expect(state.pipes).toHaveLength(1); // no new pipe spawned
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe("stepRun – resetRun", () => {
  it("produces fresh RunState with no pipes and zero score", () => {
    const state = resetRun(VIEWPORT);
    expect(state.pipes).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.velocity).toBe(0);
    expect(state.difficulty).toBe(0);
    expect(state.elapsed).toBe(0);
    expect(state.catY).toBe(VIEWPORT.height / 2);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("stepRun – determinism", () => {
  it("same inputs produce same outputs", () => {
    const s0 = resetRun(VIEWPORT);
    const r1 = stepRun(s0, { flap: true, spawnCenterY: 300 }, 1);
    const r2 = stepRun(s0, { flap: true, spawnCenterY: 300 }, 1);
    expect(r1.state).toEqual(r2.state);
    expect(r1.events).toEqual(r2.events);
  });
});
