import { createClient } from "@supabase/supabase-js";
import type { BoardEntry, LeaderboardSource } from "./types";

export class SupabaseLeaderboardSource implements LeaderboardSource {
  private client;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async fetchTop(n: number): Promise<BoardEntry[]> {
    const { data, error } = await this.client
      .from("scores")
      .select("initials, score")
      .order("score", { ascending: false })
      .limit(n);
    if (error) throw error;
    return (data ?? []) as BoardEntry[];
  }

  async submit(entry: BoardEntry): Promise<void> {
    const { error } = await this.client
      .from("scores")
      .insert({ initials: entry.initials, score: entry.score });
    if (error) throw error;
  }
}
