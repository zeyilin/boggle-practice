import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Every exported page is precached, so launches, refreshes and deep links
// are served by the service worker instead of waiting on a network round
// trip (the default runtime caching is network-first for HTML), and work
// offline. A page's HTML names that build's hashed chunks, so it's
// revisioned per build; users get new pages with the rest of the update
// (via the update banner), never mid-game.
const PAGES = ["/", "/play", "/solver", "/stats", "/settings"];
const buildRevision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache all of public/ except the plain-text word lists (1.7 MB each,
  // only fetched by the no-DecompressionStream fallback); the .dawg.gz
  // dictionaries stay precached for offline play. glob ignores "!" negations,
  // hence the extglob split.
  globPublicPatterns: ["*", "!(dictionaries)/**", "dictionaries/**/!(*.txt)"],
  // (Added by a transform: setting additionalPrecacheEntries would replace
  // the public/ scan above instead of adding to it.)
  manifestTransforms: [
    (entries) => ({
      manifest: [
        ...entries,
        ...PAGES.map((url) => ({ url, revision: buildRevision, size: 0 })),
      ],
    }),
  ],
});

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
