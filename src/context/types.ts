export type GameStatus = "idle" | "running" | "paused" | "over";

export type GameContextValue = {
  status: GameStatus;
  score: number;
  bestScore: number;
  lastQuestion?: string;
  answered: string[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: (score: number, question: string) => void;
  restart: () => void;
  setLiveScore: (value: number) => void;
  debugEnabled: boolean;
  toggleDebug: () => void;
};
