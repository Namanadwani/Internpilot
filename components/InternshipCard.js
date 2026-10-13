// One internship, with the score and the reasons behind it.

export default function InternshipCard({
  internship,
  score,
  reasons,
  showScore,
}) {
  // Colour by band rather than by exact number, so the badge reads at a glance.
  const badge =
    score >= 70
      ? "bg-emerald-100 text-emerald-900"
      : score >= 40
        ? "bg-brand-100 text-brand-900"
        : "bg-slate-100 text-slate-600";

  return (
    <li className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{internship.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {internship.company}
            {internship.location ? ` · ${internship.location}` : ""}
          </p>
        </div>

        {showScore ? (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${badge}`}
          >
            {score}% match
          </span>
        ) : null}
      </div>

      {showScore && reasons.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm leading-relaxed text-slate-600">
          {reasons.map((reason, index) => (
            <li key={index}>· {reason}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {/* Always the company's own page. InternPilot does not apply for you. */}
        <a
          href={internship.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          View on {internship.company}&apos;s site
        </a>

        {internship.postedAt ? (
          <span className="text-xs text-slate-400">
            Posted{" "}
            {new Date(internship.postedAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : null}
      </div>
    </li>
  );
}
