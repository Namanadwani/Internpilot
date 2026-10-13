// Working out how well an internship suits a student.
//
// Be clear about what this is: it counts words. It is not machine learning and
// it does not understand meaning — to this code "data" and "analytics" are
// simply different words. That limitation is why every score comes with its
// reasons attached. A student can read why something scored 72 and decide
// whether to trust it. A bare number invites trust it has not earned.

// Words too common to carry any signal. Without this list, every listing would
// "match" every resume on words like "team" and "experience".
const IGNORED_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "this", "that", "from", "they", "their", "who", "what", "when", "where",
  "work", "working", "works", "role", "team", "teams", "job", "jobs", "join",
  "company", "about", "into", "more", "most", "than", "other", "others", "such",
  "using", "use", "used", "ability", "able", "skills", "skill", "experience",
  "experienced", "strong", "good", "great", "excellent", "years", "year",
  "including", "include", "across", "within", "also", "well", "must", "should",
  "would", "could", "make", "made", "help", "helps", "looking", "seeking",
  "candidate", "candidates", "applicants", "opportunity", "opportunities",
  "please", "apply", "application", "benefits", "salary", "equal", "employer",
]);

// Pulls the meaningful words out of a piece of text.
export function notableWords(text) {
  const matches =
    String(text ?? "")
      .toLowerCase()
      .match(/[a-z][a-z0-9+#.]{2,}/g) ?? [];

  return matches.filter(
    (word) => word.length > 3 && !IGNORED_WORDS.has(word),
  );
}

// Scores one internship against one student.
//
// Returns { score, reasons } where score is 0-100 and reasons is a list of
// sentences written for the student to read.
export function scoreInternship({
  internship,
  bestFitFields = [],
  resumeText = "",
}) {
  const reasons = [];
  let score = 0;

  const title = String(internship.title ?? "").toLowerCase();
  const listing = `${title} ${String(internship.description ?? "").toLowerCase()}`;

  // 1. The best-fit fields the resume feedback produced. This is the strongest
  //    signal available, so it carries the most points.
  //
  //    Only the single best field counts. Otherwise a resume whose fields were
  //    "Data analysis", "Research", "Strategy", "Operations" and "Finance" would
  //    score highly on almost everything, which tells the student nothing.
  const fieldInTitle = bestFitFields.find((field) =>
    notableWords(field).some((word) => title.includes(word)),
  );
  const fieldInListing = bestFitFields.find((field) =>
    notableWords(field).some((word) => listing.includes(word)),
  );

  if (fieldInTitle) {
    score += 45;
    reasons.push(
      `The job title matches "${fieldInTitle}", one of your best-fit fields.`,
    );
  } else if (fieldInListing) {
    score += 25;
    reasons.push(
      `The description mentions "${fieldInListing}", one of your best-fit fields.`,
    );
  }

  // 2. Words the resume and the listing have in common.
  const shared = [...new Set(notableWords(resumeText))].filter((word) =>
    listing.includes(word),
  );

  if (shared.length > 0) {
    score += Math.min(35, shared.length * 3);
    reasons.push(
      `It uses ${shared.length} word${shared.length === 1 ? "" : "s"} that also appear in your resume — ${shared
        .slice(0, 5)
        .join(", ")}.`,
    );
  }

  // 3. Freshness. An internship posted this week is far likelier to still be
  //    open than one posted three months ago.
  if (internship.postedAt) {
    const days =
      (Date.now() - new Date(internship.postedAt).getTime()) / 86400000;

    if (days <= 14) {
      score += 20;
      reasons.push("It was posted in the last two weeks.");
    } else if (days <= 45) {
      score += 10;
      reasons.push("It was posted in the last six weeks.");
    }
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}
