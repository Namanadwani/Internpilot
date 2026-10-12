import { auth } from "@/auth";

// "Who is signed in right now?"
//
// auth() looks the session up in the database. If the database has not been set
// up yet, that throws an error — and we do NOT want a missing database to break
// pages that have nothing to do with signing in, like the landing page.
//
// So this wrapper treats "something went wrong" as "nobody is signed in".
// Pages that genuinely need the database check its status separately and show a
// helpful message instead (see lib/db-status.js).
export async function getOptionalSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
