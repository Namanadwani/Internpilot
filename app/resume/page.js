import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDatabaseStatus } from "@/lib/db-status";
import { requireResumePermission } from "@/lib/require-consent";
import DatabaseNotice from "@/components/DatabaseNotice";
import ResumeUploadForm from "@/components/ResumeUploadForm";

export const metadata = {
  title: "Your resume — InternPilot",
};

// Where a student uploads their resume.
//
// Three doors, in order: is the database working, are you signed in, and did
// you give permission to store and analyze a resume. Failing any of them sends
// you somewhere useful rather than showing an error.
export default async function ResumePage() {
  const database = await getDatabaseStatus();

  if (!database.ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Your resume
        </h1>
        <div className="mt-6">
          <DatabaseNotice status={database} />
        </div>
      </div>
    );
  }

  const permission = await requireResumePermission();

  if (!permission.ok) {
    // Not signed in → sign in. Signed in but no resume permission → ask for it.
    // Neither of these is an error a student should have to read.
    redirect(permission.reason === "not-signed-in" ? "/signin" : "/consent");
  }

  const resume = await prisma.resume.findUnique({
    where: { userId: permission.user.id },
    select: {
      id: true,
      fileName: true,
      sizeBytes: true,
      updatedAt: true,
      text: true,
      // Whether the original file is stored, so we only offer a download when
      // there is genuinely something to download.
      fileStored: true,
      // A count is enough here: we only need to know whether feedback exists
      // yet, so the button can say "get" or "see".
      _count: { select: { analyses: true } },
    },
  });

  const wordCount = resume ? resume.text.split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Your resume
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        Upload your resume and InternPilot will read it, tell you what is working
        and what is not, and suggest the fields you are best suited to.
      </p>

      {resume ? (
        <div className="mt-8 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5">
          <p className="text-sm font-semibold text-brand-900">
            ✓ Your resume is uploaded
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">File</dt>
              <dd className="truncate text-right font-medium text-slate-900">
                {resume.fileName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Words read</dt>
              <dd className="text-right font-medium text-slate-900">
                {wordCount}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Size</dt>
              <dd className="text-right font-medium text-slate-900">
                {(resume.sizeBytes / 1024).toFixed(0)} KB
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Uploaded</dt>
              <dd className="text-right font-medium text-slate-900">
                {new Date(resume.updatedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/results"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              {resume._count.analyses > 0 ? "See my feedback" : "Get my feedback"}
            </Link>

            {resume.fileStored ? (
              // A plain link, not a button: the browser handles the download.
              <a
                href="/api/resume/download"
                className="rounded-xl border border-brand-300 px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-white"
              >
                Download your file
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Nothing uploaded yet. Choose a file below to get started.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {resume ? "Replace your resume" : "Upload"}
        </h2>

        {resume ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Uploading a new file replaces the one above, along with any feedback
            written about it. We keep one resume per account.
          </p>
        ) : null}

        <ResumeUploadForm hasExistingResume={Boolean(resume)} />

        <p className="mt-5 text-xs leading-relaxed text-slate-400">
          We keep both your uploaded file and the words we read from it. The file
          stays on your account so you can download it again, and so it can be
          attached to an application email later. It is never sent to an employer
          without you approving that specific email.
        </p>
      </div>
    </div>
  );
}
