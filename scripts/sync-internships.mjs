// Refreshes the cached internship listings from every company's job board.
//
// Run it with:
//   npm run sync
//
// It prints one line per company, so a wrong token shows up immediately instead
// of quietly producing a short list you cannot explain.
//
// Plain node runs this file directly (not through Next.js), which is why it uses
// relative imports and why package.json passes it .env explicitly.

import { PrismaClient } from "@prisma/client";
import { COMPANIES } from "../lib/companies.js";
import { fetchBoardJobs, isInternship } from "../lib/job-boards.js";

const prisma = new PrismaClient();

async function main() {
  // Anything not seen after this moment is treated as taken down. Recorded
  // before the first fetch, so a listing that vanishes mid-run is still counted
  // as seen if we fetched it in time.
  const runStartedAt = new Date();

  const lines = [];
  let kept = 0;

  for (const company of COMPANIES) {
    const label = `${company.name} (${company.type})`.padEnd(28);

    try {
      const jobs = await fetchBoardJobs(company);
      const internships = jobs.filter((job) => isInternship(job.title));

      for (const internship of internships) {
        await prisma.internship.upsert({
          where: {
            boardType_boardToken_externalId: {
              boardType: internship.boardType,
              boardToken: internship.boardToken,
              externalId: internship.externalId,
            },
          },
          update: { ...internship, lastSeenAt: new Date() },
          create: internship,
        });
      }

      kept += internships.length;
      lines.push(
        `  ✓ ${label} ${String(internships.length).padStart(4)} internships   (${jobs.length} listings on the board)`,
      );
    } catch (error) {
      lines.push(`  ✗ ${label} FAILED — ${error.message}`);
    }
  }

  console.log("\nFeed results:\n" + lines.join("\n"));

  // Listings we did not see this time have been taken down or filled.
  const removed = await prisma.internship.deleteMany({
    where: { lastSeenAt: { lt: runStartedAt } },
  });

  const total = await prisma.internship.count();

  console.log(`\n  Kept from this run:  ${kept}`);
  console.log(`  Removed as gone:     ${removed.count}`);
  console.log(`  Now stored in total: ${total}`);

  if (total === 0) {
    console.log(
      "\n  Nothing was stored. That means either every feed failed (see above),\n" +
        "  or none of the companies currently advertise anything with 'intern'\n" +
        "  in the title. Check the feed results first.",
    );
  }
}

main()
  .catch((error) => {
    console.error("\nThe sync did not finish:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
