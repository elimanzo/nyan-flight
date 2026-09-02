import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryLeaderboardSource } from "../leaderboard/InMemoryLeaderboardSource";
import { LeaderboardService } from "../leaderboard/LeaderboardService";

let source: InMemoryLeaderboardSource;
let service: LeaderboardService;

beforeEach(() => {
  source = new InMemoryLeaderboardSource();
  service = new LeaderboardService(source);
});

async function fill(scores: number[]) {
  for (const score of scores) {
    await service.submit({ initials: "AAA", score });
  }
}

describe("LeaderboardService – ordering and top-N", () => {
  it("returns entries sorted descending", async () => {
    await fill([5, 20, 10]);
    const top = await service.fetchTop(10);
    expect(top.map((e) => e.score)).toEqual([20, 10, 5]);
  });

  it("truncates to N entries", async () => {
    await fill([1, 2, 3, 4, 5]);
    const top = await service.fetchTop(3);
    expect(top).toHaveLength(3);
    expect(top[0].score).toBe(5);
  });
});

describe("LeaderboardService – qualifies", () => {
  it("qualifies when fewer than 10 entries exist", async () => {
    await fill([10, 9, 8]);
    expect(await service.qualifies(1)).toBe(true);
  });

  it("qualifies when score is strictly above #10", async () => {
    await fill([100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    expect(await service.qualifies(11)).toBe(true);
  });

  it("does not qualify when score ties #10", async () => {
    await fill([100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    expect(await service.qualifies(10)).toBe(false);
  });

  it("does not qualify when score is below #10", async () => {
    await fill([100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    expect(await service.qualifies(5)).toBe(false);
  });
});
