// Shows the feedback produced from a resume.
//
// Receives plain arrays, not JSON text — app/results/page.js unpacks what is
// stored in the database before passing it here.

export default function AnalysisResult({ analysis }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Overall</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {analysis.summary}
        </p>
      </section>

      <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">
          What is working
        </h2>
        <ul className="mt-4 space-y-3">
          {analysis.strengths.map((item, index) => (
            <li key={index} className="flex gap-3 leading-relaxed text-slate-700">
              <span aria-hidden="true" className="text-emerald-600">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">
          What to change
        </h2>
        <ol className="mt-4 space-y-3">
          {analysis.improvements.map((item, index) => (
            <li key={index} className="flex gap-3 leading-relaxed text-slate-700">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold text-amber-900"
              >
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Fields that suit you
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Best fit first. The internship matching stage will use this list.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {analysis.bestFitFields.map((field, index) => (
            <li
              key={index}
              className={
                index === 0
                  ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800"
              }
            >
              {field}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        Written by {analysis.model} on{" "}
        {new Date(analysis.createdAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        . Feedback is a second opinion, not a verdict — you know your experience
        better than a model does.
      </p>
    </div>
  );
}
