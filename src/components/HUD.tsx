import { BugPlay, Settings } from "lucide-react";
import { ScorePanel } from "./ScorePanel";
import { useGame } from "../context/useGameContext";

type Props = {
  onOpenSettings: () => void;
};

export const HUD = ({ onOpenSettings }: Props) => {
  const { debugEnabled, toggleDebug } = useGame();
  const isDev = import.meta.env.DEV;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-6">
      <div className="flex justify-center">
        <ScorePanel />
      </div>
      <div className="pointer-events-auto absolute right-6 top-6 flex flex-col items-end gap-3">
        <button
          aria-label="Open settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-white/50"
          onClick={onOpenSettings}
        >
          <Settings className="h-5 w-5" />
        </button>
        {isDev && (
          <button
            aria-pressed={debugEnabled}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-cosmic-400/40 bg-black/60 text-cosmic-200 transition hover:border-cosmic-300 hover:text-white"
            onClick={() => toggleDebug()}
          >
            <BugPlay className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
