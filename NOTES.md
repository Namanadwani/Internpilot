# InternPilot — project notes

Last updated: 13 October 2026 (Stage 5 — the job-board feeds are now verified
against the live boards)
Stage 1, the build, and **Stage 5's feeds** are verified. Stages 2–5 and the
delete button are code complete and `npm run build` passes, but **nothing has
been exercised in a browser yet** — no sign-in, upload, analysis, download or
delete has ever been clicked through.

This file is the handover note for the project. If you open this repo in a new
session, or come back to it in a month, read this first.

---

## What this project is

InternPilot is a web app that helps students find internships. A student will be
able to:

1. Upload a resume. ✅ built
2. Get feedback on it, and find out which fields fit them best. ✅ built
3. See real internships matched to them, each with a match score. ✅ built
4. Get a tailored application email, approve it, and send it from their own
   Gmail. ⬜ later
5. Track the applications they have made. ⬜ later

**The hard limits on the product.** InternPilot will never message people on
social media, and will never mass-mail resumes automatically. A human always
reads and approves each individual email before it is sent. Anything built later
has to respect this.

**Why there is no Gmail permission in the sign-in.** Sending email as the student
is what Google calls a *restricted scope*. Letting the public use it requires
passing Google's app verification **and** a paid third-party security assessment.
Signing in only asks for name, email and profile picture, which needs no review
at all. InternPilot will draft emails for students to send themselves instead.
This decision was made deliberately — please do not quietly add Gmail scopes.

---

## Tech stack

| Piece | What we use | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Handles pages and server code in one project |
| Language | JavaScript (not TypeScript) | Easier to read while learning |
| Styling | Tailwind CSS v4 | Styles are written directly on the elements |
| Sign-in | Auth.js (next-auth v5) with its Google provider | Handles the OAuth plumbing |
| Database | SQLite, through Prisma | A single file. No signup, no server |
| Reading PDFs | `unpdf` | Pulls the text out of a PDF |
| Reading Word files | `mammoth` | Pulls the text out of a .docx |
| Resume feedback | Anthropic SDK (`@anthropic-ai/sdk`) | Calls a Claude model |
| Hosting | None yet | |

---

## How to run it

You need Node.js installed (version 18 or newer; this machine has v25).

```bash
# 1. Install the packages (only needed once, or after package.json changes)
npm install

# 2. Create the database tables (only needed once, or after changing
#    prisma/schema.prisma). Creates prisma/dev.db.
npx prisma migrate dev --name init

# 3. Start the development server
npm run dev
```

Then open <http://localhost:3000>. Stop the server with `Ctrl+C`.

Other commands:

```bash
npm run build   # makes a production version — run this before deploying
npm start       # runs the production version made by the command above
npm run sync    # fetches internships from the company job boards (Stage 5)
npm run probe   # describes each company feed. Reads only, writes nothing
npx prisma studio   # a visual browser for the database tables — very useful
```

`npm run sync` needs the network and hits six company job boards. Run it before
expecting `/internships` to show anything, and again whenever you want fresh
listings. It prints one line per company saying how many internships it found, so
a wrong company token is obvious straight away.

`npm run probe` is the diagnostic beside it. It reads the same feeds but writes
nothing to the database, and reports what each one actually returned: how many
listings, how many arrived **with a real title**, and a few sample titles. Use it
whenever a company's sync line says `0 internships`. The sync cannot tell you
whether that board has no internships or whether our reader is looking at the
wrong field; the probe can. **Editing the company list at the top of the probe is
expected** — it is a scratchpad for trying tokens out.

---

## Git

The repository was initialised on 13 October 2026. Everything through Stage 4 is
in the first commit:

```
4140ad1  Add InternPilot stages 1-4: landing, consent, Google sign-in,
         resume upload, feedback and file download
```

47 files, 6072 lines.

The habit from here is one commit per stage:

```bash
git add -A && git status --short    # look at what you are about to commit
git commit -m "what you changed"
```

**What is NOT in git, and why it matters:**

| Not committed | Why | Consequence |
| --- | --- | --- |
| `.env`, `.env.local` | They hold real keys | Clone the repo elsewhere and you must fetch the Google values and Anthropic key again |
| `prisma/dev.db` | It holds real student data | **The database and every uploaded resume are not backed up by committing.** Git is not a backup for your data, only for your code |
| `node_modules/` | Rebuilt by `npm install` | — |

To restore the database on a new machine, run
`npx prisma migrate dev --name init`. That rebuilds the empty tables. The rows
themselves — accounts, resumes, feedback — exist only in the `dev.db` file on
this computer. **Copy that file somewhere safe if it starts holding anything you
would be upset to lose.** Proper backups belong with the hosted database when
this is deployed.

---

## Environment variables (and setting up on another computer)

There are two environment files, on purpose:

| File | Holds | Committed to git? |
| --- | --- | --- |
| `.env` | `DATABASE_URL` — not a secret | **No** (ignored) |
| `.env.local` | Google values, `AUTH_SECRET`, `ANTHROPIC_API_KEY` — secrets | **No** (ignored) |
| `.env.example` | The names only, no values | Yes — it is the template |

`DATABASE_URL` lives in `.env` rather than `.env.local` because the Prisma
command-line tool only reads `.env`. Next.js reads both, so everything works.

| Variable | What it is | Where it comes from |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Google sign-in client | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google sign-in secret | Same screen — **never share this** |
| `AUTH_SECRET` | Random string protecting sign-in sessions | `openssl rand -base64 32` |
| `DATABASE_URL` | Where the database lives | `"file:./dev.db"` locally |
| `ANTHROPIC_API_KEY` | Writes the resume feedback | <https://console.anthropic.com> → API Keys |
| `ANTHROPIC_MODEL` | Optional. Which model to use | Leave unset to use the default in `lib/ai.js` |

**On a new computer:**

1. `npm install`
2. Copy `.env.example` to `.env`, and to `.env.local`
3. Fill in the two Google values and the Anthropic key — they are **not** in
   git, so fetch them again from the two websites
4. Generate a fresh `AUTH_SECRET`: `openssl rand -base64 32`
5. `npx prisma migrate dev --name init` to rebuild the tables
6. `npm run dev`

**To check which variables are filled without printing any values:**

```bash
awk -F= '/^[A-Z_]+=/{print $1, ($2=="" ? "EMPTY" : "SET")}' .env .env.local
```

If `AUTH_SECRET` is changed once real users exist, everyone is signed out at
once. That is expected, not a bug.

---

## Where everything lives

```
internpilot/
├── app/                       Every page lives here. A folder = a web address.
│   ├── layout.js              The frame around every page
│   ├── globals.css            Site-wide styles and our brand colours
│   ├── page.js                Landing page              → /
│   ├── consent/page.js        Consent screen            → /consent
│   ├── signin/page.js         Sign-in screen            → /signin
│   ├── account/page.js        Signed-in page            → /account
│   ├── account/actions.js     Deletes the account when the student asks
│   ├── resume/page.js         Upload your resume        → /resume
│   ├── results/page.js        Your feedback             → /results
│   ├── internships/page.js    Matched internships       → /internships
│   ├── terms/page.js          Terms (placeholder)       → /terms
│   ├── privacy/page.js        Privacy (placeholder)     → /privacy
│   └── api/
│       ├── auth/[...nextauth]/route.js   Google returns here after sign-in
│       ├── consent/route.js              Saves consent to the database
│       ├── resume/route.js               Upload: keeps the file AND the text
│       ├── resume/download/route.js      Gives you your own file back
│       └── analysis/route.js             Asks the AI for feedback
├── components/
│   ├── SiteHeader.js          Shows your name when signed in
│   ├── SiteFooter.js
│   ├── CookieBanner.js        Remembers the cookie choice
│   ├── ConsentForm.js         The three checkboxes
│   ├── AuthButtons.js         "Continue with Google" and "Log out"
│   ├── SavePendingConsent.js  Hands consent to the server after sign-in
│   ├── ResumeUploadForm.js    The file picker
│   ├── RunAnalysisButton.js   "Get my feedback"
│   ├── AnalysisResult.js      Draws the feedback
│   ├── InternshipCard.js      One internship, with its score and reasons
│   ├── DeleteConfirm.js       The two-step delete button
│   ├── DatabaseNotice.js      Friendly message when the database is not ready
│   └── LegalNotice.js         The lawyer-review warning
├── lib/
│   ├── storage.js             Safe browser-storage helpers
│   ├── db.js                  The one database connection
│   ├── db-status.js           Works out if the database is usable
│   ├── session.js             "Who is signed in?" — never throws
│   ├── require-consent.js     The signed-in-and-permitted gate
│   ├── resume-text.js         PDF/DOCX → plain text
│   ├── ai.js                  The resume feedback prompt. SERVER ONLY
│   ├── stored-lists.js        JSON text → real array (shared by two pages)
│   ├── companies.js           Which companies we follow. Edit this to add one
│   ├── job-boards.js          Reads Greenhouse, Lever and Ashby feeds
│   └── matching.js            Scores an internship against a resume
├── scripts/
│   ├── sync-internships.mjs   Fetches the feeds and fills the cache
│   └── probe-boards.mjs       Describes each feed. Reads only, writes nothing
├── prisma/
│   ├── schema.prisma          The database tables
│   └── migrations/            The recipe for building them (committed)
├── auth.js                    The sign-in setup
├── .env / .env.local          Configuration and secrets — never committed
├── .env.example               Template — safe to commit
├── .gitignore
└── NOTES.md                   This file
```

Useful habits:

- **To add a page:** make a folder in `app/` with a `page.js` inside it.
- **To change the brand colour:** the `@theme` block in `app/globals.css`.
- **"use client"** marks a file that has clicks or remembers state. Everything
  else runs on the server, where the database is reachable.
- **To change the tables:** edit `prisma/schema.prisma`, then run
  `npx prisma migrate dev --name describe_your_change`.
- **`lib/ai.js` must never be imported by a "use client" file.** It reads the
  API key. Importing it in the browser would ship the key to the browser.

---

## What is finished

### Stage 1 — the first screens (built and verified)

- [x] Landing page at `/` with the headline, three-step "how it works", and
      "Get started" buttons.
- [x] Cookie banner on every page that remembers the choice in the browser.
- [x] Consent page at `/consent` with three separate unticked checkboxes.
      Continue is disabled until the two required boxes are ticked.
- [x] Terms and Privacy placeholder pages with a prominent lawyer-review notice.
- [x] Responsive — one column on phones, wider on larger screens.
- [x] `npm install` and `npm run build` both succeed (Next.js 15.5.27); all pages
      prerender with no errors.

### Stage 2 — Google sign-in and saved users (written, not verified end to end)

- [x] Database added: SQLite through Prisma, with `User`, `Account`, `Session`,
      `VerificationToken` and `Consent` tables.
- [x] "Continue with Google" sign-in, asking for name, email and photo only.
- [x] A signed-in page at `/account` showing your name, your email, what you
      agreed to, and a **Log out** button.
- [x] The header shows your name once signed in.
- [x] **Consent is a real server-side record**, tied to your account.
- [x] Consent given *before* signing in is carried through the Google round trip
      and saved the moment we know who the student is.
- [x] A friendly plain-English panel when the database is not ready.

### Stage 3 — resume upload (written, not yet run)

- [x] `/resume` — a page to upload a resume, reachable from the header and the
      account page.
- [x] Accepts **PDF and .docx**, up to 5 MB. An old `.doc` file gets a message
      telling the student to re-save it as `.docx`.
- [x] **We keep the file as well as the text.** The uploaded file is stored
      inside the database, next to the words we read from it, so the student can
      download their own resume again — and so Stage 6 can attach it to an
      application email, which the extracted words alone could not do.
- [x] `/api/resume/download` gives a student their own file back. There is no id
      in the address: the file is looked up from the signed-in session, so you
      cannot ask for somebody else's resume by guessing a URL. Sent with
      `Cache-Control: private, no-store` so it does not linger on a shared
      computer.
- [x] A scanned or image-only resume gets an explanation instead of an empty
      result — "the words are part of the image".
- [x] One resume per account. Uploading again replaces the old one **and deletes
      any feedback written about it**, so you can never be shown feedback for a
      resume you have replaced.
- [x] `/resume` and `/results` redirect rather than error: not signed in → the
      sign-in page; signed in without resume permission → the consent page.

### Stage 4 — resume feedback (written, not yet run)

- [x] `/results` — asks a Claude model for feedback and draws it as four
      sections: an overall summary, what is working, what to change, and the
      fields that suit you best.
- [x] **The AI call happens on the server.** The browser sends no resume text and
      never sees the API key. It only says "go".
- [x] The feedback comes back as **structured data**, not prose — so the
      best-fit fields are a real list that Stage 5 (matching internships) can
      use directly.
- [x] The prompt forbids inventing experience, skills or employers that are not
      on the resume, and tells the model that coursework, projects and
      part-time jobs count as real evidence.
- [x] API failures are translated into sentences a student can act on (bad key,
      rate limit, no internet, unknown model) instead of a stack trace.

### Deleting your account (built)

- [x] A **Delete your account** button at the bottom of `/account`, in its own
      red-bordered box, deliberately nowhere near "Log out".
- [x] **Two steps.** The first click only reveals a panel naming what would be
      lost; nothing is destroyed until a second, differently-worded button is
      pressed. A panel that names the losses, rather than an "Are you sure?"
      popup that gets dismissed by reflex.
- [x] Deletes the account, the consent record, the resume **including the stored
      file bytes**, all the feedback, the Google account link and the sessions —
      in one database statement, via the `onDelete: Cascade` rules.
- [x] **Runs SQLite `VACUUM` afterwards.** Deleting a row does not erase its
      bytes from the file on disk; it marks the space as reusable. Vacuuming
      rewrites the file without those freed pages, which matters when the thing
      deleted is somebody's resume.
- [x] Signs the student out, sends them home, and clears the consent answers
      from their browser. The cookie-banner choice is left alone — it belongs to
      the device, not the account.
- [x] The panel says plainly what the button **cannot** do: undo an email
      already sent to an employer, or remove InternPilot from the student's
      Google account (that needs `myaccount.google.com/permissions`).

### Stage 5 — matching internships (built)

- [x] `/internships` — real internships from company job boards, ordered by how
      well they suit the student, each with a match score **and the reasons
      behind it**.
- [x] **Company job boards, not an API.** Greenhouse, Lever and Ashby all publish
      public feeds, so there is no key, no rate limit and nothing to pay for.
- [x] `lib/companies.js` holds the list. **Adding a company is one line** — pick
      the board type, copy the token out of the company's job-board address.
- [x] `lib/job-boards.js` has one small reader per board type. Three different
      JSON shapes go in, one shared shape comes out, so nothing downstream needs
      to know which board a listing came from.
- [x] `npm run sync` fetches every board and refreshes the cache, printing one
      line per company so a wrong token is obvious immediately.
- [x] **Only internship-titled listings are kept.** The filter uses word
      boundaries, because a plain `includes("intern")` also matches "Internal
      Audit" and "International Sales".
- [x] `lastSeenAt` marks each listing on every sync; anything not seen in the
      latest run is deleted, so filled or withdrawn internships disappear.
- [x] The score is **explainable**: it counts shared words between the resume and
      the listing, best-fit field matches, and how recently the listing was
      posted. Every score shows its working. A bare number would invite trust it
      has not earned.
- [x] Every card links to **the company's own page**. InternPilot never applies
      on a student's behalf.
- [x] If a student has no feedback yet, listings appear unscored with a prompt,
      rather than everyone seeing "0% match" and assuming the app is broken.
- [x] **Every company in `lib/companies.js` was checked against its live feed on
      13 October 2026** with `npm run probe`. Five Greenhouse boards (Stripe,
      Databricks, Robinhood, Coinbase, Figma) and one Ashby board (OpenAI) all
      answered correctly. That run stored **85 internships**.
- [x] The Greenhouse and Ashby readers are therefore **proven against real data**,
      not written from memory: every listing came back with a title, and Ashby's
      raw field names matched the ones the reader uses. **The Lever reader has
      never run once** — every Lever company we tried failed before parsing — so
      it stays marked unproven in the file, and no Lever company is configured.

### Notes on decisions made

- **Consent before sign-in.** The consent screen has to come first, because we
  cannot read a resume without permission. But at that moment we do not know who
  the student is. Their answers wait in browser storage for the round trip and
  are written to the database on arrival.
- **The cookie choice stays in the browser.** A cookie preference belongs to a
  device, not an account. That is deliberate and should not be "fixed".
- **`getOptionalSession()` never throws.** If the database is missing, the
  landing page still works; only sign-in complains.
- **The gate is checked on the server, every time.** `lib/require-consent.js`
  runs inside `/api/resume` and `/api/analysis`, not just on the pages. A
  disabled button in the browser is a courtesy, not a guarantee, and anyone can
  call an API route directly.
- **Lists are stored as JSON text.** SQLite cannot hold a list in a column, so
  `strengths`, `improvements` and `bestFitFields` are JSON strings that
  `app/results/page.js` unpacks. If you ever change database engines, these
  become real columns and that page gets simpler.
- **Running the analysis twice keeps both.** The newest one is shown. Nothing is
  silently overwritten.
- **We keep the uploaded file, and this was a deliberate change.** Stage 3 first
  kept only the extracted text, on the principle that less data held is less
  data to lose. That was changed on the user's instruction: a student should be
  able to get their own resume back, and Stage 6 needs the actual file to attach
  to an application email — you cannot send an employer a pile of extracted
  words. The trade-off is real and understood: the database now holds personal
  documents, so **the missing delete button matters more than it did before**.
  If you ever reverse this, three sentences on the site and one in the privacy
  policy must be changed back with it.
- **The file lives in the database, not in a folder.** SQLite stores it as a
  BLOB in `prisma/dev.db`. One place for all data, one thing to back up, and the
  already-gitignored file covers it. A folder would need its own gitignore rule
  and would not survive a deployment either.
- **`fileStored` exists so the pages never lie.** The columns are optional
  because a resume uploaded in the brief window before this change has no bytes
  stored. The pages check `fileStored` before offering a download, and the
  download route explains itself if the bytes are missing.
- **The download route takes no id.** Looking the file up from the session
  means there is no URL to tamper with. A `/api/resume/download?id=...` route
  would have needed an explicit ownership check on every request, and that is
  exactly the kind of check that gets forgotten.
- **Board text is decoded before its tags are stripped, not after.** The live
  feeds carry HTML entities even inside plain titles — Coinbase really does
  advertise an "Accounting Manager, GL Operations &amp; Intercompany". Decoding
  first also fixes the opposite case, where a board sends escaped HTML and the
  tags themselves arrive as `&lt;p&gt;`: decode, then strip, and they vanish.
  Strip first and the student's screen shows the literal characters `<p>`. The
  `&amp;` replacement is deliberately last, so a doubly escaped `&amp;lt;`
  becomes `&lt;` rather than an invented `<`.
- **Freshness is measured from `first_published`, not `updated_at`.** A listing
  the employer edited yesterday but opened five months ago is not a new opening,
  and a scoring rule that calls it "posted 1 day ago" is simply wrong. This was
  caught only because the probe printed the real field list.
- **The sync's listing count is a lie-detector, and it is why the probe exists.**
  "0 internships (808 listings on the board)" and "✗ FAILED" look nothing alike,
  and that difference is the whole point: it separated a board that genuinely has
  no interns (OpenAI) from a token that does not exist (Plaid, Benchling, Uber,
  Brex, Mistral — all 404) in a single run. Keep printing per-company lines.

---

## What is next

*(Stage 5 is built — see "What is finished" above. The one deviation from the
plan: there is no `CompanyBoard` table. With six companies, a list in
`lib/companies.js` that you can read and edit in one place beats a table you need
a tool to change. If students ever choose which companies they follow, that is
the moment it becomes a real table.)*

**Stage 6 — the application email.** It can only ever *draft* an email for the
student to send themselves; sending as them needs Google's verification plus a
paid security assessment. The resume file stored by Stage 3b is what gets
attached.

Plan, roughly: a `Draft` table holding subject and body; `lib/email-draft.js`
producing a first draft from the resume feedback and a chosen internship; an
approve-and-edit screen where **nothing is sent and no address is filled in until
the student acts**; and a "copy this" or `mailto:` hand-off rather than sending
on their behalf. The hard limits at the top of this file rule out anything
automatic.

**Stage 7 — the application tracker.** Which internships the student applied to,
when, and what came back.

**Known gaps to close before this is public:**

- ~~The five companies in `lib/companies.js` are unverified guesses.~~ **Closed
  13 October 2026.** All twelve candidates were checked against their live feeds
  with `npm run probe`. Five Greenhouse boards and one Ashby board work; five
  tokens (`plaid`, `benchling`, `uber`, `brex`, `mistral`) turned out not to
  exist and were dropped. `palantir` timed out instead of 404ing, so it may be
  real — it is the one worth retrying if you want more companies. **This is
  seasonal work:** a board with 0 internships today may have 30 in February, so
  re-run the probe when internship season opens.
- **The Lever reader has never once run.** No Lever company is configured,
  because all three we tried failed before any parsing happened. It is
  correct-looking code that has never seen a real Lever reply, so it may well be
  wrong. If you add a Lever company, probe it first — and remember a format
  mismatch shows up as *zero internships*, not as an error.
- **Greenhouse and Ashby are proven as of 13 October 2026, but job boards
  change.** If a company that used to report internships suddenly reports 0, run
  `npm run probe` before concluding it stopped hiring: the count of listings that
  arrived with a title is how a drifted format announces itself.
- **The match score counts words.** It does not understand meaning. "Data" and
  "analytics" are unrelated to it. This is why every score shows its reasons —
  but do not describe it to students as anything cleverer than it is.
- **The Terms and Privacy pages are placeholder text and must be reviewed by a
  lawyer.** Once the site is on a public URL this stops being a placeholder
  problem and becomes a real one.
- **Deleting is built; exporting is not.** A student can now delete everything,
  which is what the privacy policy promises. Still missing is the right to *take
  a copy* — there is no way to download your data before deleting it. The privacy
  policy must either promise that and have it built, or not promise it.
- **The model name in `lib/ai.js` is a guess.** It was written without access to
  the Anthropic documentation. If the feedback fails with a "model not found"
  message, set `ANTHROPIC_MODEL` in `.env.local` to a model your account can
  reach. The error message says exactly this.
- 8 npm vulnerabilities (4 moderate, 4 high) reported by `npm audit` after
  Stages 3 and 4 added `unpdf`, `mammoth` and the Anthropic SDK. The count has
  risen as dependencies were added and has never been investigated in detail —
  run `npm audit` to see the list. **Never run `npm audit fix --force`** —
  `--force` jumps major versions and will break things. Deal with these
  deliberately, one at a time.

---

## Rules for working on this project

- Explain each step in plain English before and after doing it.
- Show a short plan and wait for a "go" before writing code.
- Build only the stage that was asked for. Do not build ahead.
- Keep the code simple and commented.
- **Never put a secret key in a code file.** Use `.env.local`, which is
  gitignored. `.env.example` lists names only.
- Commit after every working step, with a clear message.

---

## Stage log

| Stage | What it added | Status |
| --- | --- | --- |
| 1 | Landing page, cookie banner, consent screen, legal placeholders | Built, verified |
| 2 | Google sign-in, database, `/account`, consent stored server-side | Written, **not verified end to end** |
| 3 | Resume upload: PDF/DOCX → text, consent gate, one per account | Written, builds clean |
| 4 | Resume feedback from a Claude model, best-fit fields | Written, builds clean |
| 3b | Resume file itself is now kept, plus a download route | Written, builds clean |
| 4b | Delete your account, with VACUUM and a two-step confirm | Written, builds clean |
| 5 | Internships from company job boards, with explainable match scores | Written, **feeds verified 13 Oct 2026** |

All of the above through Stage 4 is in commit `4140ad1`. Nothing has been run in
a browser yet. Stage 5 and the delete button — including the probe, the company
list and these notes — are written, their feeds verified, and committed
separately from `4140ad1`.

**A note on the migration names.** There are three migrations: `init` (Stage 2),
`store_resume_file` (Stage 3b) and `add_internships` (Stage 5). `store_resume_file`
is named after the last thing added, but it actually created the `Resume` **and**
`Analysis` tables as well — Stages 3 and 4 were never migrated separately, so it
did all of it. The name is only a label and does not affect anything. **Do not rename the folder**: Prisma
matches folder names against its own records, and renaming one that has already
been applied makes it think the migration is missing and offer to reset the
database.
