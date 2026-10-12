"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS, readStoredJSON, clearStored } from "@/lib/storage";

// Runs once, on the page a student reaches straight after signing in.
//
// If they ticked the consent boxes BEFORE signing in, those answers have been
// sitting in their browser waiting for us to find out who they are. Now we know,
// so this hands them to the server and deletes the browser copy.
//
// If there is nothing waiting, it does nothing at all.
export default function SavePendingConsent() {
  const router = useRouter();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const pending = readStoredJSON(STORAGE_KEYS.pendingConsent);

    // Nothing waiting — this student agreed after signing in, or already has a
    // record. Stay quiet.
    if (!pending) return;

    let cancelled = false;

    async function handOver() {
      try {
        const response = await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
        });

        if (!response.ok) throw new Error("The server did not accept them");

        // Only delete the browser copy once the server confirms it has them.
        clearStored(STORAGE_KEYS.pendingConsent);

        if (!cancelled) {
          setMessage("Your permissions are now saved with your account.");
          // Re-render the page so the permissions panel shows the real record.
          router.refresh();
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "We could not save your permissions just now. They are still on this device — reload the page to try again."
          );
        }
      }
    }

    handOver();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!message) return null;

  return (
    <p className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
      {message}
    </p>
  );
}
