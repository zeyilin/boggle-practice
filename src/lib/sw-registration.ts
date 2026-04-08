/**
 * Service worker registration and update management.
 */

export function registerServiceWorker(
  onUpdateAvailable?: () => void,
) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

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
  navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  window.location.reload();
}
