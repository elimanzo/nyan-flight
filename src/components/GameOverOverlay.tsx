import { AnimatePresence, motion } from "framer-motion";
import { getMedal, MEDAL_DEFS } from "../utils/medals";
import { useGame } from "../context/useGameContext";

type Props = {
  open: boolean;
};

export const GameOverOverlay = ({ open }: Props) => {
  const { score, bestScore, restart } = useGame();
  const medal = getMedal(score);
  const isNewBest = score > 0 && score > bestScore;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#120627]/90 p-8 text-center text-white shadow-2xl backdrop-blur"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Run over
            </p>

            {medal && (
              <motion.div
                className="mt-4 flex flex-col items-center gap-1"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
              >
                <span className="text-5xl">{MEDAL_DEFS[medal].emoji}</span>
                <span
                  className="mt-1 text-sm font-semibold uppercase tracking-widest"
                  style={{ color: MEDAL_DEFS[medal].color }}
                >
                  {MEDAL_DEFS[medal].label}
                </span>
              </motion.div>
            )}

            <div className="mt-6 flex justify-center gap-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Score
                </p>
                <p className="text-4xl font-bold text-white">{score}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Best
                </p>
                <p className="text-4xl font-bold text-yellow-300">{bestScore}</p>
                {isNewBest && (
                  <p className="mt-0.5 text-xs font-semibold text-yellow-300/80">
                    New best!
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <button
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#120627] transition hover:bg-white/90"
                onClick={restart}
              >
                Retry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
