export type BoardEntry = {
  initials: string;
  score: number;
};

export interface LeaderboardSource {
  fetchTop(n: number): Promise<BoardEntry[]>;
  submit(entry: BoardEntry): Promise<void>;
}
