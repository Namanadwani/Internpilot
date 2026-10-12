import { prisma } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";

// The gate in front of anything that touches a resume.
//
// Checks two things, in order:
//   1. Is somebody signed in?
//   2. Did they tick "InternPilot may store and analyze my resume"?
//
// Both, not just the first. A signed-in student who never gave resume
// permission must not have their resume read — that is the entire point of
// asking. A disabled button in the browser is a courtesy, not a guarantee, so
// the check happens here on the server where it cannot be skipped.
export async function requireResumePermission() {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    return { ok: false, reason: "not-signed-in", status: 401 };
  }

  const consent = await prisma.consent.findUnique({
    where: { userId: session.user.id },
  });

  if (!consent?.acceptedTerms || !consent?.resumePermission) {
    return { ok: false, reason: "no-permission", status: 403 };
  }

  return { ok: true, user: session.user };
}
