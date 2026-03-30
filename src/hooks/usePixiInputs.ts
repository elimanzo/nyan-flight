import { useEffect } from "react";
import { useGame } from "../context/useGameContext";

type Props = {
  onFlap: () => void;
  onToggleDebug?: () => void;
};

export const usePixiInputs = ({ onFlap, onToggleDebug }: Props) => {
  const { status, pause, resume } = useGame();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        onFlap();
      }
      if (event.code === "Escape") {
        if (status === "running") pause();
        else if (status === "paused") resume();
      }
      if (event.code === "KeyD") {
        onToggleDebug?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onFlap, onToggleDebug, pause, resume, status]);

  useEffect(() => {
    const handlePointer = () => onFlap();
    window.addEventListener("pointerdown", handlePointer);
    return () => window.removeEventListener("pointerdown", handlePointer);
  }, [onFlap]);
};
