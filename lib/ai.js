import Anthropic from "@anthropic-ai/sdk";

// Asking the AI for feedback on a resume.
//
// Two rules shape everything here:
//
//   1. This runs on the SERVER only. The API key is read from the environment
//      and never reaches the browser. Nothing in this file may be imported by a
//      "use client" component.
//   2. The answer comes back as structured data (a summary, plus three lists),
//      not as a paragraph of prose. That way the best-fit fields are a real list
//      the matching stage can actually use, instead of something we would have
//      to guess at by reading English.

// Read from the environment so it can be changed without editing code.
// See NOTES.md for which models are available.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

// Resumes are short. This is a guard against a huge file costing a fortune.
const MAX_CHARACTERS = 20000;

// Describing the answer we want as a "tool" is the most reliable way to get
// back clean JSON. The model fills in the fields rather than writing prose we
// would have to parse.
const FEEDBACK_TOOL = {
  name: "save_feedback",
  description:
    "Record the feedback about this resume. Every list should hold between 3 and 5 items.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "Three to five sentences of overall feedback, written directly to the student as 'you'. Say what the resume says about them as a candidate.",
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description:
          "Three to five specific things this resume already does well. Quote or point at the actual content — no generic praise.",
      },
      improvements: {
        type: "array",
        items: { type: "string" },
        description:
          "Three to five specific, actionable changes. Each one should say what to change and, where possible, what it should say instead. No filler like 'add more detail'.",
      },
      bestFitFields: {
        type: "array",
        items: { type: "string" },
        description:
          "Three to five job fields or industries this person is best suited to, best fit first. Short names, e.g. 'Data analysis', 'UX research', 'Backend engineering'.",
      },
    },
    required: ["summary", "strengths", "improvements", "bestFitFields"],
  },
};

const SYSTEM_PROMPT = `You are an experienced, honest careers adviser at a university, helping a student improve their resume.

How to write:
- Speak directly to the student as "you".
- Be specific and concrete. Point at what is actually on the resume.
- Be encouraging without flattering. Empty praise teaches nothing.
- Plain English. No corporate jargon, no "leverage", no "synergy".

Hard rules:
- NEVER invent experience, skills, employers, or qualifications that are not on the resume. If something important is missing, say it is missing — do not fill it in.
- Base best-fit fields only on evidence in the resume. If it is thin, say the fit is a starting guess and explain what would make it clearer.
- Most students using this are early in their careers and may have little formal work experience. Coursework, projects, volunteering and part-time jobs all count as evidence — treat them as real.
- Never mention that you are an AI.`;

// Turns whatever the model sent into a tidy array of non-empty strings.
function toList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

// Returns { ok: true, feedback, model } or { ok: false, error } where error is
// a sentence to show the student.
export async function analyseResume(resumeText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Resume feedback is not switched on yet. It needs an ANTHROPIC_API_KEY in the .env.local file — see the 'Environment variables' section of NOTES.md.",
    };
  }

  const text = String(resumeText ?? "").slice(0, MAX_CHARACTERS);

  if (text.trim().length < 100) {
    return {
      ok: false,
      error: "There is not enough text in this resume to give useful feedback.",
    };
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [FEEDBACK_TOOL],
      // Force the model to answer using our tool, so the reply is always in the
      // shape we asked for.
      tool_choice: { type: "tool", name: "save_feedback" },
      messages: [
        {
          role: "user",
          content: `Please give me feedback on this resume.\n\n<resume>\n${text}\n</resume>`,
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");

    if (!toolUse?.input) {
      return {
        ok: false,
        error:
          "The feedback came back in an unexpected shape. Please try again — if it keeps happening, the model name in lib/ai.js may need updating.",
      };
    }

    const strengths = toList(toolUse.input.strengths);
    const improvements = toList(toolUse.input.improvements);
    const bestFitFields = toList(toolUse.input.bestFitFields);
    const summary = String(toolUse.input.summary ?? "").trim();

    // If the model returned nothing usable, say so rather than saving an empty
    // result the student would stare at.
    if (!summary || improvements.length === 0) {
      return {
        ok: false,
        error: "The feedback came back empty. Please try again.",
      };
    }

    return {
      ok: true,
      model: message.model ?? MODEL,
      feedback: { summary, strengths, improvements, bestFitFields },
    };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

// Turns an API failure into something a person can act on.
function describeError(error) {
  const status = error?.status;
  const message = String(error?.message ?? error).split("\n")[0];

  if (status === 401) {
    return "The AI key was refused. Check that ANTHROPIC_API_KEY in .env.local is correct, then restart the server.";
  }
  if (status === 429) {
    return "We are being rate-limited by the AI service. Wait a minute and try again.";
  }
  if (status === 404) {
    return `The model "${MODEL}" was not found on your account. Change ANTHROPIC_MODEL in .env.local to a model you have access to.`;
  }
  if (status >= 500) {
    return "The AI service had a temporary problem. Please try again in a moment.";
  }
  if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
    return "We could not reach the AI service. Check your internet connection and try again.";
  }

  return `Something went wrong while writing your feedback. (${message})`;
}
