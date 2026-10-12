"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// The upload box.
//
// It does three things: checks the file looks plausible before sending it (fast,
// friendly), sends it to /api/resume, and shows whatever the server says went
// wrong. The server repeats those checks for real — see app/api/resume/route.js.

const MAX_FILE_BYTES = 5 * 1024 * 1024; // keep in step with lib/resume-text.js
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function ResumeUploadForm({ hasExistingResume }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function handleChoose(event) {
    setError(null);
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    // The quick, friendly check. The server checks again properly.
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 5 MB. Try removing images from it.");
      return;
    }

    const looksRight =
      /\.(pdf|docx)$/i.test(file.name) ||
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!looksRight) {
      setError("Please choose a PDF or a Word (.docx) file.");
      return;
    }

    setBusy(true);

    try {
      const body = new FormData();
      body.append("resume", file);

      const response = await fetch("/api/resume", { method: "POST", body });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }

      // Success. Clear the picker and let the server redraw the page so the
      // "your current resume" panel below is up to date.
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setBusy(false);
      router.refresh();
    } catch {
      setError(
        "We could not reach the server. Check your internet connection and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label
        htmlFor="resume"
        className="block text-sm font-medium text-slate-700"
      >
        {hasExistingResume ? "Choose a replacement file" : "Choose your resume"}
      </label>

      <input
        ref={inputRef}
        id="resume"
        name="resume"
        type="file"
        accept={ACCEPT}
        onChange={handleChoose}
        disabled={busy}
        className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 p-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-60"
      />

      {file ? (
        <p className="mt-2 text-xs text-slate-500">
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          PDF or Word (.docx), up to 5 MB. We read the text and then discard the
          file itself.
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !file}
        className="mt-5 w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      >
        {busy
          ? "Reading your resume…"
          : hasExistingResume
            ? "Replace my resume"
            : "Upload my resume"}
      </button>
    </form>
  );
}
