export type GameStatus = "idle" | "running" | "paused" | "over";

export type GameContextValue = {
  status: GameStatus;
  score: number;
  bestScore: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: (score: number) => void;
  restart: () => void;
  setLiveScore: (value: number) => void;
  debugEnabled: boolean;
  toggleDebug: () => void;
};
