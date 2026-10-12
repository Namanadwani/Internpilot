"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  STORAGE_KEYS,
  readStoredJSON,
  writeStoredJSON,
} from "@/lib/storage";

// Nothing is ticked to begin with. Agreeing has to be a deliberate act, so we
// never pre-tick a box for someone.
const NO_CHOICES_YET = {
  acceptedTerms: false,
  resumePermission: false,
  emailPermission: false,
};

// One tickable row. Written once here and reused for all three boxes, so they
// cannot drift apart in style or behaviour.
function CheckboxRow({ id, checked, onChange, badge, title, children }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
      />

      <span className="text-sm leading-relaxed text-slate-700">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{title}</span>
          {badge ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block">{children}</span>
      </span>
    </label>
  );
}

export default function ConsentForm() {
  const router = useRouter();
  const [choices, setChoices] = useState(NO_CHOICES_YET);
  const [agreedAt, setAgreedAt] = useState(null);

  // If they have been here before, show their previous answers so they are not
  // asked to tick the same boxes twice.
  useEffect(() => {
    const saved = readStoredJSON(STORAGE_KEYS.consent);
    if (!saved) return;

    setChoices({
      acceptedTerms: Boolean(saved.acceptedTerms),
      resumePermission: Boolean(saved.resumePermission),
      emailPermission: Boolean(saved.emailPermission),
    });
    setAgreedAt(saved.agreedAt ?? null);
  }, []);

  function toggle(name) {
    setChoices((previous) => ({ ...previous, [name]: !previous[name] }));
  }

  // The Continue button stays disabled until BOTH of the required boxes are
  // ticked. The email permission is optional and deliberately not required.
  const canContinue = choices.acceptedTerms && choices.resumePermission;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;

    const record = { ...choices, agreedAt: new Date().toISOString() };

    // Written down twice, on purpose:
    //
    //   consent        — a convenience copy, so these boxes are pre-filled if
    //                    the student comes back to this screen.
    //   pendingConsent — the copy waiting to be handed to the server. We cannot
    //                    save it yet: signing in has not happened, so we do not
    //                    know whose answers these are. It travels with them
    //                    through the Google round trip and is deleted once the
    //                    server has it (see components/SavePendingConsent.js).
    writeStoredJSON(STORAGE_KEYS.consent, record);
    writeStoredJSON(STORAGE_KEYS.pendingConsent, record);

    // Sign-in comes next, because a database record has to belong to somebody.
    router.push("/signin");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {agreedAt ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          You agreed to these on{" "}
          {new Date(agreedAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . Your previous answers are shown below — change anything you like.
        </p>
      ) : null}

      <CheckboxRow
        id="acceptedTerms"
        checked={choices.acceptedTerms}
        onChange={() => toggle("acceptedTerms")}
        badge="Required"
        title="I agree to the Terms of Service and Privacy Policy"
      >
        Please read the{" "}
        <Link href="/terms" className="font-medium text-brand-700 underline">
          Terms of Service
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" className="font-medium text-brand-700 underline">
          Privacy Policy
        </Link>{" "}
        before ticking this box.
      </CheckboxRow>

      <CheckboxRow
        id="resumePermission"
        checked={choices.resumePermission}
        onChange={() => toggle("resumePermission")}
        badge="Required"
        title="InternPilot may store and analyze my resume"
      >
        We need this to read your resume, give you feedback, work out your
        best-fit fields, and match you to internships. We use it for nothing
        else.
      </CheckboxRow>

      <CheckboxRow
        id="emailPermission"
        checked={choices.emailPermission}
        onChange={() => toggle("emailPermission")}
        badge="Optional"
        title="InternPilot may send emails from my Gmail"
      >
        Only ever after you have read a specific email and approved that one
        email. Nothing is sent automatically, and you can switch this off at any
        time. Leaving this unticked does not hold anything else up.
      </CheckboxRow>

      <div className="pt-3">
        <button
          type="submit"
          disabled={!canContinue}
          className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
        >
          Continue
        </button>

        {/* Tell the student plainly why the button is not working yet. */}
        {!canContinue ? (
          <p className="mt-3 text-sm text-slate-500">
            Tick the first two boxes to continue. The Gmail permission is
            optional.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Next: sign in with Google, so these permissions can be saved against
            your account.
          </p>
        )}
      </div>
    </form>
  );
}
