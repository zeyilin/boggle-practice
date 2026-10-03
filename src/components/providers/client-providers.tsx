"use client";

import { ThemeProvider } from "./theme-provider";
import { UpdateBanner } from "../layout/update-banner";
import { SkipLink } from "../layout/skip-link";
import { ErrorBoundary } from "../error-boundary";
import { AppBootstrap } from "./app-bootstrap";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppBootstrap />
        <SkipLink />
        <main id="main-content" className="flex flex-col flex-1">
          {children}
        </main>
        <UpdateBanner />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
