import { describe, it, expect, beforeEach } from "vitest";
import { readBestScore, writeBestScore } from "../leaderboard/bestScore";

beforeEach(() => {
  localStorage.clear();
});

describe("bestScore", () => {
  it("returns 0 when nothing stored", () => {
    expect(readBestScore()).toBe(0);
  });

  it("round-trips a score", () => {
    writeBestScore(42);
    expect(readBestScore()).toBe(42);
  });

  it("returns 0 when raw value is tampered (score changed)", () => {
    writeBestScore(42);
    const raw = localStorage.getItem("nyan-best-score")!;
    const [, checksum] = raw.split(":");
    localStorage.setItem("nyan-best-score", `9999:${checksum}`);
    expect(readBestScore()).toBe(0);
  });

  it("returns 0 when checksum is stripped", () => {
    writeBestScore(42);
    localStorage.setItem("nyan-best-score", "42");
    expect(readBestScore()).toBe(0);
  });

  it("returns 0 for negative value", () => {
    writeBestScore(42);
    const raw = localStorage.getItem("nyan-best-score")!;
    const checksum = raw.split(":")[1];
    localStorage.setItem("nyan-best-score", `-1:${checksum}`);
    expect(readBestScore()).toBe(0);
  });
});
