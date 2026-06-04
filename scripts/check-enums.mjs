import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const rows = await p.$queryRawUnsafe(`
    SELECT t.typname AS enum_name, e.enumlabel AS value
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('BlindAnswerValue', 'ReportReason')
    ORDER BY t.typname, e.enumsortorder;
  `);
  for (const r of rows) console.log(r.enum_name + "  " + r.value);
} catch (e) {
  console.error("ERR:", e);
} finally {
  await p.$disconnect();
}
