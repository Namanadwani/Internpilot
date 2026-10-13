// The companies whose internship listings InternPilot follows.
//
// Adding a company is ONE LINE. Find the company's page on its job board, take
// the word from the address, and add it below:
//
//   https://boards.greenhouse.io/figma    →  { type: "greenhouse", token: "figma" }
//   https://jobs.lever.co/example         →  { type: "lever",      token: "example" }
//   https://jobs.ashbyhq.com/openai       →  { type: "ashby",      token: "openai" }
//
// Then run `npm run probe` — it checks the feed without touching the database —
// and `npm run sync` to fetch whatever it finds.
//
// Why a file and not a database table: with a handful of companies, a list you
// can read and edit in one place beats a table you need a tool to change. If
// students ever get to choose which companies they follow, that is the moment
// this becomes a real table.
//
// ── CHECKED AGAINST THE LIVE FEEDS on 13 Oct 2026 ───────────────────────────
//
// Every line below was verified with `npm run probe`, including how many
// internships each board was actually advertising that day. The list is short on
// purpose: six honest lines beat twelve where half return nothing.
//
// ⚠️ RE-CHECK BEFORE TRUSTING. Job boards change address without warning, and
// these companies hire interns seasonally — a board with 0 today may have 30 in
// February. The sync prints a count for every company so a drop to 0 is visible.

export const COMPANIES = [
  // --- Greenhouse ---
  { type: "greenhouse", token: "stripe", name: "Stripe" }, // 14 internships
  { type: "greenhouse", token: "databricks", name: "Databricks" }, // 13
  { type: "greenhouse", token: "robinhood", name: "Robinhood" }, // 24
  { type: "greenhouse", token: "coinbase", name: "Coinbase" }, // 27
  { type: "greenhouse", token: "figma", name: "Figma" }, // 7

  // --- Ashby ---
  // Connected and read its 808 listings correctly, but not one title contained
  // "intern" when checked. Kept because it is a real internship employer whose
  // postings appear seasonally, and because a second board type exercised on
  // every sync is how we would notice Ashby changing their format.
  { type: "ashby", token: "openai", name: "OpenAI" }, // 0 internships (808 listings)
];

// ── Companies we tried and rejected, so nobody wastes an hour retrying them ──
//
// These tokens DO NOT EXIST on the boards tried — both boards answered 404:
//   plaid, benchling, uber          (as Greenhouse)
//   brex                            (as Lever)
//   mistral                         (as Ashby)
//
//   palantir (as Lever) — never answered at all (timed out after 20 seconds).
//   That is NOT proof it is wrong; Lever may simply be slow or throttling. If
//   you want more companies, this is the one worth retrying first.
//
// These tokens are REAL and WORK, but had no internships advertised that day.
// They are decent candidates to add during internship season:
//   anthropic (Greenhouse) — 643 listings
//   airbnb    (Greenhouse) — 164 listings
//
// And no Lever company is listed at all, because none of the three we tried
// worked — which means lib/job-boards.js's Lever reader has never once run
// against a live feed. See the note at the top of that file.
