import { useCallback, useMemo, useState } from "react";

import { readBestScore, writeBestScore } from "../leaderboard/bestScore";
import type { GameContextValue, GameStatus } from "./types";

export const useGameState = (): GameContextValue => {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => readBestScore());
  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("nyan-debug-enabled");
    return stored ? stored === "true" : false;
  });

  const start = useCallback(() => {
    setScore(0);
    setStatus("running");
  }, []);

  const pause = useCallback(() => {
    setStatus((prev) => (prev === "running" ? "paused" : prev));
  }, []);

  const resume = useCallback(() => {
    setStatus((prev) => (prev === "paused" ? "running" : prev));
  }, []);

  const end = useCallback((finalScore: number) => {
    setScore(finalScore);
    setBestScore((prev) => {
      const next = Math.max(prev, finalScore);
      writeBestScore(next);
      return next;
    });
    setStatus("over");
  }, []);

  const restart = useCallback(() => {
    setScore(0);
    setStatus("running");
  }, []);

  const setLiveScore = useCallback((value: number) => {
    setScore(value);
  }, []);

  const toggleDebug = useCallback(() => {
    setDebugEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("nyan-debug-enabled", String(next));
      }
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      status,
      score,
      bestScore,
      start,
      pause,
      resume,
      end,
      restart,
      setLiveScore,
      debugEnabled,
      toggleDebug,
    }),
    [
      status,
      score,
      bestScore,
      start,
      pause,
      resume,
      end,
      restart,
      setLiveScore,
      debugEnabled,
      toggleDebug,
    ],
  );
};
