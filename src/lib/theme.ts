/**
 * The theme setting lives in IndexedDB, which is too slow to read before
 * first paint, so ThemeProvider mirrors it into localStorage for
 * THEME_SCRIPT (inlined in <head> by the root layout).
 */
export const THEME_STORAGE_KEY = "theme";

/** Apply the saved (or system) theme before first paint. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
