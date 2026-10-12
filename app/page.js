import Link from "next/link";

// The three steps shown on the landing page.
// Keeping them in a list here means the markup below stays short and tidy.
const STEPS = [
  {
    title: "Upload your resume",
    body: "Drop in your resume and we read it, then tell you plainly what is working and what is holding you back.",
  },
  {
    title: "See where you fit",
    body: "You get your best-fit fields, plus real internships ranked by a match score, so you know where to spend your energy.",
  },
  {
    title: "You approve every email",
    body: "We draft a tailored email for a role. Nothing is sent until you read it, edit it, and press send from your own Gmail.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero: the headline and the main button ---------- */}
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-24">
        <div className="max-w-2xl">
          {/* A small label above the headline */}
          <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            For students looking for internships
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Upload your resume. Get matched to real internships.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            InternPilot reads your resume, tells you which fields suit you best,
            and shows you internships that actually fit — with an honest score
            for each one.
          </p>

          {/* The main call to action. It leads to the consent screen, because
              we need the student's permission before we look at anything. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/consent"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-700"
            >
              Get started
            </Link>
            <span className="text-sm text-slate-500">
              Free while in early access. No credit card.
            </span>
          </div>
        </div>
      </section>

      {/* ---------- How it works, in three steps ---------- */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Three steps. You stay in control the whole way through.
          </p>

          {/* One column on phones, three across on tablets and up */}
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- What we will never do ---------- */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            What InternPilot will never do
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-brand-600">
                —
              </span>
              Never message anyone on social media on your behalf.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-brand-600">
                —
              </span>
              Never mass-mail your resume to companies you have not chosen.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-brand-600">
                —
              </span>
              Never send an email from your Gmail without showing it to you
              first.
            </li>
          </ul>

          <Link
            href="/consent"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>
      </section>
    </>
  );
}
