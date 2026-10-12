import { prisma } from "@/lib/db";

// Works out whether the database is ready, and if not, what the person should
// actually do about it — in plain English, never a stack trace.
//
// Returns either { ready: true } or
// { ready: false, title, detail } which the DatabaseNotice component displays.
export async function getDatabaseStatus() {
  if (!process.env.DATABASE_URL) {
    return {
      ready: false,
      title: "The database address is missing",
      detail:
        'InternPilot cannot find DATABASE_URL. Create a file called .env in the project root containing this one line: DATABASE_URL="file:./dev.db" — then restart the server (Ctrl+C, then npm run dev).',
    };
  }

  try {
    // The smallest possible query. If the tables exist, this quietly works.
    await prisma.user.count();
    return { ready: true };
  } catch (error) {
    const message = String(error?.message ?? "");
    const firstLine = message.split("\n").filter(Boolean).pop()?.trim() ?? "";

    const tablesMissing =
      message.includes("no such table") || message.includes("does not exist");

    if (tablesMissing) {
      return {
        ready: false,
        title: "The database has no tables yet",
        detail:
          "The database file is there, but it is empty. In the project folder, stop the server and run: npx prisma migrate dev --name init — then start it again with npm run dev.",
      };
    }

    return {
      ready: false,
      title: "The database could not be opened",
      detail: `InternPilot could not reach the database. Check the DATABASE_URL value in your .env file points at a file it is allowed to write to. Technical detail: ${firstLine}`,
    };
  }
}
