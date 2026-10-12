import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/session";
import { prisma } from "@/lib/db";

// Receives the consent answers that the student gave BEFORE signing in, and
// saves them against their account.
//
// Why this exists: the consent page has to come before sign-in, because we
// cannot read a resume without permission. But at that moment we do not yet
// know who the student is. So their answers wait in the browser for the Google
// round trip, and this route writes them down once we know who they are.
export async function POST(request) {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const acceptedTerms = Boolean(body.acceptedTerms);
  const resumePermission = Boolean(body.resumePermission);
  const emailPermission = Boolean(body.emailPermission);

  // Check again on the server. A disabled button in the browser is a courtesy,
  // not a guarantee — never trust that the two required boxes were really ticked.
  if (!acceptedTerms || !resumePermission) {
    return NextResponse.json(
      { error: "The required permissions are missing" },
      { status: 400 }
    );
  }

  // upsert = update if an answer already exists for this student, otherwise
  // create it. Re-agreeing refreshes the date rather than making a duplicate.
  const consent = await prisma.consent.upsert({
    where: { userId: session.user.id },
    update: {
      acceptedTerms,
      resumePermission,
      emailPermission,
      agreedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      acceptedTerms,
      resumePermission,
      emailPermission,
    },
  });

  return NextResponse.json({ ok: true, agreedAt: consent.agreedAt });
}
