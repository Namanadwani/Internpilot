// Checks every company feed in one go and describes what came back.
//
// Run it with:
//   npm run probe
//
// This is a DIAGNOSTIC. It reads nothing from your database, writes nothing, and
// is safe to run as often as you like. Its job is to answer the question the
// normal sync cannot:
//
//   when a company shows "0 internships", is that because the board genuinely
//   has no internships, or because we are reading the wrong field?
//
// The answer matters, because those two faults need opposite fixes. One means
// "drop this company"; the other means "fix the reader". By printing how many
// listings came back WITH a title, and a few real titles, it tells them apart.

import { boardUrl, fetchBoardJobs, isInternship } from "../lib/job-boards.js";

// The companies to check. Edit this list freely — it is a scratchpad, not the
// real list. The real list is lib/companies.js.
//
// Same token on a different board type is deliberate: Plaid and Benchling both
// failed as Lever boards, so we try the identical name as a Greenhouse board,
// which distinguishes "wrong name" from "wrong board".
const CANDIDATES = [
  // --- Greenhouse (this reader is already proven — a control group) ---
  { type: "greenhouse", token: "plaid", name: "Plaid (as Greenhouse)" },
  { type: "greenhouse", token: "benchling", name: "Benchling (as Greenhouse)" },
  { type: "greenhouse", token: "anthropic", name: "Anthropic" },
  { type: "greenhouse", token: "figma", name: "Figma" },
  { type: "greenhouse", token: "robinhood", name: "Robinhood" },
  { type: "greenhouse", token: "airbnb", name: "Airbnb" },
  { type: "greenhouse", token: "uber", name: "Uber" },
  { type: "greenhouse", token: "coinbase", name: "Coinbase" },

  // --- Lever (token AND reader are both unproven) ---
  { type: "lever", token: "palantir", name: "Palantir" },
  { type: "lever", token: "brex", name: "Brex" },

  // --- Ashby (token works; we need to see whether titles arrive at all) ---
  { type: "ashby", token: "openai", name: "OpenAI" },
  { type: "ashby", token: "mistral", name: "Mistral" },
];

const TIMEOUT_MS = 20000;
const SAMPLE_TITLES = 5;
const MAX_TITLE_CHARS = 88;

// Fetches a feed raw, without any of our readers, and describes its shape.
// Only called when something looks wrong, so most companies cost one request.
async function describeRawShape(company) {
  try {
    const response = await fetch(boardUrl(company), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return [`      raw re-check failed: ${response.status} ${response.statusText}`];
    }

    const data = await response.json();
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.jobs)
        ? data.jobs
        : [];

    if (raw.length === 0) {
      return ["      the raw feed held no listings at all"];
    }

    const lines = [`      raw listings: ${raw.length}`];
    lines.push(`      fields on the first one: ${Object.keys(raw[0]).join(", ")}`);

    // Ashby can mark postings as unlisted. We filter those out, so if the real
    // internships are sitting behind that flag, this is where it shows up.
    if (raw[0] && "isListed" in raw[0]) {
      const unlisted = raw.filter((job) => job.isListed === false).length;
      lines.push(`      marked isListed:false (we hide these): ${unlisted}`);
    }

    return lines;
  } catch (error) {
    return [`      raw re-check failed: ${error.message}`];
  }
}

function short(text) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();
  if (value.length === 0) return "(blank)";
  return value.length > MAX_TITLE_CHARS
    ? `${value.slice(0, MAX_TITLE_CHARS)}…`
    : value;
}

function label(company) {
  return `${company.name} — ${company.type} / ${company.token}`;
}

async function main() {
  const usable = [];
  const noInternships = [];
  const didNotConnect = [];

  console.log(`\nChecking ${CANDIDATES.length} company feeds. Read-only: nothing is stored or changed.`);

  for (const company of CANDIDATES) {
    console.log(`\n${label(company)}`);
    console.log(`  feed: ${boardUrl(company)}`);

    let jobs;
    try {
      jobs = await fetchBoardJobs(company);
    } catch (error) {
      console.log(`  ✗ DID NOT CONNECT — ${error.message}`);
      didNotConnect.push(`${label(company)}\n        ${error.message}`);
      continue;
    }

    const titled = jobs.filter((job) => job.title);
    const internships = jobs.filter((job) => isInternship(job.title));

    console.log(`  ✓ connected — ${jobs.length} listings came back`);
    console.log(`      with a real title:  ${titled.length}`);
    console.log(`      look like intern:   ${internships.length}`);

    if (titled.length > 0) {
      console.log("      sample titles:");
      for (const job of titled.slice(0, SAMPLE_TITLES)) {
        console.log(`        · ${short(job.title)}`);
      }
    }

    // The two interesting failures, each with the evidence needed to fix it.
    if (jobs.length > 0 && titled.length === 0) {
      console.log("      ⚠ NOT ONE listing had a title. The reader is reading the wrong field.");
      console.log((await describeRawShape(company)).join("\n"));
      noInternships.push(label(company));
    } else if (internships.length === 0) {
      console.log("      ⚠ Connected, but no title contains 'intern'. Raw shape, in case a field drifted:");
      console.log((await describeRawShape(company)).join("\n"));
      noInternships.push(label(company));
    } else {
      usable.push(`${label(company)} — ${internships.length} internships`);
    }
  }

  console.log("\n\n──────────────────────────────────────────────");
  console.log("Summary\n");

  console.log("  USABLE NOW (connected, and has internships):");
  console.log(
    usable.length > 0
      ? usable.map((line) => `    ✓ ${line}`).join("\n")
      : "    (none)",
  );

  console.log("\n  CONNECTED BUT NO INTERNSHIPS ON THE BOARD:");
  console.log(
    noInternships.length > 0
      ? noInternships.map((line) => `    · ${line}`).join("\n")
      : "    (none)",
  );

  console.log("\n  DID NOT CONNECT (wrong token, or wrong board):");
  console.log(
    didNotConnect.length > 0
      ? didNotConnect.map((line) => `    ✗ ${line}`).join("\n")
      : "    (none)",
  );

  console.log(
    "\n  Next step: put the USABLE ones into lib/companies.js, then run `npm run sync`.\n" +
      "  Nothing here changed your database — the probe only looks.\n",
  );
}

main().catch((error) => {
  console.error("\nThe probe did not finish:", error.message);
  process.exitCode = 1;
});
