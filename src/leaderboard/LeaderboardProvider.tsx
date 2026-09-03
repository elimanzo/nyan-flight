import { LeaderboardContext } from './leaderboardContext'
import { LeaderboardService } from './LeaderboardService'
import { InMemoryLeaderboardSource } from './InMemoryLeaderboardSource'
import { SupabaseLeaderboardSource } from './SupabaseLeaderboardSource'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const defaultSource =
  url && key
    ? new SupabaseLeaderboardSource(url, key)
    : new InMemoryLeaderboardSource()

const defaultService = new LeaderboardService(defaultSource)

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  return (
    <LeaderboardContext.Provider value={defaultService}>
      {children}
    </LeaderboardContext.Provider>
  )
}
