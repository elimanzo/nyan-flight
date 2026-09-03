import { createContext } from 'react'
import type { LeaderboardService } from './LeaderboardService'

export const LeaderboardContext = createContext<LeaderboardService | null>(null)
