import { DEFAULT_CONFIG } from "./types";
import {
  type Rect,
  HITBOX_CONFIG,
  NEAR_MISS_THRESHOLD,
  computePipeGap,
  computePipeSpeed,
  computePipeSpacing,
  createInsetRectangle,
  getCeilingZone,
  getFloorZone,
  intersects,
} from "./runGeometry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipePairState = {
  id: number;
  x: number;
  centerY: number;
  gap: number;
  scored: boolean;
};

export type RunViewport = {
  width: number;
  height: number;
};

export type RunState = {
  catY: number;
  velocity: number;
  pipes: PipePairState[];
  score: number;
  difficulty: number;
  elapsed: number;
  viewport: RunViewport;
  _nextPipeId: number;
};

export type RunInput = {
  flap: boolean;
  spawnCenterY?: number;
};

export type RunEvent =
  | { type: "scored"; score: number }
  | { type: "near-miss" }
  | { type: "death"; x: number; y: number }
  | { type: "flap" };

// ---------------------------------------------------------------------------
// Cat physical constants (no Pixi)
// ---------------------------------------------------------------------------

const CAT_SOURCE_HEIGHT = 1024;
const CAT_SOURCE_WIDTH = 384;
const CAT_TARGET_WIDTH = 96;
const CAT_SCALE = CAT_TARGET_WIDTH / CAT_SOURCE_WIDTH;
const CAT_RENDERED_WIDTH = CAT_TARGET_WIDTH;
const CAT_RENDERED_HEIGHT = CAT_SOURCE_HEIGHT * CAT_SCALE; // 256

const PIPE_WIDTH = DEFAULT_CONFIG.pipe.width;

// Cat x is at 20% of viewport width (matches the Pixi sprite position)
const getCatX = (viewport: RunViewport) => viewport.width * 0.2;

// ---------------------------------------------------------------------------
// Analytic hitbox helpers (no Pixi)
// ---------------------------------------------------------------------------

function getCatHitbox(catX: number, catY: number): Rect {
  const w = CAT_RENDERED_WIDTH * HITBOX_CONFIG.cat.widthScale;
  const h = CAT_RENDERED_HEIGHT * HITBOX_CONFIG.cat.heightScale;
  const offsetY = CAT_RENDERED_HEIGHT * HITBOX_CONFIG.cat.offsetYScale;
  return { x: catX - w / 2, y: catY - h / 2 + offsetY, width: w, height: h };
}

function getPipeHitboxes(pipe: PipePairState, viewportHeight: number): Rect[] {
  const topHeight = pipe.centerY - pipe.gap / 2;
  const bottomY = pipe.centerY + pipe.gap / 2;
  const rects: Rect[] = [];
  if (topHeight > 0) {
    rects.push(
      createInsetRectangle(
        { x: pipe.x, y: 0, width: PIPE_WIDTH, height: topHeight },
        HITBOX_CONFIG.pipe.body.insetXRatio,
        HITBOX_CONFIG.pipe.body.insetYRatio,
      ),
    );
  }
  if (viewportHeight - bottomY > 0) {
    rects.push(
      createInsetRectangle(
        {
          x: pipe.x,
          y: bottomY,
          width: PIPE_WIDTH,
          height: viewportHeight - bottomY,
        },
        HITBOX_CONFIG.pipe.body.insetXRatio,
        HITBOX_CONFIG.pipe.body.insetYRatio,
      ),
    );
  }
  return rects;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function resetRun(viewport: RunViewport): RunState {
  return {
    catY: viewport.height / 2,
    velocity: 0,
    pipes: [],
    score: 0,
    difficulty: 0,
    elapsed: 0,
    viewport,
    _nextPipeId: 0,
  };
}

export function stepRun(
  state: RunState,
  input: RunInput,
  dt: number,
): { state: RunState; events: RunEvent[] } {
  const events: RunEvent[] = [];
  let { catY, velocity, score, difficulty, elapsed, _nextPipeId } = state;
  const { viewport } = state;
  let pipes = [...state.pipes];

  const catX = getCatX(viewport);

  // --- Flap ---
  if (input.flap) {
    velocity = DEFAULT_CONFIG.flapStrength;
    events.push({ type: "flap" });
  }

  // --- Physics ---
  velocity = Math.min(
    velocity + DEFAULT_CONFIG.gravity * dt,
    DEFAULT_CONFIG.terminalVelocity,
  );
  catY += velocity * dt;

  // --- Elapsed & difficulty ramp ---
  // dt is in Pixi delta frames; convert to ms for elapsed (10 s = 10000 ms)
  elapsed += dt * (1000 / 60);
  const targetDifficulty = Math.floor(elapsed / 10000);
  if (targetDifficulty > difficulty) difficulty = targetDifficulty;

  // --- Pipe motion ---
  const pipeSpeed = computePipeSpeed(score, difficulty);
  pipes = pipes.map((pipe) => ({ ...pipe, x: pipe.x - pipeSpeed * dt }));

  // --- Scoring & near-miss ---
  const newlyScored = new Set<number>();
  for (const pipe of pipes) {
    if (!pipe.scored && pipe.x + PIPE_WIDTH < catX) {
      newlyScored.add(pipe.id);
      score += 1;
      events.push({ type: "scored", score });

      const topEdge = pipe.centerY - pipe.gap / 2;
      const bottomEdge = pipe.centerY + pipe.gap / 2;
      const minDist = Math.min(catY - topEdge, bottomEdge - catY);
      if (minDist > 0 && minDist < NEAR_MISS_THRESHOLD) {
        events.push({ type: "near-miss" });
      }
    }
  }
  pipes = pipes.map((pipe) =>
    newlyScored.has(pipe.id) ? { ...pipe, scored: true } : pipe,
  );

  // --- Remove off-screen pipes ---
  pipes = pipes.filter((pipe) => pipe.x > -PIPE_WIDTH * 2);

  // --- Spawn new pipe ---
  const spacing = computePipeSpacing(score, difficulty);
  const lastPipe = pipes[pipes.length - 1];
  if (
    (!lastPipe || lastPipe.x < viewport.width - spacing) &&
    input.spawnCenterY !== undefined
  ) {
    const gap = computePipeGap(score, difficulty);
    pipes = [
      ...pipes,
      {
        id: _nextPipeId++,
        x: viewport.width + 100,
        centerY: input.spawnCenterY,
        gap,
        scored: false,
      },
    ];
  }

  // --- Collision: ceiling / floor ---
  const catHitbox = getCatHitbox(catX, catY);
  const ceilingZone = getCeilingZone(viewport.width);
  const floorZone = getFloorZone(viewport.width, viewport.height);

  if (
    intersects(catHitbox, ceilingZone) ||
    intersects(catHitbox, floorZone)
  ) {
    events.push({ type: "death", x: catX, y: catY });
    return {
      state: {
        catY,
        velocity,
        pipes,
        score,
        difficulty,
        elapsed,
        viewport,
        _nextPipeId,
      },
      events,
    };
  }

  // --- Collision: pipes ---
  for (const pipe of pipes) {
    const hitboxes = getPipeHitboxes(pipe, viewport.height);
    if (hitboxes.some((h) => intersects(catHitbox, h))) {
      events.push({ type: "death", x: catX, y: catY });
      return {
        state: {
          catY,
          velocity,
          pipes,
          score,
          difficulty,
          elapsed,
          viewport,
          _nextPipeId,
        },
        events,
      };
    }
  }

  return {
    state: {
      catY,
      velocity,
      pipes,
      score,
      difficulty,
      elapsed,
      viewport,
      _nextPipeId,
    },
    events,
  };
}
