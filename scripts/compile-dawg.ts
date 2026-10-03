/**
 * Dictionary compiler for Boggle Practice.
 *
 * For each dictionary, produces in public/dictionaries/:
 *   - <name>.txt       normalized word list (one per line, uppercase, sorted)
 *   - <name>.dawg.gz   packed DAWG (src/lib/trie.ts), gzipped
 *
 * The web worker loads the .dawg.gz with zero parsing; the .txt is only the
 * fallback for browsers without DecompressionStream. The binary is gzipped
 * here because Cloudflare Pages won't compress an octet-stream on the fly.
 *
 * Usage: npx tsx scripts/compile-dawg.ts
 *
 * Reads raw word lists from scripts/data/ (see download-wordlists.ts):
 *   - twl06.txt
 *   - sowpods.txt (optional)
 * If a raw list is absent, the DAWG is rebuilt from the committed
 * public/dictionaries/<name>.txt instead, so it can always be regenerated.
 */

import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { buildTrie, serializeTrie } from "../src/lib/trie";

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

function normalizeWordList(inputPath: string): string[] {
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
  return [...new Set(words)].sort();
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Main
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const dict of DICTIONARIES) {
  const rawPath = path.join(DATA_DIR, dict.file);
  const txtPath = path.join(OUTPUT_DIR, `${dict.name}.txt`);
  const dawgPath = path.join(OUTPUT_DIR, `${dict.name}.dawg.gz`);

  let words: string[];
  if (fs.existsSync(rawPath)) {
    words = normalizeWordList(rawPath);
    fs.writeFileSync(txtPath, words.join("\n"), "utf-8");
    console.log(`✓ ${dict.name}: ${words.length} words → ${txtPath}`);
  } else if (fs.existsSync(txtPath)) {
    words = normalizeWordList(txtPath);
    console.log(
      `• ${dict.name}: ${dict.file} not in scripts/data/, using committed ${txtPath}`,
    );
  } else {
    console.log(
      `⚠ Skipping ${dict.name}: ${dict.file} not found in scripts/data/ or public/dictionaries/`,
    );
    continue;
  }

  const bytes = serializeTrie(buildTrie(words));
  const gz = zlib.gzipSync(bytes, { level: 9 });
  fs.writeFileSync(dawgPath, gz);
  console.log(
    `✓ ${dict.name}: DAWG ${kb(bytes.length)} raw, ${kb(gz.length)} gzipped → ${dawgPath}`,
  );
}

console.log("\nDone. Dictionary files written to public/dictionaries/");
