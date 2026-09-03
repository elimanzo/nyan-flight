import { useCallback, useEffect, useRef } from "react";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  TilingSprite,
} from "pixi.js";
import type { Ticker } from "pixi.js";
import { DEFAULT_CONFIG } from "./types";
import {
  type Rect,
  HITBOX_CONFIG,
  createInsetRectangle,
  getCeilingZone,
  getFloorZone,
} from "./runGeometry";
import {
  type RunState,
  type RunInput,
  type PipePairState,
  resetRun,
  stepRun,
} from "./stepRun";
import { useGame } from "../context/useGameContext";
import type { GameStatus } from "../context/types";
import { usePixiInputs } from "../hooks/usePixiInputs";
import catSpriteUrl from "../assets/sprites/cat.png";
import pipeSpriteUrl from "../assets/pipes/pipes_cap_middle.png";
import { useAudio } from "../context/useAudioContext";

type PipePair = Container & {
  gap: number;
  centerY: number;
  scored?: boolean;
};

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  color: number;
  size: number;
  life: number;
};

type ScoreFlash = {
  text: Text;
  vy: number;
  life: number;
  totalLife: number;
};

type PipeChild = Sprite | TilingSprite | Graphics;

const rainbowColors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"];

const PIPE_CAP_SOURCE = { width: 181, height: 278 } as const;
const PIPE_BODY_SOURCE = { width: 181, height: 278 } as const;
const CAT_SOURCE_WIDTH = 384;
const CAT_TARGET_WIDTH = 96;
const CAT_SCALE = CAT_TARGET_WIDTH / CAT_SOURCE_WIDTH;
const SHAKE_DURATION = 22;
const SHAKE_MAX = 10;
const PARTICLE_GRAVITY = 0.18;
const PARTICLE_BASE_LIFE = 40;
const PARTICLE_LIFE_JITTER = 20;
const PARTICLE_SPEED_MIN = 2;
const PARTICLE_SPEED_JITTER = 4.5;
const PARTICLE_SIZE_MIN = 3;
const PARTICLE_SIZE_JITTER = 5;
const SCORE_FLASH_LIFE = 40;
const CAT_FADE_DURATION = 25;
const SCORE_FLASH_VY = -1.8;
const SCORE_FLASH_STYLE = { fill: '#ffffff', fontSize: 22, fontWeight: 'bold', dropShadow: true, dropShadowDistance: 2 } as const;

const DEBUG_COLORS = {
  cat: 0x10b981,
  pipe: 0xef4444,
  bounds: 0x3b82f6,
} as const;

const VIEWPORT_MAX_WIDTH = 1000;
const getConstrainedWidth = () =>
  Math.min(window.innerWidth, VIEWPORT_MAX_WIDTH);

const setCanvasAlignment = (canvas: HTMLCanvasElement) => {
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
};

const getCatFrame = (status: GameStatus, velocity: number): number => {
  if (status === "idle") return 0;
  if (status === "over") return 3;
  if (velocity < -0.5) return 1;
  return 2;
};

const getCatHitbox = (cat: Sprite): Rect => {
  const width = cat.width * HITBOX_CONFIG.cat.widthScale;
  const height = cat.height * HITBOX_CONFIG.cat.heightScale;
  const offsetY = cat.height * HITBOX_CONFIG.cat.offsetYScale;
  return {
    x: cat.x - width / 2,
    y: cat.y - height / 2 + offsetY,
    width,
    height,
  };
};

const getPipeHitbox = (child: PipeChild): Rect => {
  const b = child.getBounds();
  const bounds: Rect = { x: b.x, y: b.y, width: b.width, height: b.height };
  const config = child.name?.includes("cap")
    ? HITBOX_CONFIG.pipe.cap
    : HITBOX_CONFIG.pipe.body;
  return createInsetRectangle(
    bounds,
    config?.insetXRatio ?? 0,
    config?.insetYRatio ?? 0,
  );
};

const drawHitbox = (
  graphics: Graphics,
  rect: Rect,
  color: number,
  alpha = 0.12,
) => {
  graphics.lineStyle(1.5, color, 0.9);
  graphics.beginFill(color, alpha);
  graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
  graphics.endFill();
};

export const usePixiGame = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const catRef = useRef<Sprite | null>(null);
  const catFramesRef = useRef<Texture[]>([]);
  const pipeTexturesRef = useRef<{
    capTexture: Texture;
    middleTexture: Texture;
  } | null>(null);
  const trailRef = useRef<Graphics | null>(null);
  const pipesRef = useRef<Container | null>(null);
  const backgroundRef = useRef<Graphics | null>(null);
  const debugGraphicsRef = useRef<Graphics | null>(null);
  const debugModeRef = useRef(false);
  const runStateRef = useRef<RunState | null>(null);
  const flapPendingRef = useRef(false);
  const pixiPipeMapRef = useRef<Map<number, PipePair>>(new Map());
  const shakeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const particleGraphicsRef = useRef<Graphics | null>(null);
  const scoreFlashesRef = useRef<ScoreFlash[]>([]);
  const catFadeRef = useRef(0);

  const {
    status,
    end,
    setLiveScore,
    start,
    debugEnabled,
    toggleDebug,
  } = useGame();
  const { playPipe, playDeath, playNearMiss } = useAudio();
  const playNearMissRef = useRef(playNearMiss);

  const statusRef = useRef<GameStatus>(status);
  const prevStatusRef = useRef<GameStatus>(status);
  const endRef = useRef(end);
  const setLiveScoreRef = useRef(setLiveScore);
  const startRef = useRef(start);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    setLiveScoreRef.current = setLiveScore;
  }, [setLiveScore]);

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    debugModeRef.current = debugEnabled;
  }, [debugEnabled]);

  useEffect(() => {
    playNearMissRef.current = playNearMiss;
  }, [playNearMiss]);

  const handleFlap = useCallback(() => {
    if (statusRef.current === "idle") {
      startRef.current?.();
      statusRef.current = "running";
      const app = appRef.current;
      if (app) {
        runStateRef.current = resetRun({
          width: app.renderer.width,
          height: app.renderer.height,
        });
      }
    }
    if (statusRef.current !== "running") return;
    flapPendingRef.current = true;
  }, []);

  const handleToggleDebug = useCallback(() => {
    toggleDebug();
  }, [toggleDebug]);

  usePixiInputs({ onFlap: handleFlap, onToggleDebug: handleToggleDebug });

  const loadCatSprite = useCallback(async () => {
    const catTexture = await Assets.load(catSpriteUrl);

    const frames = [
      new Texture({
        source: catTexture.source,
        frame: new Rectangle(0, 0, 384, 1024),
      }), // Idle
      new Texture({
        source: catTexture.source,
        frame: new Rectangle(384, 0, 384, 1024),
      }), // Jump
      new Texture({
        source: catTexture.source,
        frame: new Rectangle(768, 0, 384, 1024),
      }), // Float
      new Texture({
        source: catTexture.source,
        frame: new Rectangle(1152, 0, 384, 1024),
      }), // Dead
    ];

    return frames;
  }, []);

  const loadPipeSprite = useCallback(async () => {
    const pipeTexture = await Assets.load(pipeSpriteUrl);

    const capTexture = new Texture({
      source: pipeTexture.source,
      frame: new Rectangle(180, 100, 181, 278),
    });

    const middleTexture = new Texture({
      source: pipeTexture.source,
      frame: new Rectangle(180, 438, 181, 278),
    });

    return { capTexture, middleTexture };
  }, []);

  const createBackground = useCallback(() => {
    const bg = new Graphics();
    const width = getConstrainedWidth();
    const height = window.innerHeight;
    for (let i = 0; i < 110; i += 1) {
      const color = Math.random() > 0.5 ? 0xffffff : 0xfef3c7;
      const size = Math.random() * 2.5 + 0.5;
      const x = Math.random() * width;
      const y = Math.random() * height;
      bg.circle(x, y, size).fill({ color, alpha: Math.random() * 0.8 });
    }
    return bg;
  }, []);

  const createPipePair = useCallback((centerY: number, gap: number) => {
    const container = new Container() as PipePair;
    container.gap = gap;
    container.centerY = centerY;

    const textures = pipeTexturesRef.current;
    const rendererHeight =
      appRef.current?.renderer.height ?? window.innerHeight;
    const rendererWidth =
      appRef.current?.renderer.width ?? getConstrainedWidth();
    if (!textures) {
      // Fallback to Graphics if textures not loaded yet
      const width = DEFAULT_CONFIG.pipe.width;
      const topHeight = Math.max(24, centerY - gap / 2);
      const bottomY = Math.min(rendererHeight - 24, centerY + gap / 2);
      const bottomHeight = Math.max(24, rendererHeight - bottomY);

      const topPipe = new Graphics();
      topPipe.roundRect(0, 0, width, topHeight, 18).fill({ color: 0x1e1b4b });
      topPipe.name = "pipe-body-top";

      const bottomPipe = new Graphics();
      bottomPipe
        .roundRect(0, bottomY, width, bottomHeight + 40, 18)
        .fill({ color: 0x312e81 });
      bottomPipe.name = "pipe-body-bottom";

      container.addChild(topPipe, bottomPipe);
      container.x = rendererWidth + 100;
      container.y = 0;
      return container;
    }

    const pipeWidth = DEFAULT_CONFIG.pipe.width;
    const capScale = pipeWidth / PIPE_CAP_SOURCE.width;
    const bodyScale = pipeWidth / PIPE_BODY_SOURCE.width;
    const capHeight = PIPE_CAP_SOURCE.height * capScale;

    // Top pipe
    const rawTopHeight = centerY - gap / 2;
    const topPipeHeight = Math.max(capHeight, rawTopHeight);
    const topMiddleHeight = Math.max(0, topPipeHeight - capHeight);

    if (topMiddleHeight > 0) {
      const topMiddle = new TilingSprite(
        textures.middleTexture,
        pipeWidth,
        topMiddleHeight,
      );
      topMiddle.tileScale.set(bodyScale, bodyScale);
      topMiddle.position.set(0, 0);
      topMiddle.name = "pipe-body-top";
      container.addChild(topMiddle);
    }

    const topCap = new Sprite(textures.capTexture);
    topCap.scale.set(capScale, -capScale);
    topCap.position.set(0, topPipeHeight);
    topCap.name = "pipe-cap-top";
    container.addChild(topCap);

    // Bottom pipe
    const bottomStart = Math.min(rendererHeight - capHeight, centerY + gap / 2);
    const bottomPipeHeight = Math.max(capHeight, rendererHeight - bottomStart);
    const bottomMiddleHeight = Math.max(0, bottomPipeHeight - capHeight);

    const bottomCap = new Sprite(textures.capTexture);
    bottomCap.scale.set(capScale);
    bottomCap.position.set(0, bottomStart);
    bottomCap.name = "pipe-cap-bottom";
    container.addChild(bottomCap);

    if (bottomMiddleHeight > 0) {
      const bottomMiddle = new TilingSprite(
        textures.middleTexture,
        pipeWidth,
        bottomMiddleHeight,
      );
      bottomMiddle.tileScale.set(bodyScale, bodyScale);
      bottomMiddle.position.set(0, bottomStart + capHeight);
      bottomMiddle.name = "pipe-body-bottom";
      container.addChild(bottomMiddle);
    }

    container.x = rendererWidth + 100;
    container.y = 0;

    return container;
  }, []);

  const resetGame = useCallback(() => {
    shakeRef.current = 0;
    const app = appRef.current;
    if (app) {
      app.stage.x = 0;
      app.stage.y = 0;
      for (const f of scoreFlashesRef.current) {
        app.stage.removeChild(f.text);
        f.text.destroy();
      }
      runStateRef.current = resetRun({
        width: app.renderer.width,
        height: app.renderer.height,
      });
    }
    scoreFlashesRef.current = [];
    catFadeRef.current = 0;
    if (catRef.current) {
      catRef.current.alpha = 1;
      catRef.current.position.set(
        getConstrainedWidth() * 0.2,
        window.innerHeight / 2,
      );
      catRef.current.rotation = 0;
    }
    if (pipesRef.current) {
      pipesRef.current.removeChildren();
    }
    pixiPipeMapRef.current.clear();
    setLiveScoreRef.current?.(0);
  }, []);

  const spawnDeathParticles = useCallback((x: number, y: number) => {
    const colors = [0xf87171, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = PARTICLE_SPEED_MIN + Math.random() * PARTICLE_SPEED_JITTER;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1,
        color: colors[i % colors.length],
        size: PARTICLE_SIZE_MIN + Math.random() * PARTICLE_SIZE_JITTER,
        life: PARTICLE_BASE_LIFE + Math.random() * PARTICLE_LIFE_JITTER,
      });
    }
  }, []);

  const updateGame = useCallback(
    (ticker: Ticker) => {
      const delta = ticker.deltaTime;
      const cat = catRef.current;
      const pipes = pipesRef.current;
      const app = appRef.current;
      const trail = trailRef.current;
      const background = backgroundRef.current;
      if (!cat || !pipes || !app || !trail) return;

      // --- Juice: always update, even when not running ---
      if (shakeRef.current > 0) {
        shakeRef.current -= delta;
        const t = Math.max(0, shakeRef.current / SHAKE_DURATION);
        const intensity = t * SHAKE_MAX;
        app.stage.x = (Math.random() * 2 - 1) * intensity;
        app.stage.y = (Math.random() * 2 - 1) * intensity;
      } else if (app.stage.x !== 0 || app.stage.y !== 0) {
        app.stage.x = 0;
        app.stage.y = 0;
      }

      const pg = particleGraphicsRef.current;
      if (pg) {
        pg.clear();
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.vy += PARTICLE_GRAVITY * delta;
          p.life -= delta;
          p.alpha = Math.max(0, p.life / (PARTICLE_BASE_LIFE + PARTICLE_LIFE_JITTER / 2));
          pg.beginFill(p.color, p.alpha);
          pg.drawCircle(p.x, p.y, p.size);
          pg.endFill();
          if (p.life <= 0) particlesRef.current.splice(i, 1);
        }
      }

      for (let i = scoreFlashesRef.current.length - 1; i >= 0; i--) {
        const f = scoreFlashesRef.current[i];
        f.text.y += f.vy * delta;
        f.life -= delta;
        f.text.alpha = Math.max(0, f.life / f.totalLife);
        if (f.life <= 0) {
          app.stage.removeChild(f.text);
          f.text.destroy();
          scoreFlashesRef.current.splice(i, 1);
        }
      }
      if (catFadeRef.current > 0 && cat) {
        catFadeRef.current = Math.max(0, catFadeRef.current - delta);
        cat.alpha = catFadeRef.current / CAT_FADE_DURATION;
      }
      // --- End juice ---

      if (statusRef.current !== "running") return;

      const runState = runStateRef.current;
      if (!runState) return;

      // --- Build input ---
      const spawnCenterY =
        DEFAULT_CONFIG.pipe.minY +
        Math.random() * (DEFAULT_CONFIG.pipe.maxY - DEFAULT_CONFIG.pipe.minY);
      const input: RunInput = {
        flap: flapPendingRef.current,
        spawnCenterY,
      };
      flapPendingRef.current = false;

      // --- Step pure simulation ---
      const { state: newState, events } = stepRun(runState, input, delta);
      runStateRef.current = newState;

      // --- Dispatch events ---
      for (const event of events) {
        if (event.type === "scored") {
          playPipe?.();
          setLiveScoreRef.current?.(event.score);
          const flash = new Text({ text: "+1", style: SCORE_FLASH_STYLE });
          flash.anchor.set(0.5);
          flash.position.set(cat.x + 30, cat.y - 20);
          app.stage.addChild(flash);
          scoreFlashesRef.current.push({
            text: flash,
            vy: SCORE_FLASH_VY,
            life: SCORE_FLASH_LIFE,
            totalLife: SCORE_FLASH_LIFE,
          });
        } else if (event.type === "near-miss") {
          playNearMissRef.current?.();
        } else if (event.type === "death") {
          playDeath?.();
          spawnDeathParticles(event.x, event.y);
          shakeRef.current = SHAKE_DURATION;
          catFadeRef.current = CAT_FADE_DURATION;
          endRef.current?.(newState.score);
          return;
        }
      }

      // --- Render from RunState ---
      cat.y = newState.catY;
      const frameIndex = getCatFrame(statusRef.current, newState.velocity);
      if (catFramesRef.current[frameIndex]) {
        cat.texture = catFramesRef.current[frameIndex];
      }

      // Sync Pixi pipe containers from RunState.pipes
      const activeIds = new Set(newState.pipes.map((p: PipePairState) => p.id));
      for (const [id, container] of pixiPipeMapRef.current) {
        if (!activeIds.has(id)) {
          pipes.removeChild(container);
          pixiPipeMapRef.current.delete(id);
        }
      }
      for (const pipeSt of newState.pipes) {
        if (!pixiPipeMapRef.current.has(pipeSt.id)) {
          const container = createPipePair(pipeSt.centerY, pipeSt.gap);
          pixiPipeMapRef.current.set(pipeSt.id, container);
          pipes.addChild(container);
        }
        pixiPipeMapRef.current.get(pipeSt.id)!.x = pipeSt.x;
      }

      // Background pulse
      if (background) {
        background.alpha = 0.85 + 0.05 * Math.sin(performance.now() / 700);
      }

      // Trail
      trail.clear();
      for (let i = 0; i < rainbowColors.length; i += 1) {
        trail.lineStyle(
          8,
          parseInt(rainbowColors[i].replace("#", ""), 16),
          0.85 - i * 0.12,
        );
        trail.moveTo(cat.x - 60, cat.y + i * 7 - 14);
        trail.lineTo(cat.x - 160, cat.y + i * 7 - 14);
      }

      // Debug hitboxes
      const debugGraphics = debugGraphicsRef.current;
      if (debugGraphics) {
        debugGraphics.clear();
        if (debugModeRef.current) {
          const ceilingZone = getCeilingZone(app.renderer.width);
          const floorZone = getFloorZone(app.renderer.width, app.renderer.height);
          drawHitbox(debugGraphics, getCatHitbox(cat), DEBUG_COLORS.cat);
          for (const [, container] of pixiPipeMapRef.current) {
            container.children.forEach((child) => {
              drawHitbox(
                debugGraphics,
                getPipeHitbox(child as PipeChild),
                DEBUG_COLORS.pipe,
                0.1,
              );
            });
          }
          drawHitbox(debugGraphics, floorZone, DEBUG_COLORS.bounds, 0.08);
          drawHitbox(debugGraphics, ceilingZone, DEBUG_COLORS.bounds, 0.08);
        }
      }
    },
    [createPipePair, playDeath, playPipe, spawnDeathParticles],
  );

  useEffect(() => {
    if (status === "running" && prevStatusRef.current === "over") {
      resetGame();
    }
    prevStatusRef.current = status;
  }, [status, resetGame]);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host) return undefined;

    const app = new Application({
      sharedTicker: false,
    });
    let cancelled = false;
    let initialized = false;
    let destroyed = false;

    const initialize = async () => {
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
      });
      app.renderer.resize(getConstrainedWidth(), window.innerHeight);
      initialized = true;
      if (cancelled) {
        if (!destroyed) {
          app.destroy(true);
          destroyed = true;
        }
        return;
      }

      host.replaceChildren(app.canvas);
      setCanvasAlignment(app.canvas);
      appRef.current = app;

      const background = createBackground();
      backgroundRef.current = background;
      app.stage.addChild(background);

      const trail = new Graphics();
      trailRef.current = trail;
      app.stage.addChild(trail);

      const pipes = new Container();
      pipesRef.current = pipes;
      app.stage.addChild(pipes);

      const pipeTextures = await loadPipeSprite();
      pipeTexturesRef.current = pipeTextures;
      if (cancelled) {
        if (!destroyed) {
          app.destroy(true);
          destroyed = true;
        }
        return;
      }

      const catFrames = await loadCatSprite();
      catFramesRef.current = catFrames;
      if (cancelled) {
        if (!destroyed) {
          app.destroy(true);
          destroyed = true;
        }
        return;
      }

      const cat = new Sprite(catFrames[0]);
      cat.anchor.set(0.5);
      cat.scale.set(CAT_SCALE);
      cat.position.set(getConstrainedWidth() * 0.2, window.innerHeight / 2);
      catRef.current = cat;
      app.stage.addChild(cat);

      const debugGraphics = new Graphics();
      debugGraphicsRef.current = debugGraphics;
      app.stage.addChild(debugGraphics);

      const particleGraphics = new Graphics();
      particleGraphicsRef.current = particleGraphics;
      app.stage.addChild(particleGraphics);

      app.ticker.add(updateGame);
    };

    initialize();

    const handleResize = () => {
      if (!app.renderer) return;
      const width = getConstrainedWidth();
      const height = window.innerHeight;
      app.renderer.resize(width, height);
      setCanvasAlignment(app.canvas);

      const previousBackground = backgroundRef.current;
      if (previousBackground) {
        app.stage.removeChild(previousBackground);
        previousBackground.destroy();
      }

      const refreshedBackground = createBackground();
      backgroundRef.current = refreshedBackground;
      app.stage.addChildAt(refreshedBackground, 0);

      if (catRef.current) {
        catRef.current.position.set(width * 0.2, height / 2);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      if (!initialized || destroyed) {
        return;
      }
      app.ticker?.remove(updateGame);
      catRef.current = null;
      trailRef.current = null;
      pipesRef.current = null;
      backgroundRef.current = null;
      debugGraphicsRef.current = null;
      particleGraphicsRef.current = null;
      appRef.current = null;
      app.destroy(true);
      destroyed = true;
    };
  }, [createBackground, loadCatSprite, loadPipeSprite, updateGame]);

  return { canvasRef };
};
