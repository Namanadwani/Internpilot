"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The "get my feedback" button.
//
// The AI call can take ten or twenty seconds, which is long enough that a
// student will assume the page is broken, so the button tells them what is
// happening while they wait.
export default function RunAnalysisButton({ label, existing }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/analysis", { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }

      // Success: redraw the page so the new feedback appears.
      router.refresh();
      setBusy(false);
    } catch {
      setError(
        "We could not reach the server. Check your internet connection and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
      >
        {busy
          ? "Reading your resume…"
          : (label ?? (existing ? "Run it again" : "Get my feedback"))}
      </button>

      {busy ? (
        <p className="mt-3 text-sm text-slate-500">
          This takes ten or twenty seconds. Please leave this page open.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
