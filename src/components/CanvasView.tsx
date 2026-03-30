import { usePixiGame } from "../game/usePixiGame";

export const CanvasView = () => {
  const { canvasRef } = usePixiGame();

  return <div ref={canvasRef} className="relative h-full w-full" />;
};
