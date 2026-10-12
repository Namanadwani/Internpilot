import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDatabaseStatus } from "@/lib/db-status";
import { requireResumePermission } from "@/lib/require-consent";
import DatabaseNotice from "@/components/DatabaseNotice";
import AnalysisResult from "@/components/AnalysisResult";
import RunAnalysisButton from "@/components/RunAnalysisButton";

export const metadata = {
  title: "Your feedback — InternPilot",
};

// SQLite stores our three lists as JSON text (see prisma/schema.prisma).
// This turns that text back into a real array, and shrugs if it is unreadable
// rather than crashing the page.
function parseStoredList(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// The feedback page.
export default async function ResultsPage() {
  const database = await getDatabaseStatus();

  if (!database.ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Your feedback
        </h1>
        <div className="mt-6">
          <DatabaseNotice status={database} />
        </div>
      </div>
    );
  }

  const permission = await requireResumePermission();

  if (!permission.ok) {
    redirect(permission.reason === "not-signed-in" ? "/signin" : "/consent");
  }

  const resume = await prisma.resume.findUnique({
    where: { userId: permission.user.id },
    select: { id: true, fileName: true },
  });

  // No resume yet — send them to upload one rather than showing an empty page.
  if (!resume) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Your feedback
        </h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          There is nothing to give feedback on yet — we need your resume first.
        </p>
        <Link
          href="/resume"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Upload your resume
        </Link>
      </div>
    );
  }

  const latest = await prisma.analysis.findFirst({
    where: { resumeId: resume.id },
    orderBy: { createdAt: "desc" },
  });

  const analysis = latest
    ? {
        summary: latest.summary,
        strengths: parseStoredList(latest.strengths),
        improvements: parseStoredList(latest.improvements),
        bestFitFields: parseStoredList(latest.bestFitFields),
        model: latest.model,
        createdAt: latest.createdAt,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Your feedback
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        Based on <span className="font-medium text-slate-800">{resume.fileName}</span>.
      </p>

      {analysis ? (
        <>
          <div className="mt-8">
            <AnalysisResult analysis={analysis} />
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Not happy with it?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Running it again writes fresh feedback and shows you the newest
              one. It does not delete the older ones, so nothing is lost.
            </p>
            <div className="mt-4">
              <RunAnalysisButton existing label="Run it again" />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Ready when you are
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            InternPilot will read your resume and write you an honest summary, a
            list of what is working, a list of what to change, and the fields you
            look best suited to.
          </p>
          <div className="mt-5">
            <RunAnalysisButton />
          </div>
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-slate-400">
        Your resume text is sent to Anthropic&apos;s Claude to produce this
        feedback. It is not used to train anything. Your uploaded file stays on
        your account so you can download it again — download it from{" "}
        <Link href="/resume" className="underline">
          your resume page
        </Link>
        .
      </p>

      <div className="mt-6">
        <Link
          href="/resume"
          className="text-sm font-medium text-brand-700 underline"
        >
          Back to your resume
        </Link>
      </div>
    </div>
  );
}
