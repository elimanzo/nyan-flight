import { LeaderboardService } from "./LeaderboardService";
import { InMemoryLeaderboardSource } from "./InMemoryLeaderboardSource";
import { SupabaseLeaderboardSource } from "./SupabaseLeaderboardSource";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const source =
  url && key
    ? new SupabaseLeaderboardSource(url, key)
    : new InMemoryLeaderboardSource();

export const leaderboard = new LeaderboardService(source);
