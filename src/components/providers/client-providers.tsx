"use client";

import { ThemeProvider } from "./theme-provider";
import { UpdateBanner } from "../layout/update-banner";
import { SkipLink } from "../layout/skip-link";
import { ErrorBoundary } from "../error-boundary";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SkipLink />
        <main id="main-content" className="flex flex-col flex-1">
          {children}
        </main>
        <UpdateBanner />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
