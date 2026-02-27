import { createContext } from 'react'
import type { GameContextValue } from './types'

export const GameContext = createContext<GameContextValue | null>(null)
