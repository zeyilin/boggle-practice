import { describe, it, expect } from "vitest";
import { scoreWord, calculateScore, calculateMaxScore } from "../scoring";

describe("scoreWord", () => {
  it("should score 3-letter words as 1 point (4x4)", () => {
    expect(scoreWord("CAT", 4)).toBe(1);
  });

  it("should score 4-letter words as 1 point", () => {
    expect(scoreWord("CATS", 4)).toBe(1);
  });

  it("should score 5-letter words as 2 points", () => {
    expect(scoreWord("CARTS", 4)).toBe(2);
  });

  it("should score 6-letter words as 3 points", () => {
    expect(scoreWord("CARING", 4)).toBe(3);
  });

  it("should score 7-letter words as 5 points", () => {
    expect(scoreWord("CARTING", 4)).toBe(5);
  });

  it("should score 8+ letter words as 11 points", () => {
    expect(scoreWord("CARRYING", 4)).toBe(11);
    expect(scoreWord("ABCDEFGHIJ", 4)).toBe(11);
  });

  it("should return 0 for words shorter than min length", () => {
    expect(scoreWord("AT", 4)).toBe(0);
    expect(scoreWord("CAT", 5)).toBe(0); // 3-letter word invalid in 5x5
  });

  it("should score 4-letter words as 1 point in 5x5", () => {
    expect(scoreWord("CATS", 5)).toBe(1);
  });
});

describe("calculateScore", () => {
  it("should sum scores for all words", () => {
    const words = ["CAT", "CATS", "CARTS"]; // 1 + 1 + 2 = 4
    expect(calculateScore(words, 4)).toBe(4);
  });
});

describe("calculateMaxScore", () => {
  it("should sum scores for all available words", () => {
    const words = [
      { word: "CAT" },
      { word: "CARTS" },
      { word: "CARRYING" },
    ]; // 1 + 2 + 11 = 14
    expect(calculateMaxScore(words, 4)).toBe(14);
  });
});
