import mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

// Turning an uploaded resume into plain text.
//
// Only two kinds of file are supported: PDF, and modern Word (.docx). The old
// .doc format is a completely different file layout and mammoth cannot read it,
// so we tell the student to re-save rather than fail mysteriously.

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Works out which kind of file this is. We check the file name as well as the
// reported type, because browsers sometimes send an empty or wrong type.
export function detectFileKind(fileName, mimeType) {
  const name = String(fileName ?? "").toLowerCase();
  const type = String(mimeType ?? "").toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";

  const docxType =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (type === docxType || name.endsWith(".docx")) return "docx";

  return null;
}

// Returns { ok: true, text, kind } or { ok: false, error } where error is a
// sentence written for a person, not a developer.
export async function extractTextFromFile({ buffer, fileName, mimeType }) {
  const kind = detectFileKind(fileName, mimeType);

  if (!kind) {
    const looksLikeOldWord = String(fileName ?? "").toLowerCase().endsWith(".doc");
    return {
      ok: false,
      error: looksLikeOldWord
        ? "That is an old .doc file, which we cannot read. Open it in Word and use Save As to save it as .docx, then upload that."
        : "We can only read PDF and Word (.docx) files. Please upload one of those.",
    };
  }

  let raw;
  try {
    if (kind === "pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractPdfText(pdf, { mergePages: true });
      raw = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      raw = result.value;
    }
  } catch (error) {
    const detail = String(error?.message ?? error).split("\n")[0];
    return {
      ok: false,
      error: `We could not open that file. It may be damaged or protected by a password. (${detail})`,
    };
  }

  const text = cleanText(raw);

  // A scanned resume is a picture of words, not words. Without this check the
  // student would upload a file, get an empty analysis, and have no idea why.
  if (text.length < 100) {
    return {
      ok: false,
      error:
        "We could not find any readable text in that file. If your resume is a scan or a photo, the words are part of the image — please upload the original document you typed it in.",
    };
  }

  return { ok: true, text, kind };
}

// Tidies the extracted text so the analysis is not fed pages of stray spaces.
function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
