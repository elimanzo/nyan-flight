import { useContext } from 'react'
import { GameContext } from './gameContext'

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
