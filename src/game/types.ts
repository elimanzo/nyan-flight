export type Vector2D = {
  x: number;
  y: number;
};

export type PipeConfig = {
  gap: number;
  width: number;
  spacing: number;
  speed: number;
  minY: number;
  maxY: number;
};

export type GameConfig = {
  gravity: number;
  flapStrength: number;
  terminalVelocity: number;
  pipe: PipeConfig;
};

export type CatState = {
  position: Vector2D;
  velocity: Vector2D;
};

export const DEFAULT_CONFIG: GameConfig = {
  gravity: 0.25,
  flapStrength: -4.8,
  terminalVelocity: 8,
  pipe: {
    gap: 200,
    width: 80,
    spacing: 250,
    speed: 2.8,
    minY: 80,
    maxY: 360,
  },
};
