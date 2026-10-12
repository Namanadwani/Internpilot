import { signIn, signOut } from "@/auth";

// Signing in and out are done with ordinary HTML forms that submit to a small
// server function, rather than with JavaScript in the browser. That means they
// still work if JavaScript is slow to load, and there is no session-handling
// code for us to get wrong.

// "Continue with Google"
export function GoogleSignInButton({ label = "Continue with Google" }) {
  return (
    <form
      action={async () => {
        "use server";
        // Sends the student to Google, then brings them back to /account.
        await signIn("google", { redirectTo: "/account" });
      }}
    >
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-700 sm:w-auto"
      >
        <GoogleMark />
        {label}
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Log out
      </button>
    </form>
  );
}

// Google's four-colour "G". Drawn inline so we do not have to load an image.
function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.68a7.2 7.2 0 0 1 0-4.6V7.1H1.7a12 12 0 0 0 0 10.56l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.2 15.1 0 12 0A12 12 0 0 0 1.7 7.1l3.85 2.98C6.46 7.36 9 4.75 12 4.75Z"
      />
    </svg>
  );
}
