import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache all of public/ except the plain-text word lists (1.7 MB each,
  // only fetched by the no-DecompressionStream fallback); the .dawg.gz
  // dictionaries stay precached for offline play. glob ignores "!" negations,
  // hence the extglob split.
  globPublicPatterns: ["*", "!(dictionaries)/**", "dictionaries/**/!(*.txt)"],
});

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
