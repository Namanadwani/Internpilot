import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireResumePermission } from "@/lib/require-consent";

// Gives the student their own uploaded resume back.
//
// A GET route, so the /resume page can link straight to it. There is no id in
// the address, on purpose: the file is looked up from the signed-in session, so
// there is no way to ask for somebody else's resume by guessing a URL.
export async function GET() {
  const permission = await requireResumePermission();

  if (!permission.ok) {
    return NextResponse.json(
      {
        error:
          permission.reason === "not-signed-in"
            ? "Please sign in first."
            : "We need your permission to access your resume.",
      },
      { status: permission.status },
    );
  }

  const resume = await prisma.resume.findUnique({
    where: { userId: permission.user.id },
    select: {
      fileName: true,
      fileType: true,
      fileData: true,
      fileStored: true,
    },
  });

  if (!resume) {
    return NextResponse.json(
      { error: "There is no resume stored on your account." },
      { status: 404 },
    );
  }

  if (!resume.fileStored || !resume.fileData) {
    return NextResponse.json(
      {
        error:
          "We have the text of your resume but not the original file — it was uploaded before we started keeping files. Upload it again and we will keep a copy.",
      },
      { status: 404 },
    );
  }

  // Prisma hands back a Uint8Array; NextResponse wants one too.
  const body = new Uint8Array(resume.fileData);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypeFor(resume.fileType),
      "Content-Length": String(body.byteLength),
      // "attachment" tells the browser to save the file rather than try to
      // display it on the page.
      "Content-Disposition": `attachment; filename="${safeFileName(resume.fileName, resume.fileType)}"`,
      // A resume is personal. "no-store" stops it sitting in the cache of a
      // shared or library computer.
      "Cache-Control": "private, no-store",
    },
  });
}

// Turns a file name into something safe to put in a response header.
//
// Header values cannot contain quotes or line breaks, and a name like
// "../../something" must not be treated as a path. Rather than try to allow
// clever names, we keep only the boring characters that real resume files use.
function safeFileName(name, fileType) {
  const cleaned = String(name ?? "")
    .replace(/\.{2,}/g, ".") // no ".."
    .replace(/[^A-Za-z0-9._ -]/g, "_") // no quotes, slashes, newlines
    .trim()
    .slice(0, 120);

  return cleaned || `resume.${fileType === "docx" ? "docx" : "pdf"}`;
}

function contentTypeFor(fileType) {
  if (fileType === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/pdf";
}
