"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STORAGE_KEYS, readStoredJSON, writeStoredJSON } from "@/lib/storage";

// The bar that slides in at the bottom of the screen until the visitor picks
// an option. The choice is saved in the browser, so it is only asked once.
export default function CookieBanner() {
  // It starts hidden on purpose. If we started it visible, the server and the
  // browser would disagree about what the page looks like on first paint,
  // which React reports as a "hydration mismatch".
  const [isVisible, setIsVisible] = useState(false);

  // Runs once, in the browser, after the page has appeared.
  // Show the banner only if no choice has ever been saved.
  useEffect(() => {
    const savedChoice = readStoredJSON(STORAGE_KEYS.cookieChoice);
    if (!savedChoice) {
      setIsVisible(true);
    }
  }, []);

  // level is either "essential" or "all".
  function saveChoice(level) {
    writeStoredJSON(STORAGE_KEYS.cookieChoice, {
      level,
      decidedAt: new Date().toISOString(),
    });
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <p className="text-sm leading-relaxed text-slate-600">
          We use essential cookies to keep InternPilot working. With your
          permission we would also use optional cookies to understand how the
          app is used, so we can improve it. See our{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Stacked on phones, side by side on wider screens */}
        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
          <button
            type="button"
            onClick={() => saveChoice("essential")}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Accept essential only
          </button>
          <button
            type="button"
            onClick={() => saveChoice("all")}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
