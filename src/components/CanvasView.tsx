import { usePixiGame } from "../game/usePixiGame";

export const CanvasView = () => {
  const { canvasRef } = usePixiGame();

  return (
    <div
      ref={canvasRef}
      className="relative flex h-full w-full justify-start overflow-hidden"
    />
  );
};
