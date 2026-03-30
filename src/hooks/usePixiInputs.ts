import { useEffect } from "react";
import { useGame } from "../context/useGameContext";
import { useAudio } from "../context/useAudioContext";

type Props = {
  onFlap: () => void;
  onToggleDebug?: () => void;
};

export const usePixiInputs = ({ onFlap, onToggleDebug }: Props) => {
  const { status, pause, resume } = useGame();
  const { playJump } = useAudio();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        onFlap();
        if (status === "running") {
          playJump?.();
        }
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
  }, [onFlap, onToggleDebug, pause, playJump, resume, status]);

  useEffect(() => {
    const handlePointer = () => {
      onFlap();
      if (status === "running") {
        playJump?.();
      }
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => window.removeEventListener("pointerdown", handlePointer);
  }, [onFlap, playJump, status]);
};
