/**
 * Downloads word list source files for dictionary compilation.
 *
 * Usage: npx tsx scripts/download-wordlists.ts
 *
 * This downloads open-source word lists and places them in scripts/data/.
 * The word lists are used by compile-dawg.ts to produce the dictionary files.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const DATA_DIR = path.join(__dirname, "data");

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (reqUrl: string) => {
      https
        .get(reqUrl, (response) => {
          // Handle redirects
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            request(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode} for ${reqUrl}`));
            return;
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    };
    request(url);
  });
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Collins Scrabble Words / SOWPODS (public domain word lists)
  // Using a well-known open source Scrabble word list
  const twlDest = path.join(DATA_DIR, "twl06.txt");
  const sowpodsDest = path.join(DATA_DIR, "sowpods.txt");

  if (!fs.existsSync(twlDest)) {
    console.log("Downloading TWL06 word list...");
    try {
      await download(
        "https://raw.githubusercontent.com/benhoyt/boggle/master/word-list.txt",
        twlDest,
      );
      console.log("✓ TWL06 downloaded");
    } catch (e) {
      console.log(
        `✗ Failed to download TWL06: ${e}. You can manually place a word list at ${twlDest}`,
      );
    }
  } else {
    console.log("✓ TWL06 already exists");
  }

  if (!fs.existsSync(sowpodsDest)) {
    console.log(
      "ℹ SOWPODS not downloaded automatically. Place sowpods.txt in scripts/data/ manually if needed.",
    );
  } else {
    console.log("✓ SOWPODS already exists");
  }
}

main().catch(console.error);
