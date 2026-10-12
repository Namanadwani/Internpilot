import { PrismaClient } from "@prisma/client";

// One shared connection to the database.
//
// While you are developing, Next.js reloads files every time you save. Without
// the check below, each reload would open a brand new database connection until
// the database refused to accept any more. Keeping the connection on `globalThis`
// means it is created once and reused.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
