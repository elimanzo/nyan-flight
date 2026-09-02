import { describe, it, expect } from "vitest";
import { getMedal } from "../utils/medals";

describe("getMedal", () => {
  it("returns null for scores below 5", () => {
    expect(getMedal(0)).toBeNull();
    expect(getMedal(4)).toBeNull();
  });

  it("returns bronze for scores 5–14", () => {
    expect(getMedal(5)).toBe("bronze");
    expect(getMedal(14)).toBe("bronze");
  });

  it("returns silver for scores 15–29", () => {
    expect(getMedal(15)).toBe("silver");
    expect(getMedal(29)).toBe("silver");
  });

  it("returns gold for scores 30–49", () => {
    expect(getMedal(30)).toBe("gold");
    expect(getMedal(49)).toBe("gold");
  });

  it("returns platinum for scores 50+", () => {
    expect(getMedal(50)).toBe("platinum");
    expect(getMedal(999)).toBe("platinum");
  });
});
