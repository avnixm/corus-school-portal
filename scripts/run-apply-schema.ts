/**
 * Run scripts/apply-schema-idempotent.sql against DATABASE_URL.
 * Usage: npx tsx scripts/run-apply-schema.ts
 */
import "dotenv/config";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "@neondatabase/serverless";

config({ path: join(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

// Split SQL into statements, keeping DO $$ ... END $$; as one statement
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDoBlock = false;
  const lines = sql.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && !inDoBlock) continue;
    if (trimmed === "") continue;
    current += (current ? "\n" : "") + line;
    if (trimmed.startsWith("DO $$")) inDoBlock = true;
    if (inDoBlock && trimmed.endsWith("END $$;")) {
      inDoBlock = false;
      statements.push(current.trim());
      current = "";
    } else if (!inDoBlock && trimmed.endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((s) => s.length > 0);
}

async function main() {
  const sqlPath = join(process.cwd(), "scripts", "apply-schema-idempotent.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const statements = splitStatements(sql);
  const pool = new Pool({ connectionString });
  console.log(`Running ${statements.length} statements...`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    try {
      await pool.query(stmt);
      console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`  [${i + 1}/${statements.length}] SKIP (exists): ${preview}...`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] FAIL: ${preview}...`);
        console.error(err);
        await pool.end();
        process.exit(1);
      }
    }
  }
  await pool.end();
  console.log("Done.");
}

main();
