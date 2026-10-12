import LegalNotice from "@/components/LegalNotice";

export const metadata = {
  title: "Privacy Policy — InternPilot",
};

// PLACEHOLDER PAGE. See components/LegalNotice.js — this must be reviewed by a
// lawyer before InternPilot launches to the public.
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Draft version 0.1 — last updated 13 October 2026.
      </p>

      <div className="mt-8">
        <LegalNotice />
      </div>

      <div className="mt-10 space-y-9">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            1. What this policy covers
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — who is responsible for your data (the "data
            controller"), and which countries this policy is written for.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. What we collect
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the list, in plain words: account details (name,
            email), the resume file itself, the analysis we produce from it, the
            emails you approve, and basic technical information such as your
            browser type.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            3. Why we are allowed to hold it
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the legal basis for each type of data. In the UK/EU
            this means naming things like consent, contract, and legitimate
            interests. A lawyer needs to write this section.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            4. Your resume
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — that we only read your resume because you gave us
            permission, that it is used to give feedback and match internships,
            and how to have it deleted. Note that a resume can contain sensitive
            details, and say how that is handled.]
          </p>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — this section must say plainly that we keep <strong>both</strong>{" "}
            the file you uploaded and the words we read out of it, why we keep
            the file (so you can download your own copy, and so it can be
            attached to an application email you have approved), and that
            nothing is sent to an employer without your approval of that specific
            email.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            5. Access to your Gmail
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — exactly which Gmail permissions we ask for and why,
            that we only send emails you have individually approved, that we do
            not read your inbox or your contacts, and how to disconnect Gmail.
            Google's own rules for apps like this also have to be met.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            6. Cookies and the choices you make
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — list every cookie we set, what each one is for, and
            how long it lasts. The cookie banner currently saves your choice, and
            your consent answers, in your own browser's storage on your device —
            this section must describe that accurately, and say how to change
            your mind.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            7. Who else sees your data
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — name every outside company that touches student data,
            such as our hosting provider, our AI provider for resume analysis,
            and Google for Gmail. Include where they are based and the
            protections in place when data leaves the country.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            8. How long we keep it
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — a retention period for each type of data, and what
            happens to it when an account is closed. Say specifically how long
            the uploaded resume file is kept, and how a student can delete it
            themselves.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            9. Your rights
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the right to see your data, correct it, delete it,
            take a copy, and withdraw permission — plus the email address to use
            and how quickly we must reply.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            10. Younger students
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the minimum age for using InternPilot and what happens
            for anyone younger.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            11. Contact us
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            [PLACEHOLDER — the email address for privacy questions, and how to
            complain to a data protection authority.]
          </p>
        </section>
      </div>
    </div>
  );
}
