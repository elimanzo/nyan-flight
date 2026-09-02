import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameState } from "../context/useGameState";

beforeEach(() => {
  localStorage.clear();
});

describe("useGameState – end(score)", () => {
  it("records score and transitions to 'over'", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.end(7));
    expect(result.current.score).toBe(7);
    expect(result.current.status).toBe("over");
  });

  it("records score without a question field", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.end(3));
    // type check: no lastQuestion / answered on the public surface
    expect("lastQuestion" in result.current).toBe(false);
    expect("answered" in result.current).toBe(false);
  });
});

describe("useGameState – Best (bestScore)", () => {
  it("raises Best when new score is higher", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.end(10));
    act(() => result.current.end(15));
    expect(result.current.bestScore).toBe(15);
  });

  it("does not lower Best when new score is lower", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.end(20));
    act(() => result.current.end(5));
    expect(result.current.bestScore).toBe(20);
  });

  it("persists Best across remounts via localStorage", () => {
    const { result, unmount } = renderHook(() => useGameState());
    act(() => result.current.end(12));
    unmount();
    const { result: result2 } = renderHook(() => useGameState());
    expect(result2.current.bestScore).toBe(12);
  });
});
