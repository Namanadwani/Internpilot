import Link from "next/link";

// The bar at the bottom of every page.
// It restates the promise the whole product is built around, and links to the
// two legal pages.
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          InternPilot never messages people on social media and never mass-mails
          resumes. You approve every email before it leaves your Gmail.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/terms" className="text-slate-500 hover:text-slate-900">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-slate-500 hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/consent" className="text-slate-500 hover:text-slate-900">
            Your permissions
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} InternPilot. Early build — not launched
          to the public yet.
        </p>
      </div>
    </footer>
  );
}
