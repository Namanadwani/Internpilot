import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/session";
import { getDatabaseStatus } from "@/lib/db-status";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/AuthButtons";
import SavePendingConsent from "@/components/SavePendingConsent";

export const metadata = {
  title: "Your account — InternPilot",
};

// The signed-in page. Shows who you are and what you have agreed to.
//
// This is the page a student is sent to straight after signing in with Google,
// which is also the moment their consent answers get written to the database —
// see components/SavePendingConsent.js below.
export default async function AccountPage() {
  const database = await getDatabaseStatus();

  if (!database.ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Your account
        </h1>
      </div>
    );
  }

  const session = await getOptionalSession();
  if (!session?.user) {
    redirect("/signin");
  }

  // The real, stored-against-your-account consent record.
  const consent = await prisma.consent.findUnique({
    where: { userId: session.user.id },
  });

  // Their resume, if there is one, plus how much feedback has been written
  // about it — enough to point them at the right next step.
  const resume = await prisma.resume.findUnique({
    where: { userId: session.user.id },
    select: {
      fileName: true,
      updatedAt: true,
      text: true,
      _count: { select: { analyses: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Hello, {session.user.name ?? "there"}
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        You are signed in. Your details are saved with your account, so they
        will still be here next time — even on a different device.
      </p>

      {/* Hands any consent answers given before sign-in over to the server. */}
      <SavePendingConsent />

      <div className="mt-8 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-right font-medium text-slate-900">
              {session.user.name ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-right font-medium text-slate-900">
              {session.user.email ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Your permissions
        </h2>

        {consent ? (
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Terms and Privacy Policy</dt>
              <dd className="text-right font-medium text-slate-900">
                {consent.acceptedTerms ? "Agreed" : "Not agreed"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Store and analyze my resume</dt>
              <dd className="text-right font-medium text-slate-900">
                {consent.resumePermission ? "Agreed" : "Not agreed"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Send emails from my Gmail</dt>
              <dd className="text-right font-medium text-slate-900">
                {consent.emailPermission ? "On" : "Off"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Agreed on</dt>
              <dd className="text-right font-medium text-slate-900">
                {new Date(consent.agreedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Nothing recorded yet. Go to{" "}
            <a
              href="/consent"
              className="font-medium text-brand-700 underline"
            >
              the permissions screen
            </a>{" "}
            to set them.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your resume</h2>

        {resume ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              <span className="font-medium text-slate-800">
                {resume.fileName}
              </span>{" "}
              — uploaded{" "}
              {new Date(resume.updatedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              , {resume.text.split(/\s+/).length} words read.
            </p>
            <Link
              href={resume._count.analyses > 0 ? "/results" : "/resume"}
              className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              {resume._count.analyses > 0
                ? "See your feedback"
                : "Get your feedback"}
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              No resume uploaded yet. Upload one and InternPilot will tell you
              what is working, what to change, and which fields suit you.
            </p>
            <Link
              href="/resume"
              className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Upload your resume
            </Link>
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          What is still missing
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Internships matched to you, an application email you approve before it
          is sent, and a tracker for the applications you have made. Those are
          the stages after this one.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          The account still says nothing about your Gmail, and it never will
          without you asking: sending email as you needs Google&apos;s
          verification first, so InternPilot will draft emails for you to send
          yourself.
        </p>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Signed in with Google. Your password was never shared with InternPilot.
      </p>
    </div>
  );
}
