"use client";

import { useState } from "react";
import { deleteMyAccount } from "@/app/account/actions";
import { STORAGE_KEYS, clearStored } from "@/lib/storage";

// The delete button, in two steps.
//
// A misclick here cannot be undone, so the first click only *reveals* what
// would be lost. Nothing is destroyed until a second, differently-worded button
// is pressed. That is a panel naming the losses rather than an "Are you sure?"
// popup, because a popup gets dismissed by reflex and names nothing.
export default function DeleteConfirm() {
  const [confirming, setConfirming] = useState(false);

  // Clear this browser's copy of the consent answers, so signing up again from
  // the same browser starts from a genuinely blank slate rather than
  // pre-filling boxes ticked for an account that no longer exists.
  //
  // The cookie-banner choice is deliberately left alone: that belongs to the
  // device, not the account. See lib/storage.js.
  function forgetConsentAnswers() {
    clearStored(STORAGE_KEYS.consent);
    clearStored(STORAGE_KEYS.pendingConsent);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
      <p className="text-sm font-semibold text-red-900">
        This cannot be undone.
      </p>

      <p className="mt-2 text-sm leading-relaxed text-red-900">
        Deleting your account removes all of this, permanently:
      </p>

      <ul className="mt-3 space-y-1 text-sm leading-relaxed text-red-900">
        <li>• Your account, and your sign-in with Google</li>
        <li>• Your resume — including the file you uploaded</li>
        <li>• All the feedback written about your resume</li>
        <li>• Your consent record and your permissions</li>
      </ul>

      {/* Say what the button cannot do, rather than let it imply more. */}
      <p className="mt-4 text-sm leading-relaxed text-red-900">
        It cannot undo an email you have already sent to an employer, and it
        cannot remove InternPilot from your Google account. For that last one, go
        to{" "}
        <a
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline"
        >
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <form
        action={deleteMyAccount}
        onSubmit={forgetConsentAnswers}
        className="mt-5 flex flex-wrap items-center gap-3"
      >
        <button
          type="submit"
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Yes, delete everything permanently
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-xl px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
