// Reading internship listings from company job boards.
//
// Three companies publish their job boards in three different shapes. This file
// holds one small reader for each, and they produce the SAME shape — so nothing
// else in InternPilot has to care which board a listing came from.
//
// Deliberately free of "@/" imports: scripts/sync-internships.mjs runs this file
// with plain node, which does not understand that shortcut.
//
// ── VERIFIED AGAINST LIVE FEEDS, 13 Oct 2026, by `npm run probe` ─────────────
//
//   ✓ Greenhouse — 8 boards read, and every single listing arrived with a title
//                  (721, 643, 149, 181, 164, 225…). Proven.
//   ✓ Ashby      — OpenAI's 808 listings all arrived with titles, and the raw
//                  field names matched the ones used below exactly. Proven.
//   ? Lever      — NEVER EXERCISED. Every company tried on it failed before any
//                  parsing happened (404s, and one timeout), so readLever() is
//                  correct-looking code that has never seen a real Lever reply.
//                  No Lever company is configured in lib/companies.js because of
//                  this. If you add one, run `npm run probe` first.

export const BOARD_TYPES = ["greenhouse", "lever", "ashby"];

// Where each board keeps its public feed. No API key is needed for any of them.
export function boardUrl({ type, token }) {
  switch (type) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
    case "lever":
      return `https://api.lever.co/v0/postings/${token}?mode=json`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${token}`;
    default:
      throw new Error(`Unknown board type "${type}"`);
  }
}

// Fetches one company's board and returns every listing, normalised.
// Throws with a short readable reason if the company or its token is wrong.
export async function fetchBoardJobs(company) {
  const response = await fetch(boardUrl(company), {
    headers: { accept: "application/json" },
    // A feed that never answers must not hang the whole sync.
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText} — check the token "${company.token}" is right for a ${company.type} board`,
    );
  }

  const data = await response.json();

  switch (company.type) {
    case "greenhouse":
      return readGreenhouse(data, company);
    case "lever":
      return readLever(data, company);
    case "ashby":
      return readAshby(data, company);
    default:
      throw new Error(`Unknown board type "${company.type}"`);
  }
}

// Whether a job title looks like an internship.
//
// The obvious version of this — title.includes("intern") — also matches
// "Internal Audit" and "International Sales", which is why it is written with
// word boundaries. We filter on the TITLE only, so a genuine internship filed
// under an odd title will be missed. That trade is deliberate: missing a few is
// better than filling a student's page with senior roles.
const INTERNSHIP_TITLE =
  /\b(intern|interns|internship|internships|placement|working student|graduate scheme|summer analyst)\b/i;

export function isInternship(title) {
  return INTERNSHIP_TITLE.test(String(title ?? ""));
}

// ---------------------------------------------------------------- readers
//
// Each one takes that board's JSON and returns our shape:
//   { externalId, boardType, boardToken, title, company, location, url,
//     description, postedAt }

function readGreenhouse(data, company) {
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return jobs.map((job) => ({
    externalId: String(job.id),
    boardType: company.type,
    boardToken: company.token,
    title: plainText(job.title),
    company: company.name,
    location: plainText(job.location?.name),
    url: job.absolute_url,
    description: plainText(job.content),
    // first_published, not updated_at: a listing the employer edited yesterday
    // but opened five months ago is not a new opening, and the score should not
    // reward it as one. updated_at is only the fallback.
    postedAt: toDate(job.first_published ?? job.created_at ?? job.updated_at),
  }));
}

// UNEXERCISED — see the note at the top of this file.
function readLever(data, company) {
  const jobs = Array.isArray(data) ? data : [];

  return jobs.map((job) => ({
    externalId: String(job.id),
    boardType: company.type,
    boardToken: company.token,
    title: plainText(job.text),
    company: company.name,
    location: plainText(job.categories?.location),
    url: job.hostedUrl,
    description: plainText(job.descriptionPlain) ?? plainText(job.description),
    // Lever sends a Unix timestamp in milliseconds, as a number or a string.
    postedAt: job.createdAt ? toDate(Number(job.createdAt)) : null,
  }));
}

function readAshby(data, company) {
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return jobs
    // Ashby can hold unlisted drafts; those are not real openings.
    .filter((job) => job.isListed !== false)
    .map((job) => ({
      externalId: String(job.id),
      boardType: company.type,
      boardToken: company.token,
      title: plainText(job.title),
      company: company.name,
      location: plainText(job.location),
      url: job.jobUrl,
      description: plainText(job.descriptionHtml) ?? plainText(job.descriptionPlain),
      postedAt: toDate(job.publishedAt ?? job.updatedAt),
    }));
}

// ---------------------------------------------------------------- helpers

// Turns any value from a board into clean display text, or null.
//
// Board text arrives three ways, sometimes all at once: with HTML entities in it
// ("Accounting Manager, GL Operations &amp; Intercompany" — a real title taken
// from Coinbase's board), wrapped in HTML tags, and occasionally as escaped HTML
// where the tags themselves are entity-encoded.
//
// Decoding BEFORE stripping tags is what makes those all work: an escaped "&lt;p&gt;"
// becomes a real "<p>", which the tag-stripper then removes. Doing it the other
// way round leaves the literal characters "<p>" sitting in the text.
function plainText(value) {
  if (typeof value !== "string") return null;

  const withoutTags = unescapeHtml(value)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  const collapsed = withoutTags.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

// "&amp;" is replaced LAST on purpose. Doing it first would turn a doubly
// escaped "&amp;lt;" into "&lt;" and then into a bare "<", inventing a character
// the board never sent.
function unescapeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Returns a real Date, or null if the value is missing or unparseable.
function toDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
