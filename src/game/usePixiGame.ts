import { useCallback, useEffect, useRef } from "react";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import type { Ticker } from "pixi.js";
import { DEFAULT_CONFIG } from "./types";
import { useGame } from "../context/useGameContext";
import type { GameStatus } from "../context/types";
import { getRandomQuestion } from "../data/icebreakers";
import { usePixiInputs } from "../hooks/usePixiInputs";

type PipePair = Container & {
  gap: number;
  scored?: boolean;
};

type PipeChild = Sprite | TilingSprite | Graphics;

const rainbowColors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"];

const PIPE_CAP_SOURCE = { width: 284, height: 439 } as const;
const PIPE_BODY_SOURCE = { width: 304, height: 442 } as const;
const CAT_SOURCE_WIDTH = 384;
const CAT_TARGET_WIDTH = 96;
const CAT_SCALE = CAT_TARGET_WIDTH / CAT_SOURCE_WIDTH;

const HITBOX_CONFIG = {
  cat: {
    widthScale: 0.6,
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

const DEBUG_COLORS = {
  cat: 0x10b981,
  pipe: 0xef4444,
  bounds: 0x3b82f6,
} as const;

const getConstrainedWidth = () => Math.min(window.innerWidth, 1000);

const getCatFrame = (status: GameStatus, velocity: number): number => {
  if (status === "idle") return 0;
  if (status === "over") return 3;
  if (velocity < -0.5) return 1;
  return 2;
};

const computePipeGap = (score: number, difficulty: number) =>
  Math.max(DEFAULT_CONFIG.pipe.gap - score * 2 - difficulty * 8, 120);
const computePipeSpeed = (score: number, difficulty: number) =>
  Math.min(DEFAULT_CONFIG.pipe.speed + score * 0.035 + difficulty * 0.2, 5.5);
const computePipeSpacing = (score: number, difficulty: number) =>
  Math.max(DEFAULT_CONFIG.pipe.spacing - score * 1.2 - difficulty * 12, 210);

const intersects = (a: Rectangle, b: Rectangle) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const createInsetRectangle = (
  bounds: Rectangle,
  insetXRatio = 0,
  insetYRatio = 0,
) => {
  const insetX = bounds.width * insetXRatio;
  const insetY = bounds.height * insetYRatio;
  return new Rectangle(
    bounds.x + insetX / 2,
    bounds.y + insetY / 2,
    Math.max(0, bounds.width - insetX),
    Math.max(0, bounds.height - insetY),
  );
};

const getCatHitbox = (cat: Sprite) => {
  const width = cat.width * HITBOX_CONFIG.cat.widthScale;
  const height = cat.height * HITBOX_CONFIG.cat.heightScale;
  const offsetY = cat.height * HITBOX_CONFIG.cat.offsetYScale;
  return new Rectangle(
    cat.x - width / 2,
    cat.y - height / 2 + offsetY,
    width,
    height,
  );
};

const getPipeHitbox = (child: PipeChild) => {
  const bounds = new Rectangle().copyFromBounds(child.getBounds());
  const config = child.name?.includes("cap")
    ? HITBOX_CONFIG.pipe.cap
    : HITBOX_CONFIG.pipe.body;
  return createInsetRectangle(
    bounds,
    config?.insetXRatio ?? 0,
    config?.insetYRatio ?? 0,
  );
};

const getFloorZone = (width: number, height: number) =>
  new Rectangle(
    0,
    Math.max(0, height - HITBOX_CONFIG.bounds.floor),
    width,
    HITBOX_CONFIG.bounds.floor,
  );

const getCeilingZone = (width: number) =>
  new Rectangle(0, 0, width, HITBOX_CONFIG.bounds.ceiling);

const drawHitbox = (
  graphics: Graphics,
  rect: Rectangle,
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
  const floorRectRef = useRef<Rectangle | null>(null);
  const ceilingRectRef = useRef<Rectangle | null>(null);
  const velocityRef = useRef(0);
  const scoreRef = useRef(0);
  const lastReportedScoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const difficultyRef = useRef(0);

  const {
    status,
    answered,
    end,
    setLiveScore,
    start,
    debugEnabled,
    toggleDebug,
  } = useGame();

  const statusRef = useRef<GameStatus>(status);
  const answeredRef = useRef(answered);
  const endRef = useRef(end);
  const setLiveScoreRef = useRef(setLiveScore);
  const startRef = useRef(start);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

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

  const syncLiveScore = useCallback(() => {
    if (statusRef.current !== "running") return;
    if (lastReportedScoreRef.current !== scoreRef.current) {
      lastReportedScoreRef.current = scoreRef.current;
      setLiveScoreRef.current?.(scoreRef.current);
    }
  }, []);

  const handleFlap = useCallback(() => {
    if (statusRef.current === "idle") {
      startRef.current?.();
      statusRef.current = "running";
      elapsedRef.current = 0;
      difficultyRef.current = 0;
    }
    if (statusRef.current !== "running") return;
    velocityRef.current = DEFAULT_CONFIG.flapStrength;
  }, []);

  const handleToggleDebug = useCallback(() => {
    toggleDebug();
  }, [toggleDebug]);

  usePixiInputs({ onFlap: handleFlap, onToggleDebug: handleToggleDebug });

  const loadCatSprite = useCallback(async () => {
    const catTexture = await Assets.load("/src/assets/sprites/cat.png");

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
    const pipeTexture = await Assets.load(
      "/src/assets/pipes/pipes_cap_middle.png",
    );

    const capTexture = new Texture({
      source: pipeTexture.source,
      frame: new Rectangle(180, 99, 284, 439),
    });

    const middleTexture = new Texture({
      source: pipeTexture.source,
      frame: new Rectangle(180, 438, 304, 442),
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
    topCap.scale.set(capScale);
    topCap.position.set(0, Math.max(0, topPipeHeight - capHeight));
    topCap.name = "pipe-cap-top";
    container.addChild(topCap);

    // Bottom pipe
    const bottomStart = Math.min(rendererHeight - capHeight, centerY + gap / 2);
    const bottomPipeHeight = Math.max(capHeight, rendererHeight - bottomStart);
    const bottomMiddleHeight = Math.max(0, bottomPipeHeight - capHeight);

    const bottomCap = new Sprite(textures.capTexture);
    bottomCap.scale.set(capScale, -capScale);
    bottomCap.position.set(0, bottomStart + bottomPipeHeight);
    bottomCap.name = "pipe-cap-bottom";
    container.addChild(bottomCap);

    if (bottomMiddleHeight > 0) {
      const bottomMiddle = new TilingSprite(
        textures.middleTexture,
        pipeWidth,
        bottomMiddleHeight,
      );
      bottomMiddle.tileScale.set(bodyScale, bodyScale);
      bottomMiddle.position.set(0, bottomStart);
      bottomMiddle.name = "pipe-body-bottom";
      container.addChild(bottomMiddle);
    }

    container.x = rendererWidth + 100;
    container.y = 0;

    return container;
  }, []);

  const checkPipeCollision = useCallback(
    (catHitbox: Rectangle, pipe: PipePair) =>
      pipe.children.some((child) =>
        intersects(catHitbox, getPipeHitbox(child as PipeChild)),
      ),
    [],
  );

  const resetGame = useCallback(() => {
    velocityRef.current = 0;
    scoreRef.current = 0;
    lastReportedScoreRef.current = 0;
    elapsedRef.current = 0;
    difficultyRef.current = 0;
    if (catRef.current) {
      catRef.current.position.set(
        getConstrainedWidth() * 0.2,
        window.innerHeight / 2,
      );
      catRef.current.rotation = 0;
    }
    if (pipesRef.current) {
      pipesRef.current.removeChildren();
    }
    syncLiveScore();
  }, [syncLiveScore]);

  const handleGameOver = useCallback(() => {
    const question = getRandomQuestion(answeredRef.current);
    endRef.current?.(scoreRef.current, question);
    resetGame();
  }, [resetGame]);

  const updateGame = useCallback(
    (ticker: Ticker) => {
      const delta = ticker.deltaTime;
      const cat = catRef.current;
      const pipes = pipesRef.current;
      const app = appRef.current;
      const trail = trailRef.current;
      const background = backgroundRef.current;
      if (!cat || !pipes || !app || !trail) return;
      if (statusRef.current !== "running") return;

      elapsedRef.current += ticker.deltaMS;
      const targetDifficulty = Math.floor(elapsedRef.current / 10000);
      if (targetDifficulty > difficultyRef.current) {
        difficultyRef.current = targetDifficulty;
      }

      const difficulty = difficultyRef.current;

      velocityRef.current += DEFAULT_CONFIG.gravity * delta;
      velocityRef.current = Math.min(
        velocityRef.current,
        DEFAULT_CONFIG.terminalVelocity,
      );
      cat.y += velocityRef.current * delta;

      // Update cat sprite frame based on state
      const frameIndex = getCatFrame(statusRef.current, velocityRef.current);
      if (catFramesRef.current[frameIndex]) {
        cat.texture = catFramesRef.current[frameIndex];
      }

      const ceilingZone =
        ceilingRectRef.current ?? getCeilingZone(app.renderer.width);
      const floorZone =
        floorRectRef.current ??
        getFloorZone(app.renderer.width, app.renderer.height);
      ceilingRectRef.current = ceilingZone;
      floorRectRef.current = floorZone;

      const catHitbox = getCatHitbox(cat);
      if (
        intersects(catHitbox, ceilingZone) ||
        intersects(catHitbox, floorZone)
      ) {
        handleGameOver();
        return;
      }

      if (background) {
        background.alpha = 0.85 + 0.05 * Math.sin(performance.now() / 700);
      }

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

      const pipeSpeed = computePipeSpeed(scoreRef.current, difficulty);
      const spacing = computePipeSpacing(scoreRef.current, difficulty);
      const pipePairs = pipes.children as PipePair[];

      for (let i = pipePairs.length - 1; i >= 0; i -= 1) {
        const pipe = pipePairs[i];
        pipe.x -= pipeSpeed * delta;

        if (!pipe.scored && pipe.x + DEFAULT_CONFIG.pipe.width < cat.x) {
          pipe.scored = true;
          scoreRef.current += 1;
          syncLiveScore();
        }

        if (pipe.x < -DEFAULT_CONFIG.pipe.width * 2) {
          pipes.removeChild(pipe);
        }
      }

      const lastPipe = pipePairs[pipePairs.length - 1];
      if (!lastPipe || lastPipe.x < getConstrainedWidth() - spacing) {
        const gap = computePipeGap(scoreRef.current, difficulty);
        const y =
          DEFAULT_CONFIG.pipe.minY +
          Math.random() * (DEFAULT_CONFIG.pipe.maxY - DEFAULT_CONFIG.pipe.minY);
        pipes.addChild(createPipePair(y, gap));
      }

      const hasCollision = pipePairs.some((pipe) =>
        checkPipeCollision(catHitbox, pipe),
      );
      if (hasCollision) {
        handleGameOver();
      }

      // Debug mode: draw hitboxes
      const debugGraphics = debugGraphicsRef.current;
      if (debugGraphics) {
        debugGraphics.clear();
        if (debugModeRef.current) {
          drawHitbox(debugGraphics, catHitbox, DEBUG_COLORS.cat);
          pipePairs.forEach((pipe) => {
            pipe.children.forEach((child) => {
              drawHitbox(
                debugGraphics,
                getPipeHitbox(child as PipeChild),
                DEBUG_COLORS.pipe,
                0.1,
              );
            });
          });
          drawHitbox(debugGraphics, floorZone, DEBUG_COLORS.bounds, 0.08);
          drawHitbox(debugGraphics, ceilingZone, DEBUG_COLORS.bounds, 0.08);
        }
      }
    },
    [checkPipeCollision, createPipePair, handleGameOver, syncLiveScore],
  );

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

      app.ticker.add(updateGame);
    };

    initialize();

    const handleResize = () => {
      if (!app.renderer) return;
      const width = getConstrainedWidth();
      const height = window.innerHeight;
      app.renderer.resize(width, height);

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
      appRef.current = null;
      app.destroy(true);
      destroyed = true;
    };
  }, [createBackground, loadCatSprite, loadPipeSprite, updateGame]);

  return { canvasRef };
};
