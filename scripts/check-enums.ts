import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient();
  const rows: { enum_name: string; value: string }[] = await p.$queryRawUnsafe(`
    SELECT t.typname AS enum_name, e.enumlabel AS value
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('BlindAnswerValue', 'ReportReason')
    ORDER BY t.typname, e.enumsortorder;
  `);
  for (const r of rows) console.log(`${r.enum_name}\t${r.value}`);
  await p.$disconnect();
}
main();
