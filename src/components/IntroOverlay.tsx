import { useGame } from "../context/useGameContext";

export const IntroOverlay = () => {
  const { status, start } = useGame();

  if (status !== "idle") return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-black/70 via-black/40 to-transparent text-center text-white">
      <p className="text-xs uppercase tracking-[0.45em] text-white/50">
        Nyan flight
      </p>
      <h1 className="mt-4 text-4xl font-semibold">
        Fly with your cat, dodge the void
      </h1>
      <p className="mt-3 max-w-xl text-base text-white/80">
        Guide the cosmic cat through neon tunnels. Crash into a pipe and we
        surface a quirky challenge.
      </p>
      <button
        className="mt-6 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white backdrop-blur transition hover:bg-white/20"
        onClick={start}
      >
        Tap or press space to lift off
      </button>
    </div>
  );
};
