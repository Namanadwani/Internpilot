import Link from "next/link";
import { getOptionalSession } from "@/lib/session";
import { SignOutButton } from "@/components/AuthButtons";

// The thin bar at the top of every page.
//
// Since Stage 2 it is an `async` component, because it asks the database who is
// signed in. getOptionalSession() returns null rather than throwing if the
// database is not set up, so this header can never break the landing page.
export default async function SiteHeader() {
  const session = await getOptionalSession();
  const user = session?.user;

  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Intern<span className="text-brand-600">Pilot</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/resume"
              className="rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:px-3"
            >
              Resume
            </Link>
            <Link
              href="/internships"
              className="rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:px-3"
            >
              Internships
            </Link>
            <Link
              href="/account"
              className="max-w-[5rem] truncate px-1 text-sm font-medium text-slate-700 hover:text-slate-900 sm:max-w-[10rem]"
            >
              {user.name ?? user.email}
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/consent"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Get started
          </Link>
        )}
      </div>
    </header>
  );
}
