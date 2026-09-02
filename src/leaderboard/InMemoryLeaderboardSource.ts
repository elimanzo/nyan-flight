import type { BoardEntry, LeaderboardSource } from "./types";

export class InMemoryLeaderboardSource implements LeaderboardSource {
  private entries: BoardEntry[] = [];

  async fetchTop(n: number): Promise<BoardEntry[]> {
    return [...this.entries]
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  async submit(entry: BoardEntry): Promise<void> {
    this.entries.push({ ...entry });
  }
}
