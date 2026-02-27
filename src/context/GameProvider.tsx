import { GameContext } from './gameContext'
import { useGameState } from './useGameState'

export function GameProvider({ children }: { children: React.ReactNode }) {
  const value = useGameState()
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
