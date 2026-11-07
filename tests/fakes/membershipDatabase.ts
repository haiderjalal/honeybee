import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

/**
 * Embedded Postgres for database tests. It runs the real migration, so constraints, exclusions, row locks and
 * functions behave as they would in Postgres. Supabase Auth is stubbed with a minimal auth.users table.
 *
 * The engine serialises statements on one connection, so these tests cannot prove row-lock races. They prove the
 * invariants that the locks protect: no overspent allowance, no duplicate terms, and idempotent retries.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

/** Every migration in filename order, so later migrations can rely on earlier ones, as they do in Supabase. */
function readMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(join(MIGRATIONS_DIR, name), "utf8"));
}

export interface MembershipTestDatabase {
  /** Calls a membership RPC with the same payload shape Supabase RPC uses. Business errors reject with "membership: ...". */
  rpc: (name: string, payload: Record<string, unknown>) => Promise<unknown>;
  /** Runs a read-only SQL statement, for assertions. */
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** Creates a Supabase Auth user stub and returns its id. */
  createUser: () => Promise<string>;
  close: () => Promise<void>;
}

export async function createMembershipTestDatabase(): Promise<MembershipTestDatabase> {
  const db = await PGlite.create({ extensions: { btree_gist } });
  await db.exec("create schema auth; create table auth.users (id uuid primary key);");
  for (const migration of readMigrations()) {
    await db.exec(migration);
  }

  return {
    async rpc(name, payload) {
      const result = await db.query<{ result: unknown }>(`select ${name}($1::jsonb) as result`, [
        JSON.stringify(payload),
      ]);
      return result.rows[0]?.result;
    },
    async query<T>(sql: string, params: unknown[] = []) {
      const result = await db.query<T>(sql, params);
      return result.rows;
    },
    async createUser() {
      const result = await db.query<{ id: string }>(
        "insert into auth.users (id) values (gen_random_uuid()) returning id",
      );
      return result.rows[0].id;
    },
    async close() {
      await db.close();
    },
  };
}
