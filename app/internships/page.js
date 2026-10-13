import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDatabaseStatus } from "@/lib/db-status";
import { requireResumePermission } from "@/lib/require-consent";
import { parseStoredList } from "@/lib/stored-lists";
import { scoreInternship } from "@/lib/matching";
import DatabaseNotice from "@/components/DatabaseNotice";
import InternshipCard from "@/components/InternshipCard";

export const metadata = {
  title: "Internships — InternPilot",
};

// How many to show. There may be far more stored; a student will not read 300,
// and scoring them all costs time on every page view.
const MAX_SHOWN = 40;

// Real internships, scored against this student's resume.
export default async function InternshipsPage() {
  const database = await getDatabaseStatus();

  if (!database.ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Internships
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
    select: { id: true, text: true },
  });

  const analysis = resume
    ? await prisma.analysis.findFirst({
        where: { resumeId: resume.id },
        orderBy: { createdAt: "desc" },
        select: { bestFitFields: true },
      })
    : null;

  const bestFitFields = analysis ? parseStoredList(analysis.bestFitFields) : [];

  // Without feedback from Stage 4 there are no best-fit fields to score against,
  // so we show the listings plainly rather than showing everyone "0% match" and
  // letting them think the app is broken.
  const canScore = bestFitFields.length > 0;

  const [total, internships] = await Promise.all([
    prisma.internship.count(),
    prisma.internship.findMany({
      // Ceiling, not a page size. Scoring happens in memory below, which is fine
      // for a handful of companies; past a few thousand listings this needs to
      // move into the database instead.
      take: 400,
      orderBy: [{ postedAt: "desc" }, { firstSeenAt: "desc" }],
    }),
  ]);

  const results = internships
    .map((internship) => ({
      internship,
      ...scoreInternship({
        internship,
        bestFitFields,
        resumeText: resume?.text ?? "",
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SHOWN);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Internships
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        Real internships, gathered from the companies&apos; own job boards and put
        in order of how well they suit you.
      </p>

      {/* No feedback yet — nudge them to get it, without hiding the listings. */}
      {!canScore && total > 0 ? (
        <div className="mt-6 rounded-xl border-2 border-brand-200 bg-brand-50/60 p-5">
          <p className="text-sm font-semibold text-brand-900">
            These are not scored yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-900">
            InternPilot needs to read your resume first, so it knows which fields
            suit you. Until then these are in date order.
          </p>
          <Link
            href={resume ? "/results" : "/resume"}
            className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {resume ? "Get my feedback" : "Upload your resume"}
          </Link>
        </div>
      ) : null}

      {total === 0 ? (
        // Nothing stored at all. This is an owner problem, not a student one, so
        // the message is written for whoever is running the project.
        <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            No internships have been fetched yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            The listings come from company job boards and are cached locally. Run
            the sync to fetch them:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-amber-100 p-3 text-xs text-amber-900">
            npm run sync
          </pre>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            Add or change companies in{" "}
            <code className="rounded bg-amber-100 px-1">lib/companies.js</code>.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-500">
            Showing {results.length} of {total} we hold.
          </p>

          <ul className="mt-8 space-y-4">
            {results.map(({ internship, score, reasons }) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                score={score}
                reasons={reasons}
                showScore={canScore}
              />
            ))}
          </ul>
        </>
      )}

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        The match score counts shared words and how recently a listing was posted.
        It is a rough guide, not a judgement — read the reasons and decide for
        yourself. InternPilot never applies on your behalf; every link goes to the
        company&apos;s own page.
      </p>
    </div>
  );
}
