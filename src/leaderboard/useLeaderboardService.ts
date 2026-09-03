import { useContext } from 'react'
import { LeaderboardContext } from './leaderboardContext'

export function useLeaderboardService() {
  const ctx = useContext(LeaderboardContext)
  if (!ctx) throw new Error('useLeaderboardService must be inside LeaderboardProvider')
  return ctx
}
