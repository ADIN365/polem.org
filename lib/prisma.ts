import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __polemPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__polemPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__polemPrisma = prisma;
}
