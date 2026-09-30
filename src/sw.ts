import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // /play?mode=classic is the precached /play page (the mode is read
    // client-side); router requests carry _rsc and never match a page
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^mode$/],
  },
  skipWaiting: false, // Don't auto-update during games
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

// Listen for skip waiting message from update banner
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

serwist.addEventListeners();
