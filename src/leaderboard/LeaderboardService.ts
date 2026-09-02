import type { BoardEntry, LeaderboardSource } from "./types";

export class LeaderboardService {
  constructor(private readonly source: LeaderboardSource) {}

  async fetchTop(n: number): Promise<BoardEntry[]> {
    return this.source.fetchTop(n);
  }

  async submit(entry: BoardEntry): Promise<void> {
    return this.source.submit(entry);
  }

  /** True when score beats the current #N entry, or fewer than N entries exist. */
  async qualifies(score: number, n = 10): Promise<boolean> {
    const top = await this.source.fetchTop(n);
    if (top.length < n) return true;
    return score > top[top.length - 1].score;
  }
}
