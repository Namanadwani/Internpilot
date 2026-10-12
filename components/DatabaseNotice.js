// Shown when the database is not ready. The wording comes from
// lib/db-status.js, which works out what is actually wrong and what to do.
//
// The point of this component is that a beginner should never be greeted by a
// wall of red error text. They should be told, in one sentence, what to run.
export default function DatabaseNotice({ status }) {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-900">⚠️ {status.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900">
        {status.detail}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-amber-900">
        Sign-in needs somewhere to save people. Nothing is broken — the database
        just has not been created yet.
      </p>
    </div>
  );
}
