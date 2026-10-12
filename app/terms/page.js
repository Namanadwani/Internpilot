import LegalNotice from "@/components/LegalNotice";

export const metadata = {
  title: "Terms of Service — InternPilot",
};

// PLACEHOLDER PAGE. See components/LegalNotice.js — this must be reviewed by a
// lawyer before InternPilot launches to the public.
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Draft version 0.1 — last updated 12 October 2026.
      </p>

      <div className="mt-8">
        <LegalNotice />
      </div>

      {/* Each section below is a heading plus placeholder text. Replace the
          text, keep the shape. */}
      <div className="mt-10 space-y-9">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            1. Who we are
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the registered company name, address, and contact
            email for InternPilot.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. What InternPilot does
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — a plain description of the service: resume feedback,
            best-fit fields, matched internships, and emails drafted for the
            student to approve before sending.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            3. What InternPilot does not do
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — state clearly that we never message anyone on social
            media, never mass-mail resumes, and never send an email without the
            student approving that specific email first.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            4. Your account
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — who may create an account, whether students under 18
            are allowed, keeping your password safe, and what happens if an
            account is misused.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            5. Your resume and your content
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — that the student keeps ownership of their resume, and
            the limited permission they give us to store and analyze it.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            6. Emails sent from your Gmail
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — how Gmail access works, that the student approves each
            email individually, how to withdraw permission, and what happens if
            an email is sent to the wrong person.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            7. Acceptable use
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — no fake resumes, no using the service to spam
            employers, and what we do if someone breaks these rules.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            8. Ending your use
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — how a student closes their account, and how we would
            end access if we had to.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            9. Disclaimers and limits on liability
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — that we do not guarantee an internship, interview, or
            job, and the limits of our responsibility. This section especially
            needs a lawyer.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            10. Changes to these terms
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — how students are told when these terms change, and
            from what date the new version applies.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            11. Contact
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the email address students write to with questions
            about these terms.]
          </p>
        </section>
      </div>
    </div>
  );
}
