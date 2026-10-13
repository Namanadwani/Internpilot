// SQLite cannot store a list inside a column, so lib/ai.js writes the feedback
// lists as JSON text. This turns that text back into a real array, and shrugs if
// it is unreadable rather than crashing a page.
//
// Shared by the results page and the internships page, so the two can never
// drift apart over how the data is stored.
export function parseStoredList(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
