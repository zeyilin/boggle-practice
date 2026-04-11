/**
 * Service worker registration and update management.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(
  onUpdateAvailable?: () => void,
) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      swRegistration = reg;

      // Check for updates
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New version available
            onUpdateAvailable?.();
          }
        });
      });

      // Request persistent storage
      if (navigator.storage?.persist) {
        await navigator.storage.persist();
      }
    } catch (e) {
      console.error("SW registration failed:", e);
    }
  });
}

export function skipWaiting() {
  const waiting = swRegistration?.waiting;
  if (!waiting) return;

  // Wait for the new SW to take control before reloading
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });

  // Tell the waiting worker to activate
  waiting.postMessage({ type: "SKIP_WAITING" });
}
