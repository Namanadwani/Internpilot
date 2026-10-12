import Link from "next/link";
import ConsentForm from "@/components/ConsentForm";

export const metadata = {
  title: "Before we start — InternPilot",
};

// The page a student lands on after pressing "Get started".
// The actual checkboxes live in components/ConsentForm.js, because they need
// to remember clicks — this page is just the surrounding text.
export default function ConsentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Before we start
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        Two of these are needed for InternPilot to work. The third is entirely
        up to you, and you can change your mind at any time.
      </p>

      <div className="mt-8">
        <ConsentForm />
      </div>
    </div>
  );
}
