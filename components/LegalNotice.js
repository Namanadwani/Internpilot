// A loud, unmissable warning that our legal pages are drafts.
//
// It lives in its own component and is used by both /terms and /privacy, so the
// warning only has to be written once — and so it cannot be quietly deleted
// from one page while staying on the other.
export default function LegalNotice() {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
      <p className="text-sm font-semibold tracking-wide text-amber-900">
        ⚠️ PLACEHOLDER — NOT LEGAL ADVICE
      </p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900">
        This page is a rough draft written by the people who built the app, not
        by a lawyer. InternPilot must not launch publicly, collect any resume, or
        send any email until a qualified lawyer has reviewed and rewritten this
        page for the countries our students live in. Every bracketed
        [PLACEHOLDER] note below marks something that still has to be filled in.
      </p>
    </div>
  );
}
