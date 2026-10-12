import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/session";
import { getDatabaseStatus } from "@/lib/db-status";
import { GoogleSignInButton } from "@/components/AuthButtons";
import DatabaseNotice from "@/components/DatabaseNotice";

export const metadata = {
  title: "Sign in — InternPilot",
};

// Where a student lands after accepting the consent screen.
//
// The database is checked FIRST. Asking "who is signed in?" needs the database,
// and if it is not ready that question would throw an error. Checking first
// means we can explain the problem instead.
export default async function SignInPage() {
  const database = await getDatabaseStatus();

  if (!database.ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Sign in
        </h1>
        <div className="mt-8">
          <DatabaseNotice status={database} />
        </div>
      </div>
    );
  }

  // Already signed in? There is nothing to do here.
  const session = await getOptionalSession();
  if (session?.user) {
    redirect("/account");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Create your account
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        Sign in so your resume, your matches and your applications are still
        here next time you visit.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 p-6 sm:p-8">
        <GoogleSignInButton />

        <p className="mt-5 text-sm leading-relaxed text-slate-500">
          We receive your name, email address and profile picture from Google.
          Nothing else — we are not asking for access to your Gmail, and
          InternPilot will never send an email on your behalf.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          By continuing you agree to the{" "}
          <a href="/terms" className="font-medium text-brand-700 underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="font-medium text-brand-700 underline">
            Privacy Policy
          </a>
          , which you confirmed on the previous screen.
        </p>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Signing in keeps your data between visits. You can log out at any time,
        and we will add a way to delete your account in a later stage.
      </p>
    </div>
  );
}
