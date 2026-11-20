#!/usr/bin/env node
/**
 * Database helper (no Docker or Supabase CLI needed).
 *
 *   pnpm db:migrate   apply new files from supabase/migrations (each in a transaction)
 *   pnpm db:status    list applied and pending migrations
 *   pnpm db:seed      load the catalogue from packages/data seed files (safe to re-run)
 *
 * Applied migrations are recorded in supabase_migrations.schema_migrations, the same table the
 * Supabase CLI uses, so `supabase db push` can take over later without re-running anything.
 * The connection string comes from SUPABASE_DB_URL (environment, or apps/admin/.env.local).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");

function databaseUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  for (const file of ["apps/admin/.env.local", "apps/web/.env.local"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const match = fs.readFileSync(full, "utf8").match(/^SUPABASE_DB_URL=(.+)$/m);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  console.error("SUPABASE_DB_URL is not set (environment or apps/admin/.env.local).");
  process.exit(1);
}

export function connect() {
  return postgres(databaseUrl(), {
    ssl: "require",
    max: 1,
    connect_timeout: 60,
    onnotice: () => {},
  });
}

async function ensureTable(sql) {
  await sql`create schema if not exists supabase_migrations`;
  await sql`
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    )`;
}

function migrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()
    .map((f) => ({
      file: f,
      version: f.split("_")[0],
      name: f.replace(/^\d+_/, "").replace(/\.sql$/, ""),
    }));
}

async function applied(sql) {
  const rows = await sql`select version from supabase_migrations.schema_migrations`;
  return new Set(rows.map((r) => r.version));
}

async function migrate() {
  const sql = connect();
  try {
    await ensureTable(sql);
    const done = await applied(sql);
    const pending = migrationFiles().filter((m) => !done.has(m.version));
    if (pending.length === 0) {
      console.log("Database is up to date.");
      return;
    }
    for (const m of pending) {
      const body = fs.readFileSync(path.join(migrationsDir, m.file), "utf8");
      process.stdout.write(`Applying ${m.file} ... `);
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into supabase_migrations.schema_migrations (version, name, statements)
                 values (${m.version}, ${m.name}, ${[body]})`;
      });
      console.log("done");
    }
  } finally {
    await sql.end();
  }
}

async function status() {
  const sql = connect();
  try {
    await ensureTable(sql);
    const done = await applied(sql);
    for (const m of migrationFiles())
      console.log(`${done.has(m.version) ? "applied" : "PENDING"}  ${m.file}`);
  } finally {
    await sql.end();
  }
}

// Only act when run directly (db-seed.mts imports connect() from this file).
const runDirectly = path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (runDirectly) {
  const command = process.argv[2];
  if (command === "migrate") await migrate();
  else if (command === "status") await status();
  else {
    console.error(`Unknown command "${command ?? ""}". Use migrate or status.`);
    process.exit(1);
  }
}
