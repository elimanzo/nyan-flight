import type { BoardEntry, LeaderboardSource } from "./types";

export const MAX_SCORE = 9_999;

export class LeaderboardService {
  private source: LeaderboardSource;
  constructor(source: LeaderboardSource) {
    this.source = source;
  }

  async fetchTop(n: number): Promise<BoardEntry[]> {
    return this.source.fetchTop(n);
  }

  async submit(entry: BoardEntry): Promise<void> {
    if (entry.score < 0 || entry.score > MAX_SCORE) {
      throw new RangeError(`Score ${entry.score} outside valid range [0, ${MAX_SCORE}]`);
    }
    return this.source.submit(entry);
  }

  /** True when score beats the current #N entry, or fewer than N entries exist. */
  async qualifies(score: number, n = 10): Promise<boolean> {
    const top = await this.source.fetchTop(n);
    if (top.length < n) return true;
    return score > top[top.length - 1].score;
  }
}
