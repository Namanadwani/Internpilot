"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";
import { signOut } from "@/auth";

// Deletes the signed-in student's account and everything attached to it.
//
// This is the only genuinely irreversible action in the whole app, so it is
// written to be read slowly.
export async function deleteMyAccount() {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // ONE statement, and everything goes with it.
  //
  // prisma/schema.prisma gives Consent, Resume, Analysis, Account and Session
  // an "onDelete: Cascade" rule pointing at User, and the migration SQL confirms
  // those rules exist in the database itself rather than only in the schema
  // file. So this line removes the consent record, the resume, the uploaded
  // file's bytes, every piece of feedback, the link to the Google account, and
  // the sessions.
  await prisma.user.delete({ where: { id: session.user.id } });

  // Deleting a row does NOT erase its bytes from the file on disk. SQLite marks
  // the space as reusable, so a deleted resume can sit inside dev.db until
  // something else happens to overwrite it. VACUUM rewrites the whole file
  // without those freed pages, which is what makes "deleted" actually mean
  // deleted when the deleted thing is somebody's resume.
  //
  // Best effort on purpose: the data is already gone by this point, and a
  // failure here must never make the deletion look like it did not work.
  try {
    await prisma.$executeRawUnsafe("VACUUM");
  } catch {
    // Ignored deliberately. See above.
  }

  // Clear the sign-in cookie and send them home.
  //
  // This runs AFTER the delete, because we needed the session to know whose
  // account to remove. That means the session row is already gone by now, and
  // the adapter's attempt to delete it a second time can complain — a complaint
  // that is not a failure, so it is swallowed. But the redirect signOut throws
  // on its way out IS how it succeeds, so that must be allowed through.
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    if (isRedirect(error)) throw error;
    // Otherwise: the cascade already removed the session. Carry on.
  }

  // Reached only if signOut did not redirect. The session no longer exists, so
  // the student is signed out either way.
  redirect("/");
}

// Next.js signals a redirect by throwing an object carrying a "NEXT_REDIRECT"
// digest. It is not an error, and swallowing it would break the navigation.
function isRedirect(error) {
  return (
    typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")
  );
}
