/**
 * Dictionary compiler for Boggle Practice.
 *
 * v1 approach: takes raw word list files and produces compressed text files
 * (one word per line, uppercase, sorted) placed in public/dictionaries/.
 *
 * The web worker loads these and builds a Trie at runtime.
 * The text files compress well with Brotli/gzip served by the CDN.
 *
 * Usage: npx tsx scripts/compile-dawg.ts
 *
 * Expects raw word lists in scripts/data/:
 *   - twl06.txt
 *   - sowpods.txt (optional)
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "data");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "dictionaries");

const DICTIONARIES = [
  { name: "twl06", file: "twl06.txt" },
  { name: "sowpods", file: "sowpods.txt" },
];

// Minimum word length we'd ever need (3 for classic Boggle)
const MIN_LENGTH = 3;
// Maximum practical word length on a Boggle board
const MAX_LENGTH = 25;

function processWordList(inputPath: string, outputPath: string): number {
  const raw = fs.readFileSync(inputPath, "utf-8");
  const words = raw
    .split(/\r?\n/)
    .map((w) => w.trim().toUpperCase())
    .filter((w) => {
      if (w.length < MIN_LENGTH || w.length > MAX_LENGTH) return false;
      // Only keep words that are purely alphabetic
      return /^[A-Z]+$/.test(w);
    });

  // Deduplicate and sort
  const unique = [...new Set(words)].sort();

  fs.writeFileSync(outputPath, unique.join("\n"), "utf-8");
  return unique.length;
}

// Main
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const dict of DICTIONARIES) {
  const inputPath = path.join(DATA_DIR, dict.file);
  const outputPath = path.join(OUTPUT_DIR, `${dict.name}.txt`);

  if (!fs.existsSync(inputPath)) {
    console.log(
      `⚠ Skipping ${dict.name}: ${dict.file} not found in scripts/data/`,
    );
    continue;
  }

  const count = processWordList(inputPath, outputPath);
  console.log(`✓ ${dict.name}: ${count} words → ${outputPath}`);
}

console.log("\nDone. Dictionary files written to public/dictionaries/");
