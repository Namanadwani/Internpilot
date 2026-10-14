// Reports which environment variables are set, WITHOUT printing any of their
// values.
//
// Run it with:
//   node scripts/check-env.mjs
//
// Why this exists: when a key is refused, the question is almost always "did the
// value get pasted correctly?", and that cannot be answered by looking at the
// value in a chat window — a secret pasted into a conversation is a secret
// leaked, permanently.
//
// So this prints only facts that are safe to share: is it set, how LONG is it,
// does it start the way that kind of key should, and is it still the placeholder
// from .env.example.
//
// It checks the SHELL ENVIRONMENT as well as the files, and that is the whole
// point of it. Next.js does not overwrite a variable that is already in the
// environment, so a stray `export ANTHROPIC_API_KEY=...` in ~/.zshrc silently
// beats .env.local — and no amount of editing .env.local will change that.
//
// Things this deliberately does NOT flag as problems: values wrapped in quotes,
// and stray spaces around a value. Both are stripped automatically by Next.js
// and by the Prisma CLI. A checker that complains about harmless things teaches
// you to ignore it.

import { readFileSync } from "node:fs";

// In the order Next.js reads them in development, most important first. The
// first file to define a variable is the one that wins, which is why .env.local
// beats .env. .env.example is never read by the app at all — it is here only so
// a leftover placeholder can be spotted.
const FILES = [
  ".env.development.local",
  ".env.local",
  ".env.development",
  ".env",
  ".env.example",
];

const ORDER = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
];

// Variables that only ever arrive from the shell, and that change where the
// Anthropic SDK sends its request. A base URL pointing at a proxy, or a token
// meant for a different service, would produce a refused key with nothing wrong
// in any .env file.
const SHELL_WATCH = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_SMALL_FAST_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "DATABASE_URL",
];

// What each value should look like. Only shape is checked, never content.
const EXPECTED = {
  DATABASE_URL: { startsWith: "file:" },
  AUTH_SECRET: { minLength: 32 },
  GOOGLE_CLIENT_ID: { endsWith: ".apps.googleusercontent.com" },
  GOOGLE_CLIENT_SECRET: { startsWith: "GOCSPX-" },
  ANTHROPIC_API_KEY: { startsWith: "sk-ant-" },
};

// Text that marks a value as a blank to be filled in rather than a real one.
const PLACEHOLDER_TEXT =
  /your[-_ ]|placeholder|change[-_ ]?me|replace[-_ ]?me|xxxx|<[^>]+>|\.\.\.|key[-_]?here|secret[-_]?here/i;

function parseEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return null; // file does not exist
  }

  const values = new Map();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;

    const name = trimmed.slice(0, equals).replace(/^export\s+/, "").trim();
    // Keep the raw right-hand side, quotes and all, so a leftover quote can be
    // reported as the harmless thing it is rather than silently normalised away.
    values.set(name, trimmed.slice(equals + 1));
  }

  return values;
}

function stripQuotes(raw) {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

// Describes one value without revealing it.
// `notes` are harmless observations. `problems` are things that break the app.
function inspect(name, raw) {
  const value = stripQuotes(raw);
  const notes = [];
  const problems = [];

  if (value.length === 0) problems.push("EMPTY");
  if (raw.trim() !== raw) notes.push("spaces around the value (trimmed automatically)");
  if (/^["']/.test(raw.trim())) notes.push("wrapped in quotes (stripped automatically)");
  if (/\s/.test(value)) problems.push("has a space or line break INSIDE it");

  const expected = EXPECTED[name] ?? {};
  if (value.length > 0) {
    if (expected.startsWith && !value.startsWith(expected.startsWith)) {
      problems.push(`should start with "${expected.startsWith}"`);
    }
    if (expected.endsWith && !value.endsWith(expected.endsWith)) {
      problems.push(`should end with "${expected.endsWith}"`);
    }
    if (expected.minLength && value.length < expected.minLength) {
      problems.push(`should be at least ${expected.minLength} characters`);
    }
  }

  return { value, notes, problems };
}

// A base URL is not a credential, but it can name an internal host, so only the
// site name is shown. That is enough to tell api.anthropic.com from a proxy.
function describeShellValue(name, value) {
  if (name === "ANTHROPIC_BASE_URL") {
    try {
      return `host ${new URL(value).host}`;
    } catch {
      return `unparseable URL (${value.length} characters)`;
    }
  }
  const { notes, problems } = inspect(name, value);
  const shape = problems.length === 0 ? "looks right" : `✗ ${problems.join("; ")}`;
  const extra = notes.length > 0 ? ` (${notes.join("; ")})` : "";
  return `${value.length} characters — ${shape}${extra}`;
}

const parsed = new Map(FILES.map((file) => [file, parseEnv(file)]));
const example = parsed.get(".env.example");

const problems = [];

// ── 1. The shell, which beats every file ────────────────────────────────────
console.log("\n── Your shell environment ──────────────────────────────");
console.log(
  "Next.js will NOT overwrite a variable that is already set here.\n" +
    "Anything listed below wins over .env.local, silently.\n",
);

const fromShell = new Set();

for (const name of SHELL_WATCH) {
  const value = process.env[name];
  if (value === undefined) continue;

  fromShell.add(name);
  console.log(`  ${name} = SET`);
  console.log(`      ${describeShellValue(name, value)}`);

  // The shell beats every file, so a wrong shape HERE is a real problem rather
  // than a curiosity. Missing this is what made an earlier version of this
  // script announce "no problems found" in the exact case it exists to catch:
  // a bad value in the shell, with a perfectly good-looking .env.local beside it
  // doing nothing at all.
  const shape = inspect(name, value).problems;
  if (shape.length > 0) {
    problems.push(
      `${name} — set in your shell, which beats every .env file, and it ${shape.join("; ")}`,
    );
  }
}

if (fromShell.size === 0) {
  console.log("  Nothing relevant is set in this shell.");
} else {
  console.log(
    `\n  ⚠ ${fromShell.size} variable(s) set in your shell. Any of these that also`,
  );
  console.log("    appear below are being ignored by the shell taking priority.");
}

// ── 2. The files ────────────────────────────────────────────────────────────
console.log("\n── The .env files ──────────────────────────────────────\n");

for (const name of ORDER) {
  console.log(name);

  let winner = null;

  // The shell is checked first because it is the one that actually wins.
  if (fromShell.has(name)) {
    winner = "your shell environment";
    console.log(`  ${"shell".padEnd(22)} ${describeShellValue(name, process.env[name])}`);
  }

  for (const file of FILES) {
    const values = parsed.get(file);

    if (values === null) {
      console.log(`  ${file.padEnd(22)} (no such file)`);
      continue;
    }

    if (!values.has(name)) {
      console.log(`  ${file.padEnd(22)} —`);
      continue;
    }

    const raw = values.get(name);

    // The template is not configuration.
    if (file === ".env.example") {
      console.log(`  ${file.padEnd(22)} has it (template — the app never reads this)`);
      continue;
    }

    const { value, notes, problems: found } = inspect(name, raw);
    const marks = [...found];

    // Only call something a leftover placeholder when it both matches the
    // template AND reads like a blank. .env.example legitimately carries a
    // working DATABASE_URL, and flagging that was crying wolf.
    const sameAsExample = example?.get(name) === raw;
    const isPlaceholder =
      sameAsExample && PLACEHOLDER_TEXT.test(value) && value.length > 0;

    if (isPlaceholder) marks.push("still the blank from .env.example");

    // A name with nothing after the "=" is always worth reporting: it looks
    // filled in at a glance, and it silently masks a real value in a
    // lower-priority file.
    if (value.length === 0) {
      problems.push(`${name} — ${file} has the line but no value after the "="`);
    }

    if (winner === null) winner = file;

    const line = `${value.length === 0 ? "EMPTY" : `${value.length} characters`}${
      marks.length > 0
        ? ` — ✗ ${marks.join("; ")}`
        : notes.length > 0
          ? ` — ${notes.join("; ")}`
          : " — looks right"
    }`;

    console.log(`  ${file.padEnd(22)} ${line}`);

    // A file only matters if it is the one that wins.
    if (winner === file && marks.length > 0) {
      problems.push(`${name} — the value in use comes from ${file} and ${marks.join("; ")}`);
    }
  }

  if (winner === null) {
    console.log("  → NOT SET ANYWHERE — the app reads nothing");
    problems.push(`${name} — not set in the shell or in any .env file`);
  } else {
    console.log(`  → in use: ${winner}`);
  }

  console.log("");
}

// ── 3. Names we do not recognise ────────────────────────────────────────────
// Catches the other way a key goes missing without being absent: it is in the
// file under a name the code never reads. The app asks for ANTHROPIC_API_KEY
// exactly, so ANTHROPIC_KEY, CLAUDE_API_KEY or ANT_KEY would all be invisible.
console.log("── Other variables in these files (names only) ─────────\n");

const known = new Set([...ORDER, ...SHELL_WATCH]);
const others = [];

for (const file of FILES) {
  if (file === ".env.example") continue;
  const values = parsed.get(file);
  if (values === null) continue;

  for (const [name, raw] of values) {
    if (known.has(name)) continue;
    others.push({ file, name, empty: stripQuotes(raw).length === 0 });
  }
}

if (others.length === 0) {
  console.log("  None — every variable in these files is one the app knows about.\n");
} else {
  for (const { file, name, empty } of others) {
    const suspicious = /ANTHROPIC|CLAUDE|API|KEY|SECRET|TOKEN/i.test(name);
    console.log(
      `  ${name.padEnd(28)} ${empty ? "EMPTY" : "set"}  (${file})${suspicious ? "   ← unrecognised — did you mean ANTHROPIC_API_KEY?" : ""}`,
    );
  }
  console.log("");
}

// ── 4. The verdict ──────────────────────────────────────────────────────────
console.log("──────────────────────────────────────────────");

if (problems.length === 0) {
  console.log(
    "\nNo problems found with how the variables are stored or where they come from.\n" +
      "If a key is still refused, the value itself is wrong or revoked. Generate a\n" +
      "fresh one at the site it came from, paste it in, and restart the server.\n",
  );
} else {
  console.log("\nProblems found:\n");
  for (const problem of problems) console.log(`  · ${problem}`);
  console.log(
    '\nFix the value at the source named as "in use", save, then restart the server.\n',
  );
}
