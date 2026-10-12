import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireResumePermission } from "@/lib/require-consent";
import { analyseResume } from "@/lib/ai";

// Runs the AI analysis over the resume we already hold.
//
// The resume text is read from the database here on the server. The browser
// never sends the resume and never sees the API key — it only says "go".
export async function POST() {
  const permission = await requireResumePermission();

  if (!permission.ok) {
    return NextResponse.json(
      {
        error:
          permission.reason === "not-signed-in"
            ? "Please sign in first."
            : "We need your permission to analyze your resume first.",
      },
      { status: permission.status },
    );
  }

  const resume = await prisma.resume.findUnique({
    where: { userId: permission.user.id },
    select: { id: true, text: true },
  });

  if (!resume) {
    return NextResponse.json(
      { error: "Please upload your resume first." },
      { status: 400 },
    );
  }

  const result = await analyseResume(resume.text);

  if (!result.ok) {
    // 502: our server is fine, but the service we called did not answer well.
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // SQLite cannot store a list in a column, so the three lists are stored as
  // JSON text. See prisma/schema.prisma.
  const analysis = await prisma.analysis.create({
    data: {
      resumeId: resume.id,
      summary: result.feedback.summary,
      strengths: JSON.stringify(result.feedback.strengths),
      improvements: JSON.stringify(result.feedback.improvements),
      bestFitFields: JSON.stringify(result.feedback.bestFitFields),
      model: result.model,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: analysis.id });
}
