import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireResumePermission } from "@/lib/require-consent";
import { extractTextFromFile, MAX_FILE_BYTES } from "@/lib/resume-text";

// Receives an uploaded resume, turns it into text, and saves both the text and
// the file itself.
//
// We keep the file so the student can download their own resume again, and so a
// later stage can attach it to an application email. The extracted words alone
// cannot be sent to an employer.
//
// Every error message below is written to be shown directly to a student.
export async function POST(request) {
  // Signed in AND gave resume permission. See lib/require-consent.js.
  const permission = await requireResumePermission();

  if (!permission.ok) {
    return NextResponse.json(
      {
        error:
          permission.reason === "not-signed-in"
            ? "Please sign in first."
            : "We need your permission to store and analyze your resume before we can accept it.",
      },
      { status: permission.status },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "We could not read that upload. Please try again." },
      { status: 400 },
    );
  }

  const file = formData.get("resume");

  // A string means the browser sent a text field rather than a file.
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "No file was attached. Please choose your resume and try again." },
      { status: 400 },
    );
  }

  // Checked here as well as in the browser. The browser check is there to be
  // helpful and fast; this one is the one that actually holds.
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        error:
          "That file is larger than 5 MB. Resumes are usually well under 1 MB — if yours is bigger, it probably has large images in it.",
      },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "That file appears to be empty." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const extracted = await extractTextFromFile({
    buffer,
    fileName: file.name,
    mimeType: file.type,
  });

  if (!extracted.ok) {
    return NextResponse.json({ error: extracted.error }, { status: 400 });
  }

  // One resume per account. Uploading again replaces the old one and deletes
  // any feedback that was written about it, so the student can never be shown
  // feedback that belongs to a resume they have since replaced.
  const resume = await prisma.$transaction(async (tx) => {
    const existing = await tx.resume.findUnique({
      where: { userId: permission.user.id },
    });

    if (existing) {
      await tx.analysis.deleteMany({ where: { resumeId: existing.id } });
      await tx.resume.delete({ where: { id: existing.id } });
    }

    return tx.resume.create({
      data: {
        userId: permission.user.id,
        fileName: file.name,
        fileType: extracted.kind,
        sizeBytes: file.size,
        text: extracted.text,
        // The file itself. Prisma stores this as a BLOB in the same database
        // file as everything else.
        fileData: buffer,
        fileStored: true,
      },
    });
  });

  return NextResponse.json({
    ok: true,
    fileName: resume.fileName,
    words: extracted.text.split(/\s+/).length,
  });
}
