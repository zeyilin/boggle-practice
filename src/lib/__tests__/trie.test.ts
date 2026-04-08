import { describe, it, expect } from "vitest";
import { buildTrie, isWord, isPrefix } from "../trie";

describe("Trie", () => {
  const words = ["CAT", "CAR", "CARD", "CARE", "CARS", "DOG", "DO"];
  const trie = buildTrie(words);

  it("should report correct word count", () => {
    expect(trie.wordCount).toBe(7);
  });

  it("should find exact words", () => {
    expect(isWord(trie, "CAT")).toBe(true);
    expect(isWord(trie, "CAR")).toBe(true);
    expect(isWord(trie, "CARD")).toBe(true);
    expect(isWord(trie, "CARE")).toBe(true);
    expect(isWord(trie, "CARS")).toBe(true);
    expect(isWord(trie, "DOG")).toBe(true);
    expect(isWord(trie, "DO")).toBe(true);
  });

  it("should reject non-words", () => {
    expect(isWord(trie, "CA")).toBe(false);
    expect(isWord(trie, "CATS")).toBe(false);
    expect(isWord(trie, "CARED")).toBe(false);
    expect(isWord(trie, "FOX")).toBe(false);
    expect(isWord(trie, "")).toBe(false);
  });

  it("should find valid prefixes", () => {
    expect(isPrefix(trie, "C")).toBe(true);
    expect(isPrefix(trie, "CA")).toBe(true);
    expect(isPrefix(trie, "CAR")).toBe(true);
    expect(isPrefix(trie, "CARD")).toBe(true);
    expect(isPrefix(trie, "D")).toBe(true);
    expect(isPrefix(trie, "DO")).toBe(true);
  });

  it("should reject invalid prefixes", () => {
    expect(isPrefix(trie, "X")).toBe(false);
    expect(isPrefix(trie, "CX")).toBe(false);
    expect(isPrefix(trie, "DOGS")).toBe(false);
  });

  it("should handle empty prefix", () => {
    expect(isPrefix(trie, "")).toBe(true);
  });

  it("should handle duplicate words in input", () => {
    const trieWithDups = buildTrie(["CAT", "CAT", "CAT"]);
    expect(trieWithDups.wordCount).toBe(1);
    expect(isWord(trieWithDups, "CAT")).toBe(true);
  });
});
